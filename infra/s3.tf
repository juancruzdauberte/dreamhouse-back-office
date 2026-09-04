# =============================================================================
# s3.tf
# Crea el bucket S3 privado que actúa como fuente de datos del Knowledge Base.
# El documento dreamhouse-knowledge-base.md se sube automáticamente al bucket
# durante el terraform apply. Si el archivo cambia localmente, el próximo
# apply lo detecta y lo re-sube (gracias al etag con filemd5).
# =============================================================================

# Genera un sufijo aleatorio de 4 bytes (8 caracteres hex) para garantizar
# que el nombre del bucket sea único globalmente en toda AWS.
# S3 exige unicidad global — dos cuentas no pueden tener el mismo nombre de bucket.
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Bucket S3 privado donde se almacena el documento del Knowledge Base.
# Nombre resultante: dreamhouse-kb-dev-a1b2c3d4
# Solo Bedrock puede acceder a este bucket, nunca el público general.
resource "aws_s3_bucket" "kb_documents" {
  bucket = "${var.project_name}-kb-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Purpose     = "Bedrock Knowledge Base documents"
  }
}

# Bloquea completamente el acceso público al bucket.
# Bedrock accede al bucket mediante el IAM Role definido en bedrock.tf,
# nunca a través de una URL pública. Esto sigue el principio de
# mínimo privilegio — ningún recurso debe ser más abierto de lo necesario.
resource "aws_s3_bucket_public_access_block" "kb_documents" {
  bucket = aws_s3_bucket.kb_documents.id

  # Bloquea la creación de ACLs públicas
  block_public_acls = true

  # Bloquea políticas de bucket que permitan acceso público
  block_public_policy = true

  # Ignora cualquier ACL pública existente
  ignore_public_acls = true

  # Restringe el acceso público aunque haya una policy permisiva
  restrict_public_buckets = true
}

# Sube el documento del Knowledge Base al bucket S3.
# El campo etag con filemd5() hace que Terraform detecte cambios en el archivo:
# si modificás dreamhouse-knowledge-base.md y ejecutás terraform apply,
# el archivo se re-sube automáticamente al bucket.
# path.module apunta al directorio infra/, por eso usamos ../ para subir al raíz del repo.
resource "aws_s3_object" "knowledge_base" {
  bucket = aws_s3_bucket.kb_documents.id

  # Clave (nombre) del objeto dentro del bucket
  key = "dreamhouse-knowledge-base.md"

  # Ruta local del archivo — relativa al directorio infra/
  source = "${path.module}/../dreamhouse-knowledge-base.md"

  # content_type correcto para que Bedrock procese el archivo como texto plano
  content_type = "text/markdown"

  # El etag usa el hash MD5 del archivo local para detectar cambios.
  # Si el contenido del archivo cambia, Terraform lo re-sube en el próximo apply.
  etag = filemd5("${path.module}/../dreamhouse-knowledge-base.md")

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
