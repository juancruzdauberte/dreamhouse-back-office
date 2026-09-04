# =============================================================================
# main.tf
# Punto de entrada de la infraestructura de DreamHouse Baradero.
# Define los providers requeridos y la versión mínima de Terraform.
#
# INSTRUCCIONES DE USO:
#   1. Exportar credenciales AWS en la terminal:
#        export AWS_ACCESS_KEY_ID="..."
#        export AWS_SECRET_ACCESS_KEY="..."
#   2. Inicializar Terraform (descarga providers):
#        terraform init
#   3. Ver qué se va a crear sin tocar nada:
#        terraform plan
#   4. Crear la infraestructura en AWS:
#        terraform apply
#   5. Copiar el knowledge_base_id al .env del proyecto Next.js:
#        terraform output knowledge_base_id
#   6. Ejecutar el ingestion job para vectorizar el documento (una sola vez):
#        aws bedrock-agent start-ingestion-job \
#          --knowledge-base-id $(terraform output -raw knowledge_base_id) \
#          --data-source-id $(terraform output -raw data_source_id) \
#          --region us-east-1
# =============================================================================

terraform {
  # Versión mínima de Terraform requerida
  required_version = ">= 1.6"

  required_providers {
    # Provider de AWS — versión 5.x mínima porque aws_bedrockagent_* solo
    # existe a partir de esa versión
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }

    # Provider random — usado para generar el sufijo único del bucket S3
    # (S3 requiere nombres únicos globales en toda AWS)
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }

    # Provider opensearch — necesario para crear el índice vectorial dentro
    # de la colección OpenSearch Serverless antes de que Bedrock pueda usarla.
    # Cuando se crea un KB desde la consola AWS, este índice se crea automáticamente.
    # Vía Terraform, hay que crearlo explícitamente con el mapping correcto.
    opensearch = {
      source  = "opensearch-project/opensearch"
      version = ">= 2.0"
    }
  }
}

# Configura el provider de AWS con la región definida en variables.tf
# Terraform usará las credenciales del entorno (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
# o el archivo ~/.aws/credentials si están configuradas localmente
provider "aws" {
  region = var.aws_region
}
