# Spec: bedrock-kb-infra

## Objetivo
Crear la infraestructura AWS con Terraform para el chatbot RAG de DreamHouse Baradero.
Incluye: S3 bucket, subida del knowledge base document, IAM Role y Bedrock Knowledge Base con Data Source.
El `knowledge_base_id` se exporta como output para ser usado en el `.env` del proyecto Next.js.

---

## Functional Requirements

### FR-1 — S3 Bucket
- DEBE crear un bucket S3 privado con nombre único basado en `project_name` y `environment`.
- DEBE bloquear todo acceso público (`block_public_acls`, `block_public_policy`, `ignore_public_acls`, `restrict_public_buckets`).
- DEBE tener un tag `Project` y `Environment`.

### FR-2 — Upload del documento
- DEBE subir `dreamhouse-knowledge-base.md` desde la raíz del repo al bucket S3.
- El objeto S3 DEBE tener `content_type = "text/markdown"`.
- Si el archivo cambia localmente, `terraform apply` DEBE detectarlo y re-subirlo (usar `etag` o `source_hash`).

### FR-3 — IAM Role para Bedrock
- DEBE crear un IAM Role con `AssumeRolePolicyDocument` que permita a `bedrock.amazonaws.com` asumir el rol.
- DEBE adjuntar una policy inline con los siguientes permisos mínimos:
  - `s3:GetObject` y `s3:ListBucket` sobre el bucket creado en FR-1.
  - `bedrock:InvokeModel` sobre el modelo de embeddings (Titan Embed v2).

### FR-4 — Bedrock Knowledge Base
- DEBE crear un `aws_bedrockagent_knowledge_base` con:
  - `name` basado en `project_name` y `environment`.
  - `role_arn` del IAM Role de FR-3.
  - `knowledge_base_configuration` tipo `VECTOR` con embedding model `amazon.titan-embed-text-v2:0`.
  - Storage configuration: `OPENSEARCH_SERVERLESS` (managed por AWS — opción por defecto de Bedrock).
- DEBE tener descripción y tags.

### FR-5 — Bedrock Data Source
- DEBE crear un `aws_bedrockagent_data_source` conectado al KB de FR-4.
- DEBE apuntar al bucket S3 de FR-1.
- `chunking_configuration` DEBE usar `FIXED_SIZE` con `max_tokens = 300` y `overlap_percentage = 20`.

### FR-6 — Outputs
- DEBE exportar:
  - `knowledge_base_id` — ID del KB para el `.env` de Next.js.
  - `data_source_id` — ID del Data Source para el ingestion job manual.
  - `s3_bucket_name` — nombre del bucket.
  - `s3_object_key` — key del documento subido.

---

## File Structure

```
infra/
  main.tf         # provider AWS + versiones requeridas
  variables.tf    # aws_region, project_name, environment, embedding_model_arn
  outputs.tf      # knowledge_base_id, data_source_id, s3_bucket_name, s3_object_key
  s3.tf           # aws_s3_bucket + aws_s3_bucket_public_access_block + aws_s3_object
  bedrock.tf      # aws_iam_role + aws_iam_role_policy + aws_bedrockagent_knowledge_base + aws_bedrockagent_data_source

dreamhouse-knowledge-base.md  # ya existe en la raíz del repo — no se mueve
```

---

## Variables

| Variable | Tipo | Default | Descripción |
|---|---|---|---|
| `aws_region` | string | `"us-east-1"` | Región AWS donde se despliega todo |
| `project_name` | string | `"dreamhouse"` | Prefijo para nombrar recursos |
| `environment` | string | `"dev"` | Entorno: dev / prod |
| `embedding_model_arn` | string | `"arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"` | ARN del modelo de embeddings |

---

## Acceptance Criteria

| ID | Criterio |
|---|---|
| AC-1 | `terraform plan` no produce errores de sintaxis ni de provider |
| AC-2 | `terraform apply` crea bucket S3 con acceso público bloqueado |
| AC-3 | `dreamhouse-knowledge-base.md` aparece como objeto en el bucket |
| AC-4 | IAM Role existe con los permisos mínimos definidos en FR-3 |
| AC-5 | Knowledge Base aparece en AWS Console → Bedrock → Knowledge Bases |
| AC-6 | Data Source aparece asociado al KB |
| AC-7 | `terraform output knowledge_base_id` devuelve un ID válido |
| AC-8 | Todos los archivos `.tf` tienen comentarios explicativos en cada bloque de recurso |

---

## Out of Scope

- El widget de chat en Next.js (SDD aparte).
- El ingestion job automático (se ejecuta manualmente con AWS CLI una vez).
- Backend remoto del estado de Terraform (se usa local por ahora).
- Ambientes múltiples con workspaces de Terraform.

---

## Notas

- AWS Provider mínimo: `>= 5.0` (requerido para `aws_bedrockagent_*`).
- Todos los bloques de recurso en los archivos `.tf` DEBEN tener comentarios en español explicando su función.
- El nombre del bucket incluye un sufijo aleatorio (`random_id`) para garantizar unicidad global.
