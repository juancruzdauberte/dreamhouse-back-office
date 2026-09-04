# =============================================================================
# outputs.tf
# Exporta los valores que necesitás después del terraform apply.
# Podés consultarlos con: terraform output <nombre>
# O todos juntos con: terraform output
# =============================================================================

# ID del Knowledge Base — va al .env del proyecto Next.js como BEDROCK_KNOWLEDGE_BASE_ID
# Ejemplo de uso en Next.js:
#   const client = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION });
#   const command = new RetrieveAndGenerateCommand({
#     knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
#     ...
#   });
output "knowledge_base_id" {
  description = "ID del Bedrock Knowledge Base — agregar al .env como BEDROCK_KNOWLEDGE_BASE_ID"
  value       = aws_bedrockagent_knowledge_base.dreamhouse.id
}

# ID del Data Source — necesario para ejecutar el ingestion job manualmente.
# Comando para indexar el documento (ejecutar una vez después del apply):
#   aws bedrock-agent start-ingestion-job \
#     --knowledge-base-id $(terraform output -raw knowledge_base_id) \
#     --data-source-id $(terraform output -raw data_source_id) \
#     --region us-east-1
output "data_source_id" {
  description = "ID del Data Source — usado para el ingestion job manual con AWS CLI"
  value       = aws_bedrockagent_data_source.dreamhouse.data_source_id
}

# Nombre del bucket S3 donde está el documento del FAQ
output "s3_bucket_name" {
  description = "Nombre del bucket S3 que contiene los documentos del Knowledge Base"
  value       = aws_s3_bucket.kb_documents.bucket
}

# Clave (path) del objeto subido al bucket
output "s3_object_key" {
  description = "Key del documento subido al bucket S3"
  value       = aws_s3_object.knowledge_base.key
}

# ARN de la colección OpenSearch Serverless (útil para debugging)
# ID del Guardrail — agregar al .env como BEDROCK_GUARDRAIL_ID
output "guardrail_id" {
  description = "ID del Bedrock Guardrail — agregar al .env como BEDROCK_GUARDRAIL_ID"
  value       = aws_bedrock_guardrail.chatbot.guardrail_id
}

# Versión publicada del Guardrail — agregar al .env como BEDROCK_GUARDRAIL_VERSION
output "guardrail_version" {
  description = "Versión del Guardrail para usar en el chatbot (más estable que DRAFT)"
  value       = aws_bedrock_guardrail_version.chatbot.version
}

output "opensearch_collection_arn" {
  description = "ARN de la colección OpenSearch Serverless que actúa como vector store"
  value       = aws_opensearchserverless_collection.kb.arn
}
