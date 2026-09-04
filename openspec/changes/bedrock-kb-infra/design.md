# Design: bedrock-kb-infra

## Decisiones de Arquitectura

| Decisión | Elección | Alternativa descartada | Razón |
|---|---|---|---|
| Vector store | OpenSearch Serverless (managed) | Pinecone, pgvector | AWS lo gestiona automáticamente; sin infra adicional; incluido en Bedrock KB |
| Embedding model | `amazon.titan-embed-text-v2:0` | `cohere.embed-multilingual-v3` | Menor costo, sin egress extra, suficiente para FAQ en español |
| Chunking | `FIXED_SIZE` 300 tokens, 20% overlap | `HIERARCHICAL`, `SEMANTIC` | El FAQ tiene secciones cortas y bien definidas; fixed size es predecible |
| IAM | Role con policy inline | Managed policies | Principio de mínimo privilegio; evita permisos heredados |
| Bucket naming | `${project_name}-kb-${environment}-${random_id}` | nombre fijo | S3 requiere unicidad global; random_id de 4 bytes evita colisiones |
| Backend Terraform | local (`.tfstate` en disco) | S3 remote backend | Proyecto personal / dev; no requiere colaboración ni lock remoto |
| AWS Provider | `>= 5.0` | `4.x` | `aws_bedrockagent_*` solo existe desde 5.x |

---

## Naming Convention

```
Recurso                    Nombre resultante (ejemplo dev)
─────────────────────────────────────────────────────────
S3 Bucket                  dreamhouse-kb-dev-a1b2
IAM Role                   dreamhouse-bedrock-kb-role-dev
IAM Policy (inline)        dreamhouse-bedrock-kb-policy-dev
Knowledge Base             dreamhouse-kb-dev
Data Source                dreamhouse-kb-datasource-dev
```

Todos los recursos llevan tags:
```hcl
tags = {
  Project     = var.project_name
  Environment = var.environment
  ManagedBy   = "terraform"
}
```

---

## Diagrama de Dependencias Terraform

```
random_id
    │
    └──► aws_s3_bucket
              │
              ├──► aws_s3_bucket_public_access_block
              │
              └──► aws_s3_object (dreamhouse-knowledge-base.md)
                        │
                        ▼
              aws_iam_role ──────────────────────────────┐
                    │                                     │
              aws_iam_role_policy                         │
                    │                                     │
                    └──► aws_bedrockagent_knowledge_base ◄┘
                                    │
                                    └──► aws_bedrockagent_data_source
                                                    │
                                                    ▼
                                              outputs.tf
                                    (knowledge_base_id, data_source_id,
                                     s3_bucket_name, s3_object_key)
```

---

## Design detallado por archivo

### `main.tf`
```
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws    = ">= 5.0"
    random = ">= 3.0"   ← para el sufijo único del bucket
  }
}

provider "aws" {
  region = var.aws_region
}
```

**Sin backend remoto** — el `.tfstate` queda local. Agregar `.tfstate` al `.gitignore`.

---

### `variables.tf`

```hcl
variable "aws_region"           { default = "us-east-1" }
variable "project_name"         { default = "dreamhouse" }
variable "environment"          { default = "dev" }
variable "embedding_model_arn"  {
  default = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
}
```

---

### `s3.tf` — 3 recursos

**1. `random_id.bucket_suffix`**
Genera 4 bytes (8 hex chars) para unicidad global del bucket.

**2. `aws_s3_bucket.kb_documents`**
```
bucket = "${var.project_name}-kb-${var.environment}-${random_id.bucket_suffix.hex}"
```
Sin versionado — el documento se sobreescribe con cada `apply`.

**3. `aws_s3_bucket_public_access_block.kb_documents`**
Los 4 flags en `true`. Bedrock accede vía IAM, nunca por URL pública.

**4. `aws_s3_object.knowledge_base`**
```
bucket       = aws_s3_bucket.kb_documents.id
key          = "dreamhouse-knowledge-base.md"
source       = "${path.root}/../dreamhouse-knowledge-base.md"
content_type = "text/markdown"
etag         = filemd5("${path.root}/../dreamhouse-knowledge-base.md")
```
El `etag` con `filemd5` hace que Terraform detecte cambios en el archivo y lo re-suba automáticamente.

---

### `bedrock.tf` — 4 recursos

**1. `aws_iam_role.bedrock_kb`**
```
assume_role_policy: permite que bedrock.amazonaws.com asuma el rol
  con condición StringEquals aws:SourceAccount = cuenta actual
```
La condición `SourceAccount` es una best practice de seguridad — previene el confused deputy problem.

**2. `aws_iam_role_policy.bedrock_kb`**
Policy inline con permisos mínimos:
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::${bucket_name}",
        "arn:aws:s3:::${bucket_name}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "${embedding_model_arn}"
    }
  ]
}
```

**3. `aws_bedrockagent_knowledge_base.dreamhouse`**
```hcl
name        = "${var.project_name}-kb-${var.environment}"
role_arn    = aws_iam_role.bedrock_kb.arn
description = "Knowledge base para el chatbot de DreamHouse Baradero"

knowledge_base_configuration {
  type = "VECTOR"
  vector_knowledge_base_configuration {
    embedding_model_arn = var.embedding_model_arn
  }
}

storage_configuration {
  type = "OPENSEARCH_SERVERLESS"  # AWS gestiona el vector store
}
```

**4. `aws_bedrockagent_data_source.dreamhouse`**
```hcl
name                = "${var.project_name}-kb-datasource-${var.environment}"
knowledge_base_id   = aws_bedrockagent_knowledge_base.dreamhouse.id

data_source_configuration {
  type = "S3"
  s3_configuration {
    bucket_arn = aws_s3_bucket.kb_documents.arn
  }
}

vector_ingestion_configuration {
  chunking_configuration {
    chunking_strategy = "FIXED_SIZE"
    fixed_size_chunking_configuration {
      max_tokens         = 300
      overlap_percentage = 20
    }
  }
}
```

---

### `outputs.tf`

```hcl
output "knowledge_base_id"  # → BEDROCK_KNOWLEDGE_BASE_ID en .env
output "data_source_id"     # → para el ingestion job manual
output "s3_bucket_name"     # → referencia / debug
output "s3_object_key"      # → referencia / debug
```

---

## Paso post-apply (manual, una sola vez)

Terraform crea el Data Source pero **no lanza el indexado**. Después del `apply`:

```bash
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id $(terraform -chdir=infra output -raw knowledge_base_id) \
  --data-source-id $(terraform -chdir=infra output -raw data_source_id) \
  --region us-east-1
```

Esto vectoriza el `dreamhouse-knowledge-base.md` y lo carga en el vector store. Se hace una vez, y cada vez que se modifique el documento.

---

## .gitignore — entradas a agregar

```
# Terraform
infra/.terraform/
infra/.terraform.lock.hcl
infra/terraform.tfstate
infra/terraform.tfstate.backup
infra/*.tfvars        # si se crean archivos con credenciales
```

---

## Checklist pre-apply

- [ ] `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` exportados en la terminal
- [ ] Acceso a `amazon.titan-embed-text-v2:0` solicitado en Bedrock Console
- [ ] `terraform init` ejecutado (descarga providers)
- [ ] `terraform plan` revisado antes del `apply`
