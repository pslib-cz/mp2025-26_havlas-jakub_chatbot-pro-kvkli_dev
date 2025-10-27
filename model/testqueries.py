import os
import chromadb
from openai import OpenAI
from dotenv import load_dotenv

# === 0. Load API key ===
load_dotenv(".env.local")
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ OPENAI_API_KEY not found in .env.local")

client_openai = OpenAI(api_key=api_key)

# === 1. Connect to Chroma ===
# Use the same absolute path you used for ingestion
chroma_path = os.path.abspath("./chroma_db")
print("📂 Using Chroma DB path:", chroma_path)

chroma_client = chromadb.PersistentClient(path=chroma_path)
collection = chroma_client.get_collection("books")

# === 2. Check document count ===
count = collection.count()
print(f"📊 Total documents in collection: {count}")

if count == 0:
    print("⚠️ No documents found. Did you run the ingestion script?")
    exit(1)

# === 3. Peek at some stored records ===
peek = collection.peek()
print(collection.count())
print(f"👀 Peeked {len(peek['documents'])} documents (showing up to 5):")
for i, doc in enumerate(peek["documents"][:5]):
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
