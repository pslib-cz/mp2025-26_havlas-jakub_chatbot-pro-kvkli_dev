import { chroma } from "../lib/chroma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
//Test
/*
Četl jsem knihu o mašinkách, mohl bys mi doporučit nějaké další knížký o vlacích?
*/
export async function searchVectorBooks(query: string) {
  try {
    await chroma.listCollections();
    const collection = await chroma.getCollection({ name: "books" });

    // 1) Embed the query
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = embeddingRes.data[0].embedding;

    // 2) Query the vector DB
    const result = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
    });
    console.log(result.distances);
console.log(result.documents);
console.log(result.ids);
    // 3) Convert result format to something readable
    const docs = result.documents?.[0] || [];
    const ids = result.ids?.[0] || [];

    return docs.map((doc, i) => ({
      id: ids[i],
      title: extractTitle(doc),
      author: extractAuthor(doc),
      description: doc ?? "",
    }));

  } catch (err) {
    console.error("Vector search error:", err);
    return [];
  }
}
function extractTitle(doc: string | null) {
  // example: parse first line or markdown or JSON — depends on your data
  const text = doc ?? "";
  return text.split("\n")[0] || "Neznámý název";
}

function extractAuthor(doc: string | null) {
  return "Autor neznámý"; // unless your documents store author directly
}
