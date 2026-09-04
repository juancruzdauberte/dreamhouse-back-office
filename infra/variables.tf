# =============================================================================
# variables.tf
# Define los parámetros configurables de la infraestructura.
# Todos tienen valores por defecto para poder hacer terraform plan/apply
# sin necesidad de pasar argumentos extra.
# =============================================================================

# Región de AWS donde se crean todos los recursos.
# Bedrock Knowledge Base está disponible en us-east-1 y us-west-2.
# Asegurate de que el modelo de embeddings y el FM estén habilitados en esta región.
variable "aws_region" {
  description = "Región AWS donde se despliega toda la infraestructura"
  type        = string
  default     = "us-east-1"
}

# Prefijo usado para nombrar todos los recursos en AWS.
# Ejemplo: "dreamhouse" → bucket "dreamhouse-kb-dev-a1b2", KB "dreamhouse-kb-dev"
variable "project_name" {
  description = "Prefijo para nombrar los recursos en AWS"
  type        = string
  default     = "dreamhouse"
}

# Entorno de despliegue. Permite tener infra separada para dev y prod
# sin modificar el código — solo cambiando esta variable.
variable "environment" {
  description = "Entorno de despliegue: dev | prod"
  type        = string
  default     = "dev"
}

# ARN del modelo de embeddings de Amazon Bedrock.
# Titan Embed v2 convierte el texto del FAQ en vectores numéricos
# para ser guardados en el vector store de OpenSearch Serverless.
# Costo aproximado: $0.00002 por 1.000 tokens (muy barato para un FAQ).
# IMPORTANTE: Este modelo debe tener acceso habilitado en la consola de Bedrock
# antes de ejecutar terraform apply.
variable "embedding_model_arn" {
  description = "ARN del modelo de embeddings usado por el Knowledge Base"
  type        = string
  default     = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
}
