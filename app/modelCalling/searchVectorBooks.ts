import { chroma } from "../lib/chroma";
import OpenAI from "openai";

//Četl jsem knihu o mašinkách, mohl bys mi doporučit nějaké další knížký o vlacích?

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Rewrites a user query into a search-optimized text.
 * This improves embedding quality dramatically.
 */
function rewriteQueryForSearch(query: string): string {
  return `Hledám knihy související s následujícím dotazem: ${query}.
Prosím vyhledej relevantní názvy, autory, témata nebo anotace.`;
}

/**
 * Parse the stored embedding document. Format e.g.:
 * Title: ...
 * Author: ...
 * Subjects: ...
 * Description: ...
 */
function parseEmbeddingDocument(doc: string | null) {
  const text = doc ?? "";
  const lines = text.split("\n").map((l) => l.trim());

  let title = "";
  let author = "";
  let subjects = "";
  let description = "";

  for (const line of lines) {
    if (line.startsWith("Title:")) {
      title = line.replace("Title:", "").trim();
    } else if (line.startsWith("Author:")) {
      author = line.replace("Author:", "").trim();
    } else if (line.startsWith("Subjects:")) {
      subjects = line.replace("Subjects:", "").trim();
    } else if (line.startsWith("Description:")) {
      description = line.replace("Description:", "").trim();
    }
  }
  if (description === "nan") {
    return{
      title: title || "Neznámý název",
      author: author || "Neznámý autor",
      subjects: subjects || "",
    }
  }


  return {
    title: title || "Neznámý název",
    author: author || "Neznámý autor",
    description: description || "",
    subjects: subjects || "",
  };
}

/**
 * Vector search for books using Chroma + OpenAI embeddings.
 */
export async function searchVectorBooks(query: string) {
  try {
    await chroma.listCollections();
    const collection = await chroma.getCollection({ name: "books" });

    // 1) Improve query → search-optimized version
    const rewritten = rewriteQueryForSearch(query);

    // 2) Create embedding for rewritten query
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: rewritten,
    });

    const queryEmbedding = embeddingRes.data[0].embedding;

    // 3) Perform vector search
    const result = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
    });

    const docs = result.documents?.[0] || [];
    const ids = result.ids?.[0] || [];

    // 4) Parse documents into structured results
    return docs.map((doc, i) => {
      const parsed = parseEmbeddingDocument(doc);

      return {
        id: ids[i],
        title: parsed.title,
        author: parsed.author,
        description: parsed.description,
        subjects: parsed.subjects,
      };
    });

  } catch (err) {
    console.error("❌ Vector search error:", err);
    return [];
  }
}