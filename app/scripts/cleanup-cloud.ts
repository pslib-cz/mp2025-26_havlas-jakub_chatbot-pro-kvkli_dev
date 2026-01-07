/**
 * Delete all collections from Chroma Cloud to reset before re-migration
 */

import { config } from "dotenv";
import { CloudClient } from "chromadb";

config();

const cloudClient = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY || "",
  tenant: process.env.CHROMA_TENANT || "",
  database: process.env.CHROMA_DATABASE || "books",
});

async function main() {
  console.log("🗑️  Cleaning up Chroma Cloud collections...\n");

  try {
    const collections = await cloudClient.listCollections();
    console.log(`Found ${collections.length} collections to delete`);

    for (const collection of collections) {
      console.log(`   Deleting: ${collection.name}`);
      await cloudClient.deleteCollection({ name: collection.name });
      console.log(`   ✅ Deleted ${collection.name}`);
    }

    console.log("\n✅ Cleanup complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
