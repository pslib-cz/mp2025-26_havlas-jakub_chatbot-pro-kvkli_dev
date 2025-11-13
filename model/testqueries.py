import os
from openai import OpenAI
from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings

# === 0. Load API key ===
load_dotenv(".env.local")
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ OPENAI_API_KEY not found in .env.local")

client_openai = OpenAI(api_key=api_key)

# === 1. Connect to Chroma ===
# New PersistentClient uses Settings
chroma_path = os.path.abspath("./chroma_db")
print("📂 Using Chroma DB path:", chroma_path)

chroma_client = chromadb.Client(
    Settings(
        chroma_db_impl="duckdb+parquet",
        persist_directory=chroma_path
    )
)

# New API: get or create collection
collection_name = "books"
try:
    collection = chroma_client.get_collection(collection_name)
except ValueError:
    print(f"⚠️ Collection '{collection_name}' not found. Creating it...")
    collection = chroma_client.create_collection(collection_name)

# === 2. Check document count ===
# count() replaced by .count() method with optional filter
count = collection.count()
print(f"📊 Total documents in collection: {count['total']}")

if count['total'] == 0:
    print("⚠️ No documents found. Did you run the ingestion script?")
    exit(1)

# === 3. Peek at some stored records ===
# peek() no longer exists; use get() instead
peek_size = 5
peek = collection.get(limit=peek_size)
documents = peek["documents"]
metadatas = peek["metadatas"]

print(f"👀 Peeked {len(documents)} documents (showing up to {peek_size}):")
for i, doc in enumerate(documents[:peek_size]):
    print(f"{i+1}. {doc[:100]}...")  # limit text length for display

# === 4. Helper: embed query ===
def get_embedding(text):
    response = client_openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# === 5. Run a simple semantic query ===
query_text = "automatizace výroby"  # 🧠 example query
query_embedding = get_embedding(query_text)

results = collection.query(
    query_embeddings=[query_embedding],
    n_results=5,
    include=["distances", "documents", "metadatas"]
)

for doc, dist in zip(results["documents"][0], results["distances"][0]):
    print(f"📘 {doc[:120]}...")
    print(f"   📏 similarity score (lower = closer): {dist:.4f}")
    print("––––––––––––––––––––––––––––––")

# === 6. Display the results ===
print(f"\n🔎 Results for query: '{query_text}'")
for doc, metadata in zip(results["documents"][0], results["metadatas"][0]):
    print("📘", doc)
    print("   📎 metadata:", metadata)
    print("––––––––––––––––––––––––––––––")
