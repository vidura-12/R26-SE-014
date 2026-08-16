import os, chromadb, PyPDF2
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

CHROMA_PATH = "db/chroma"
COLLECTION_NAME = "cinnamon_wrr_kb"

embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(name=COLLECTION_NAME, embedding_function=embed_fn)

def ingest_documents(docs_folder: str):
    """Call once to load PDFs/text into ChromaDB."""
    texts, ids, metas = [], [], []
    idx = 0
    for fname in os.listdir(docs_folder):
        path = os.path.join(docs_folder, fname)
        text = ""
        if fname.endswith(".pdf"):
            with open(path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
        elif fname.endswith(".txt"):
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        
        # Chunk by paragraphs (simple but effective for 5 days)
        chunks = [c.strip() for c in text.split("\n\n") if len(c.strip()) > 40]
        for c in chunks:
            texts.append(c)
            ids.append(f"{fname}_{idx}")
            metas.append({"source": fname})
            idx += 1
    
    if texts:
        collection.add(documents=texts, ids=ids, metadatas=metas)
        print(f"Ingested {len(texts)} chunks.")

# Run once: ingest_documents("data/knowledge_base")