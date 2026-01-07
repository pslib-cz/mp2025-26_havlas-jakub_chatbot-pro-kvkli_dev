import { ChromaClient, CloudClient } from "chromadb";

// Use CloudClient for production, ChromaClient for local development
export const chroma = process.env.CHROMA_API_KEY
  ? new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT || "",
      database: process.env.CHROMA_DATABASE || "books",
    })
  : new ChromaClient({
      path: process.env.CHROMA_URL || "http://localhost:8000",
    });
