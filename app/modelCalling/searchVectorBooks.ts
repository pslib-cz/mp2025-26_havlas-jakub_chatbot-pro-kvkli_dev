// lib/vectorSearch.ts
import { openai } from "../lib/openAI";
import { chroma } from "../lib/chroma";

export async function searchVectorBooks(query: string) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;


 

   const collection = await chroma.getCollection({ name: "books" });
  

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
  });

  return (results.metadatas?.[0] || []).map((m: any, idx: number) => ({
    title: m.Title || "Neznámý název",
    author: m.Author || "Neznámý autor",
    subjects: m.Subjects || "",
    description: m.Description || "",
    score: results.distances?.[0]?.[idx] ?? null,
  }));
}
