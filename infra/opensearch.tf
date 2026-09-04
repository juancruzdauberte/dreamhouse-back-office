# =============================================================================
# opensearch.tf
# Crea la colección de OpenSearch Serverless que actúa como vector store
# del Knowledge Base. Bedrock guarda aquí los embeddings generados por
# Titan Embed al indexar el documento del FAQ.
#
# CONCEPTO CLAVE (para el examen):
# Un vector store es una base de datos especializada en búsqueda semántica.
# En vez de buscar por palabras exactas (LIKE '%pileta%'), busca por
# similitud de significado entre vectores numéricos. Por eso una pregunta
# sobre "piscina" encuentra el chunk que habla de "pileta".
#
# NOTA: OpenSearch Serverless requiere 3 recursos auxiliares antes de crear
# la colección: encryption policy, network policy y data access policy.
# =============================================================================

# Obtiene el ID de la cuenta AWS actual.
# Se usa en el trust policy del IAM Role y en la data access policy.
data "aws_caller_identity" "current" {}

# =============================================================================
# Encryption Policy
# Define que la colección usa claves gestionadas por AWS (AWSOwnedKey).
# Sin esta policy, la colección no puede crearse.
# =============================================================================
resource "aws_opensearchserverless_security_policy" "encryption" {
  name        = "${var.project_name}-kb-${var.environment}-enc"
  type        = "encryption"
  description = "Política de encriptación para el vector store de ${var.project_name}"

  # AWSOwnedKey = true → AWS gestiona la clave de encriptación automáticamente
  # (opción más simple y sin costo adicional de KMS)
  policy = jsonencode({
    Rules = [
      {
        ResourceType = "collection"
        Resource     = ["collection/${var.project_name}-kb-${var.environment}"]
      }
    ]
    AWSOwnedKey = true
  })
}

# =============================================================================
# Network Policy
# Controla desde dónde se puede acceder a la colección.
# AllowFromPublic = true permite que Bedrock (servicio AWS) acceda al endpoint.
# El acceso real está restringido por el IAM Role — no es acceso anónimo.
# =============================================================================
resource "aws_opensearchserverless_security_policy" "network" {
  name        = "${var.project_name}-kb-${var.environment}-net"
  type        = "network"
  description = "Política de red para el vector store de ${var.project_name}"

  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "collection"
          Resource     = ["collection/${var.project_name}-kb-${var.environment}"]
        },
        {
          ResourceType = "dashboard"
          Resource     = ["collection/${var.project_name}-kb-${var.environment}"]
        }
      ]
      AllowFromPublic = true
    }
  ])
}

# =============================================================================
# Colección OpenSearch Serverless (vector store)
# Es la base de datos que almacena los embeddings del FAQ.
# type = "VECTORSEARCH" es el tipo requerido para Bedrock Knowledge Base.
# Serverless = AWS gestiona la capacidad automáticamente, sin nodos que mantener.
# depends_on asegura que las policies existan antes de crear la colección.
# =============================================================================
resource "aws_opensearchserverless_collection" "kb" {
  name        = "${var.project_name}-kb-${var.environment}"
  type        = "VECTORSEARCH"
  description = "Vector store para el chatbot RAG de ${var.project_name}"

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network
  ]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# =============================================================================
# Data Access Policy
# Define qué identidades pueden leer y escribir documentos en la colección.
# El IAM Role de Bedrock (definido en bedrock.tf) necesita permisos para
# crear el índice y escribir los embeddings durante el ingestion job.
# =============================================================================
resource "aws_opensearchserverless_access_policy" "kb" {
  name        = "${var.project_name}-kb-${var.environment}-acc"
  type        = "data"
  description = "Permisos de acceso para el IAM Role de Bedrock"

  policy = jsonencode([
    {
      Rules = [
        {
          # Permisos sobre la colección (operaciones de administración)
          ResourceType = "collection"
          Resource     = ["collection/${var.project_name}-kb-${var.environment}"]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DeleteCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
        },
        {
          # Permisos sobre los índices (leer y escribir vectores/documentos)
          ResourceType = "index"
          Resource     = ["index/${var.project_name}-kb-${var.environment}/*"]
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument"
          ]
        }
      ]
      # El IAM Role de Bedrock Y el usuario que ejecuta Terraform
      # necesitan acceso para crear el índice desde el provider opensearch
      Principal = [
        aws_iam_role.bedrock_kb.arn,
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/iam-robert-user"
      ]
    }
  ])
}

# =============================================================================
# Índice vectorial de OpenSearch
# Bedrock requiere que este índice exista ANTES de crear el Knowledge Base.
# Cuando se crea un KB desde la consola AWS, la AWS lo crea automáticamente.
# Vía Terraform hay que definirlo explícitamente con el mapping correcto.
#
# CONCEPTO: KNN (K-Nearest Neighbors)
#   El campo tipo "knn_vector" es el que almacena los embeddings.
#   "dimension: 1024" debe coincidir exactamente con el output de Titan Embed v2
#   (genera vectores de 1024 dimensiones).
#   HNSW (Hierarchical Navigable Small World) es el algoritmo de búsqueda
#   aproximada más eficiente para vectores de alta dimensión.
# =============================================================================
# =============================================================================
# null_resource: crea el índice vectorial en OpenSearch Serverless
# Bedrock requiere que este índice exista ANTES de crear el Knowledge Base.
# Cuando se usa la consola AWS, se crea automáticamente. Vía Terraform
# usamos un script Python con botocore (disponible con AWS CLI) para
# crear el índice con el mapping correcto usando SigV4 auth.
# =============================================================================
resource "null_resource" "opensearch_index" {
  # Se re-ejecuta si cambia el endpoint de la colección
  triggers = {
    collection_endpoint = aws_opensearchserverless_collection.kb.collection_endpoint
  }

  provisioner "local-exec" {
    command = "python3 ${path.module}/create_index.py"
    environment = {
      COLLECTION_ENDPOINT = aws_opensearchserverless_collection.kb.collection_endpoint
      COLLECTION_ID       = aws_opensearchserverless_collection.kb.id
      AWS_REGION          = var.aws_region
    }
  }

  depends_on = [
    aws_opensearchserverless_collection.kb,
    aws_opensearchserverless_access_policy.kb
  ]
}
