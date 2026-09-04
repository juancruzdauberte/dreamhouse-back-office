# Tasks: bedrock-kb-infra

## Resumen
- **Total tasks**: 10
- **Fases**: 3 (Setup → Recursos AWS → Verificación)
- **Líneas estimadas**: ~280
- **Archivos nuevos**: 5 (`main.tf`, `variables.tf`, `outputs.tf`, `s3.tf`, `bedrock.tf`)
- **Archivos modificados**: 1 (`.gitignore`)

---

## Fase A — Setup base

### T-01 — Crear estructura de directorios
- Crear carpeta `infra/` en la raíz del repo
- Verificar que `dreamhouse-knowledge-base.md` existe en la raíz
- **Archivo**: estructura de carpetas

### T-02 — `infra/main.tf`
Crear el archivo con:
- Bloque `terraform` con `required_version >= 1.6` y providers `aws >= 5.0` y `random >= 3.0`
- Bloque `provider "aws"` con `region = var.aws_region`
- Comentario en cada bloque explicando su función
- **Archivo**: `infra/main.tf`

### T-03 — `infra/variables.tf`
Crear las 4 variables con `description` y `default` en cada una:
- `aws_region`
- `project_name`
- `environment`
- `embedding_model_arn`
- Comentario general al inicio del archivo explicando el propósito de cada variable
- **Archivo**: `infra/variables.tf`

---

## Fase B — Recursos AWS

### T-04 — `infra/s3.tf`
Crear 4 recursos en orden de dependencia:

1. `random_id.bucket_suffix` — genera sufijo único de 4 bytes
2. `aws_s3_bucket.kb_documents` — bucket privado con nombre dinámico y tags
3. `aws_s3_bucket_public_access_block.kb_documents` — los 4 flags en `true`
4. `aws_s3_object.knowledge_base` — sube `dreamhouse-knowledge-base.md` con `etag = filemd5(...)`

- Cada recurso DEBE tener comentario en español explicando qué hace y por qué
- **Archivo**: `infra/s3.tf`

### T-05 — `infra/bedrock.tf` — IAM
Crear 2 recursos de IAM:

1. `aws_iam_role.bedrock_kb`
   - `assume_role_policy` permite a `bedrock.amazonaws.com` asumir el rol
   - Condición `StringEquals aws:SourceAccount` con `data.aws_caller_identity.current.account_id`
   - Requiere agregar `data "aws_caller_identity" "current" {}` en este archivo

2. `aws_iam_role_policy.bedrock_kb`
   - Policy inline con permisos mínimos: `s3:GetObject`, `s3:ListBucket`, `bedrock:InvokeModel`
   - Resources scoped al bucket y al embedding model ARN

- Cada bloque DEBE tener comentario en español
- **Archivo**: `infra/bedrock.tf`

### T-06 — `infra/bedrock.tf` — Knowledge Base y Data Source
Agregar 2 recursos al mismo archivo `bedrock.tf`:

1. `aws_bedrockagent_knowledge_base.dreamhouse`
   - `type = "VECTOR"` con `embedding_model_arn`
   - `storage_configuration` tipo `OPENSEARCH_SERVERLESS`
   - Tags y descripción

2. `aws_bedrockagent_data_source.dreamhouse`
   - Conectado al KB del recurso anterior
   - `type = "S3"` apuntando al bucket
   - `chunking_strategy = "FIXED_SIZE"`, `max_tokens = 300`, `overlap_percentage = 20`

- Cada bloque DEBE tener comentario en español
- **Archivo**: `infra/bedrock.tf`

### T-07 — `infra/outputs.tf`
Crear 4 outputs con `description` en cada uno:
- `knowledge_base_id` — con descripción indicando que va al `.env` como `BEDROCK_KNOWLEDGE_BASE_ID`
- `data_source_id` — con descripción indicando que se usa para el ingestion job
- `s3_bucket_name`
- `s3_object_key`
- **Archivo**: `infra/outputs.tf`

---

## Fase C — Cierre

### T-08 — Actualizar `.gitignore`
Agregar al `.gitignore` existente del repo:
```
# Terraform
infra/.terraform/
infra/.terraform.lock.hcl
infra/terraform.tfstate
infra/terraform.tfstate.backup
infra/*.tfvars
```
- **Archivo**: `.gitignore`

### T-09 — Comentario de uso en `main.tf`
Agregar al inicio de `main.tf` un bloque de comentario con instrucciones de uso:
```
# INSTRUCCIONES DE USO
# 1. Exportar credenciales AWS en la terminal
# 2. terraform init
# 3. terraform plan
# 4. terraform apply
# 5. Copiar knowledge_base_id al .env del proyecto
# 6. Ejecutar ingestion job (ver README o design.md)
```
- **Archivo**: `infra/main.tf`

### T-10 — Verificación sintáctica
- Ejecutar `terraform init` dentro de `infra/`
- Ejecutar `terraform validate`
- Confirmar salida: `Success! The configuration is valid.`
- NO ejecutar `apply` todavía — requiere credenciales AWS reales
- **Comando**: `cd infra && terraform init && terraform validate`

---

## Mapa de archivos

```
infra/
  main.tf       ← T-02, T-09
  variables.tf  ← T-03
  outputs.tf    ← T-07
  s3.tf         ← T-04
  bedrock.tf    ← T-05, T-06

.gitignore      ← T-08
```

---

## Review Workload Forecast

| Métrica | Valor |
|---|---|
| Archivos nuevos | 5 |
| Archivos modificados | 1 |
| Líneas estimadas | ~280 |
| Chained PRs recomendado | No — dentro del presupuesto |
| Riesgo de budget 400 líneas | Bajo |
