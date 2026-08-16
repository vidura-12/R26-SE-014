from services.knowledge_base import ingest_documents

if __name__ == "__main__":
    ingest_documents("data/knowledge_base")
    print("✅ Knowledge base ingested successfully!")