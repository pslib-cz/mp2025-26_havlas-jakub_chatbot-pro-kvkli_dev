import os
import time
import pandas as pd
import chromadb
from openai import OpenAI
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# === 0. Load API key ===
load_dotenv(".env.local")
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ OPENAI_API_KEY not found in .env.local")

client_openai = OpenAI(api_key=api_key)

# === 1. Load CSV ===
csv_path = "model/books_cleaned.csv"
df = pd.read_csv(csv_path, encoding="utf-8")
texts = df["text_for_embedding"].astype(str).tolist()

# === 2. Chroma DB ===
chroma_path = os.path.abspath("./chroma_db")
print("📂 Using Chroma DB path:", chroma_path)

chroma_client = chromadb.PersistentClient(path=chroma_path)
collection = chroma_client.get_or_create_collection("books")

# === 3. Embedding helper ===
def get_embedding(text):
    """Get embedding for a single text"""
    try:
        response = client_openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"⚠️ Embedding failed: {e}")
        return None

# === 4. Parallel embedding function ===
def embed_batch(batch_texts, max_workers=10):
    """Embed a list of texts in parallel"""
    embeddings = [None] * len(batch_texts)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_idx = {
            executor.submit(get_embedding, text): idx
            for idx, text in enumerate(batch_texts)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            emb = future.result()
            embeddings[idx] = emb
    return [e for e in embeddings if e is not None]

# === 5. Ingestion loop ===
batch_size = 500   # ⚡ tune this based on your system
max_workers = 6   # ⚡ number of threads for parallel embedding

total = len(texts)
print(f"📊 Starting ingestion of {total:,} records in batches of {batch_size} ...")

start_time = time.time()
for i in range(0, total, batch_size):
    batch_texts = texts[i:i+batch_size]
    batch_ids = [f"book_{j}" for j in range(i, i+len(batch_texts))]

    # Generate embeddings in parallel
    print(f"🧠 Embedding batch {i // batch_size + 1} ({i} – {i+len(batch_texts)} of {total}) ...")
    batch_embeddings = embed_batch(batch_texts, max_workers=max_workers)

    # If some embeddings failed, adjust lists
    if len(batch_embeddings) != len(batch_texts):
        valid_pairs = [(id_, txt, emb) for id_, txt, emb in zip(batch_ids, batch_texts, batch_embeddings) if emb]
        batch_ids, batch_texts, batch_embeddings = zip(*valid_pairs)

    # Save to Chroma
    collection.add(
        ids=list(batch_ids),
        documents=list(batch_texts),
        embeddings=list(batch_embeddings)
    )

    print(f"✅ Saved batch {i // batch_size + 1}, total inserted: {collection.count()}")

    # Optional: checkpoint time
    elapsed = time.time() - start_time
    print(f"⏱️ Elapsed time: {elapsed/60:.1f} min")

print("🎉 Ingestion completed!")
print(f"📊 Final document count: {collection.count()}")
