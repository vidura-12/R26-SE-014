from services.knowledge_base import collection  # Just import collection, don't ingest

def get_advisory(ph, moisture, temp, risk, confidence):
    query = f"{risk} white root rot prevention cinnamon pH {ph} moisture {moisture} temperature {temp}"
    results = collection.query(query_texts=[query], n_results=4)
    # ... rest of your RAG logic