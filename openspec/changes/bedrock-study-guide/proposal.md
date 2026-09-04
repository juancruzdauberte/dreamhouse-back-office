# Proposal: Bedrock Study Guide HTML

## Problem
After building the AWS Bedrock RAG infrastructure for DreamHouse, there is no reference document that explains what each service does, why it exists, how the components interact, and what the underlying AI concepts mean. This makes it hard to study, revisit, or explain the system to others.

## Solution
Generate a single self-contained HTML file at `docs/bedrock-resumen.html` that serves as an interactive study guide covering:

- Every AWS service used and its role in the system
- The full RAG pipeline explained step by step
- Core AI/ML concepts (embeddings, vector search, chunking, KNN, HNSW)
- The Guardrail layers explained individually
- IAM trust/permission model
- Real Terraform snippets and the Python index creation script
- How the landing frontend connects to the backend
- A visual flow diagram of the entire system

## Scope
**In:** `docs/bedrock-resumen.html` — one file, no build step, no dependencies, opens in any browser.

**Out:** No changes to infra code, no new AWS resources, no modifications to the Next.js app.

## Acceptance Criteria
- [ ] Opens in browser without a server (file://)
- [ ] Written entirely in Spanish
- [ ] Has a sticky nav to jump between sections
- [ ] All sections are present: services, RAG flow, AI concepts, Guardrail, IAM, frontend integration, glossary
- [ ] Code blocks show real snippets from this project
- [ ] Interactive elements: accordions, tabs, or expandable sections for code
- [ ] Visually clean and readable for studying
