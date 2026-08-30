import os
import chromadb
import PyPDF2

from pathlib import Path
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# CHROMA DATABASE
# ============================================================

CHROMA_PATH = BASE_DIR / "db" / "chroma"

COLLECTION_NAME = "cinnamon_wrr_kb"


# ============================================================
# EMBEDDING MODEL
# ============================================================

embed_fn = SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)


# ============================================================
# CHROMA CLIENT
# ============================================================

client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)

collection = client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=embed_fn
)


# ============================================================
# DOCUMENT INGESTION
# ============================================================

def ingest_documents(docs_folder: str):
    """
    Load PDF/TXT documents into ChromaDB.

    Example:
        ingest_documents("data/knowledge_base")
    """

    texts = []
    ids = []
    metas = []

    idx = 0

    docs_path = Path(docs_folder)

    # Convert relative path to absolute path
    if not docs_path.is_absolute():
        docs_path = BASE_DIR / docs_path

    if not docs_path.exists():
        print(f"Knowledge base folder not found: {docs_path}")
        return

    for file_path in docs_path.iterdir():

        if not file_path.is_file():
            continue

        fname = file_path.name
        text = ""

        # ----------------------------------------------------
        # PDF
        # ----------------------------------------------------

        if file_path.suffix.lower() == ".pdf":

            with open(file_path, "rb") as f:

                reader = PyPDF2.PdfReader(f)

                for page in reader.pages:
                    text += page.extract_text() or ""

        # ----------------------------------------------------
        # TXT
        # ----------------------------------------------------

        elif file_path.suffix.lower() == ".txt":

            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as f:

                text = f.read()

        else:
            continue

        # ----------------------------------------------------
        # CHUNK DOCUMENT
        # ----------------------------------------------------

        chunks = [
            c.strip()
            for c in text.split("\n\n")
            if len(c.strip()) > 40
        ]

        # ----------------------------------------------------
        # ADD CHUNKS
        # ----------------------------------------------------

        for chunk in chunks:

            texts.append(chunk)

            ids.append(
                f"{fname}_{idx}"
            )

            metas.append(
                {
                    "source": fname
                }
            )

            idx += 1

    # --------------------------------------------------------
    # STORE IN CHROMADB
    # --------------------------------------------------------

    if texts:

        collection.add(
            documents=texts,
            ids=ids,
            metadatas=metas
        )

        print(
            f"Ingested {len(texts)} chunks."
        )


# ============================================================
# IMPORTANT
# ============================================================
#
# Do NOT automatically call ingest_documents() when the API
# starts.
#
# Your existing ChromaDB database should already contain the
# knowledge-base documents.
#
# If you need to ingest documents manually, run:
#
# ingest_documents("data/knowledge_base")
#
# ============================================================