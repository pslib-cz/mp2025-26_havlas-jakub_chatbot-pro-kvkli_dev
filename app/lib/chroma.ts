// Suppress deprecation warnings from chromadb library BEFORE import
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args) {
  if (
    typeof warning === "string" &&
    warning.includes("url.parse()") &&
    warning.includes("DEP0169")
  ) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  // @ts-expect-error - spreading unknown args to original function
  return originalEmitWarning.call(process, warning, ...args);
};

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