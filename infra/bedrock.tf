# =============================================================================
# bedrock.tf
# Crea el IAM Role, el Knowledge Base y el Data Source de Amazon Bedrock.
#
# FLUJO DE DATOS (concepto RAG):
#   1. terraform apply → crea la infra
#   2. ingestion job  → Bedrock lee el .md del S3, lo divide en chunks,
#                        Titan Embed convierte cada chunk en un vector,
#                        los vectores se guardan en OpenSearch Serverless
#   3. usuario pregunta → Bedrock convierte la pregunta en vector,
#                          busca los chunks más similares en OpenSearch,
#                          arma el prompt con el contexto encontrado,
#                          Claude Haiku genera la respuesta final
# =============================================================================

# =============================================================================
# IAM Role para Bedrock Knowledge Base
# Bedrock necesita este role para poder:
#   - Leer el documento del bucket S3
#   - Usar el modelo de embeddings (Titan Embed)
#   - Escribir vectores en OpenSearch Serverless
#
# CONCEPTO: Trust Policy vs Permission Policy
#   - Trust Policy  → quién puede ASUMIR este role (bedrock.amazonaws.com)
#   - Permission Policy → qué puede HACER quien asuma el role
# =============================================================================
resource "aws_iam_role" "bedrock_kb" {
  name        = "${var.project_name}-bedrock-kb-role-${var.environment}"
  description = "IAM Role que permite a Bedrock acceder al S3 y OpenSearch para el KB"

  # Trust Policy: permite que el servicio Bedrock asuma este role.
  # La condición StringEquals aws:SourceAccount previene el "confused deputy problem":
  # solo nuestra cuenta puede hacer que Bedrock asuma este role,
  # evitando que otra cuenta use Bedrock para asumir nuestro role por error.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# =============================================================================
# Permission Policy (inline) del IAM Role
# Define exactamente qué puede hacer Bedrock con este role.
# Se usa una policy inline (no managed) para aplicar mínimo privilegio:
# los permisos están scoped a los recursos específicos de este proyecto.
# =============================================================================
resource "aws_iam_role_policy" "bedrock_kb" {
  name = "${var.project_name}-bedrock-kb-policy-${var.environment}"
  role = aws_iam_role.bedrock_kb.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Permite leer objetos del bucket S3 donde está el documento del FAQ
        Sid    = "AllowS3Read"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.kb_documents.arn,
          "${aws_s3_bucket.kb_documents.arn}/*"
        ]
      },
      {
        # Permite invocar el modelo de embeddings (Titan Embed v2)
        # para convertir el texto del FAQ en vectores numéricos
        Sid    = "AllowBedrockEmbeddings"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [var.embedding_model_arn]
      },
      {
        # Permite que Bedrock escriba y lea vectores en OpenSearch Serverless
        # aoss:APIAccessAll es el permiso necesario para operaciones sobre la colección
        Sid    = "AllowOpenSearchAccess"
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = [aws_opensearchserverless_collection.kb.arn]
      }
    ]
  })
}

