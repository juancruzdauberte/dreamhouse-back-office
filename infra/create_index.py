"""
create_index.py
Crea el índice vectorial en OpenSearch Serverless usando requests-aws4auth.
"""

import os
import json
import time

import boto3
import requests
from requests_aws4auth import AWS4Auth

# ─── Config ────────────────────────────────────────────────────────────────────

ENDPOINT      = os.environ["COLLECTION_ENDPOINT"].rstrip("/")
REGION        = os.environ.get("AWS_REGION", "us-east-1")
COLLECTION_ID = os.environ["COLLECTION_ID"]
INDEX_NAME    = "bedrock-knowledge-base-default-index"
ACCESS_KEY    = os.environ["AWS_ACCESS_KEY_ID"]
SECRET_KEY    = os.environ["AWS_SECRET_ACCESS_KEY"]
SESSION_TOKEN = os.environ.get("AWS_SESSION_TOKEN")

INDEX_BODY = {
    "settings": {"index": {"knn": True, "knn.algo_param.ef_search": 512}},
    "mappings": {
        "properties": {
            "bedrock-knowledge-base-default-vector": {
                "type": "knn_vector", "dimension": 1024,
                "method": {"name": "hnsw", "engine": "faiss", "space_type": "l2",
                           "parameters": {"ef_construction": 512, "m": 16}}
            },
            "AMAZON_BEDROCK_TEXT_CHUNK": {"type": "text"},
            "AMAZON_BEDROCK_METADATA":   {"type": "text", "index": False}
        }
    }
}

# ─── Esperar que la colección esté ACTIVE ──────────────────────────────────────

def wait_for_collection(max_wait=300):
    client = boto3.client(
        "opensearchserverless",
        region_name=REGION,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        aws_session_token=SESSION_TOKEN
    )
    print(f"Esperando que la colección esté ACTIVE...")
    for _ in range(max_wait // 10):
        resp    = client.batch_get_collection(ids=[COLLECTION_ID])
        details = resp.get("collectionDetails", [])
        if details:
            status = details[0].get("status", "UNKNOWN")
            print(f"  Estado: {status}")
            if status == "ACTIVE":
                return
            if status == "FAILED":
                raise RuntimeError("Colección en estado FAILED")
        time.sleep(10)
    raise RuntimeError("Timeout esperando colección ACTIVE")

# ─── Crear índice ───────────────────────────────────────────────────────────────

def create_index(max_retries=5, wait_seconds=20):
    auth = AWS4Auth(ACCESS_KEY, SECRET_KEY, REGION, "aoss",
                    session_token=SESSION_TOKEN)
    url  = f"{ENDPOINT}/{INDEX_NAME}"

    for attempt in range(1, max_retries + 1):
        resp = requests.put(
            url,
            auth=auth,
            json=INDEX_BODY,
            headers={"Content-Type": "application/json"}
        )
        print(f"  Intento {attempt}: HTTP {resp.status_code}")

        if resp.status_code in (200, 201):
            print(f"✅ Índice creado")
            return

        if resp.status_code == 400 and "resource_already_exists_exception" in resp.text:
            print("✅ El índice ya existe — OK")
            return

        print(f"  Respuesta: {resp.text[:200]}")

        if attempt < max_retries:
            print(f"  Esperando {wait_seconds}s...")
            time.sleep(wait_seconds)

    raise RuntimeError(f"No se pudo crear el índice después de {max_retries} intentos")

# ─── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"Endpoint : {ENDPOINT}")
    print(f"Key      : {ACCESS_KEY[:8]}...")
    wait_for_collection()
    print(f"Creando índice '{INDEX_NAME}'...")
    create_index()
