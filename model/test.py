import os
import pandas as pd
import chromadb
from openai import OpenAI
from dotenv import load_dotenv

# === 0. Load environment variables ===
load_dotenv(".env.local")
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ OPENAI_API_KEY not found in .env.local")

client_openai = OpenAI(api_key=api_key)

# === 1. Load CSV ===
csv_path = "model/books_cleaned.csv"
df = pd.read_csv(csv_path, encoding="utf-8")

# Convert to string to be safe
texts = df["text_for_embedding"].astype(str).tolist()

# === 2. Initialize Chroma ===
# 👉 Use absolute path so you don’t lose data accidentally
chroma_path = os.path.abspath("./chroma_db")
print("📂 Using Chroma DB path:", chroma_path)

chroma_client = chromadb.PersistentClient(path=chroma_path)
collection = chroma_client.get_or_create_collection("books")

# === 3. Embedding helper ===
def get_embedding(text):
    response = client_openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# === 4. Batch insert (here: first 100 for testing) ===
batch_size = 100
start_index = 0  # change this if resuming
end_index = min(start_index + batch_size, len(texts))
texts_batch = texts[start_index:end_index]
ids_batch = [f"book_{i}" for i in range(start_index, end_index)]

print(f"🧠 Generating embeddings for {len(texts_batch)} records...")
embeddings_batch = [get_embedding(t) for t in texts_batch]

collection.add(
    ids=ids_batch,
    documents=texts_batch,
    embeddings=embeddings_batch
)

print(f"✅ Successfully inserted {len(texts_batch)} records into Chroma collection 'books'")
print(f"📊 Total count in collection now: {collection.count()}")