# =============================================================================
# Bedrock Knowledge Base
# El Knowledge Base es el componente central del sistema RAG.
# Orquesta todo el pipeline: recibe el documento del S3, llama a Titan Embed
# para generar los vectores, y los guarda en el vector store de OpenSearch.
#
# CONCEPTO: knowledge_base_configuration
#   - type = "VECTOR" → usamos búsqueda semántica por vectores
#   - embedding_model_arn → el modelo que convierte texto en vectores
#
# CONCEPTO: storage_configuration
#   - type = "OPENSEARCH_SERVERLESS" → el vector store donde se guardan los embeddings
#   - field_mapping → nombres de campos que Bedrock espera en el índice de OpenSearch
#     Son nombres estándar de Bedrock — no se pueden cambiar arbitrariamente
# =============================================================================
resource "aws_bedrockagent_knowledge_base" "dreamhouse" {
  name        = "${var.project_name}-kb-${var.environment}"
  description = "Knowledge Base para el chatbot RAG de DreamHouse Baradero — responde preguntas sobre la propiedad basándose en el documento FAQ"
  role_arn    = aws_iam_role.bedrock_kb.arn

  knowledge_base_configuration {
    type = "VECTOR"

    vector_knowledge_base_configuration {
      # Titan Embed v2 genera vectores de 1024 dimensiones
      # Es el modelo de embeddings de Amazon, optimizado para búsqueda semántica
      embedding_model_arn = var.embedding_model_arn
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"

    opensearch_serverless_configuration {
      # ARN de la colección OpenSearch Serverless creada en opensearch.tf
      collection_arn = aws_opensearchserverless_collection.kb.arn

      # Nombre del índice dentro de la colección donde se guardan los vectores
      # "bedrock-knowledge-base-default-index" es el nombre estándar que Bedrock espera
      vector_index_name = "bedrock-knowledge-base-default-index"

      field_mapping {
        # Campo que almacena el vector numérico (embedding) de cada chunk
        vector_field = "bedrock-knowledge-base-default-vector"

        # Campo que almacena el texto original del chunk (para incluirlo en el prompt)
        text_field = "AMAZON_BEDROCK_TEXT_CHUNK"

        # Campo que almacena metadata del chunk (nombre de archivo, página, etc.)
        metadata_field = "AMAZON_BEDROCK_METADATA"
      }
    }
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # El KB depende del role y del access policy de OpenSearch
  # para que los permisos estén en orden antes de crearlo
  depends_on = [
    aws_iam_role_policy.bedrock_kb,
    aws_opensearchserverless_access_policy.kb,
    null_resource.opensearch_index
  ]
}

# =============================================================================
# Bedrock Data Source
# Conecta el Knowledge Base con el bucket S3.
# Define de dónde vienen los documentos y cómo se dividen en chunks.
#
# CONCEPTO: Chunking
#   El documento no se vectoriza completo — se divide en fragmentos (chunks).
#   Cada chunk se convierte en un vector separado.
#   Cuando el usuario pregunta algo, Bedrock busca los chunks más relevantes
#   y los incluye como contexto en el prompt del modelo generador.
#
#   FIXED_SIZE con max_tokens=300 y overlap=20%:
#   - Cada chunk tiene máximo 300 tokens (~225 palabras)
#   - El 20% de overlap (60 tokens) entre chunks evita cortar ideas en el medio
#   - Ideal para un FAQ con secciones cortas y bien delimitadas
# =============================================================================
resource "aws_bedrockagent_data_source" "dreamhouse" {
  name              = "${var.project_name}-kb-datasource-${var.environment}"
  knowledge_base_id = aws_bedrockagent_knowledge_base.dreamhouse.id
  description       = "Documento FAQ de DreamHouse Baradero almacenado en S3"

  data_source_configuration {
    type = "S3"

    s3_configuration {
      # ARN del bucket donde está el documento del Knowledge Base
      bucket_arn = aws_s3_bucket.kb_documents.arn
    }
  }

  vector_ingestion_configuration {
    chunking_configuration {
      # FIXED_SIZE divide el texto en chunks de tamaño fijo
      # Alternativas: HIERARCHICAL (chunks anidados), SEMANTIC (por significado),
      # NONE (documento completo como un solo chunk — no recomendado para FAQs largos)
      chunking_strategy = "FIXED_SIZE"

      fixed_size_chunking_configuration {
        # Tamaño máximo de cada chunk en tokens
        # 300 tokens ≈ 225 palabras — suficiente para una sección del FAQ
        max_tokens = 300

        # Porcentaje de superposición entre chunks consecutivos (60 tokens)
        # Evita que una respuesta quede cortada entre dos chunks
        overlap_percentage = 20
      }
    }
  }
}
