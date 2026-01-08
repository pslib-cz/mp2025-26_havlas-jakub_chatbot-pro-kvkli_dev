/**
 * Script to delete and recreate ChromaDB collections in the cloud
 * Use this when you need to reset collections due to dimension mismatches
 */

import { config } from "dotenv";
import { CloudClient } from "chromadb";

// Load environment variables
config();

const cloudClient = new CloudClient({
    apiKey: process.env.CHROMA_API_KEY || "",
    tenant: process.env.CHROMA_TENANT || "",
    database: process.env.CHROMA_DATABASE || "books",
});

const COLLECTIONS_TO_RECREATE = ["kvkli_content"];

async function main() {
    console.log("🧹 Starting collection cleanup and recreation...\n");

    try {
        // List existing collections
        const existingCollections = await cloudClient.listCollections();
        console.log(
            `Found ${existingCollections.length} existing collections in cloud`
        );

        for (const collectionName of COLLECTIONS_TO_RECREATE) {
            console.log(`\n📦 Processing: ${collectionName}`);

            try {
                // Try to delete if exists
                await cloudClient.deleteCollection({ name: collectionName });
                console.log(`   ✅ Deleted existing collection`);
            } catch (error) {
                console.log(`   ℹ️  Collection doesn't exist yet`);
            }

            // Create fresh collection with proper metadata
            await cloudClient.createCollection({
                name: collectionName,
                metadata: {
                    description: `${collectionName} collection`,
                    "hnsw:space": "cosine",
                    embedding_dimensions: 1536,
                },
            });

            console.log(`   ✅ Created fresh collection`);
        }

        console.log("\n✅ All collections cleaned and recreated!");
        console.log("\n📋 Next steps:");
        console.log("   1. Run your data migration or ingestion scripts");
    } catch (error) {
        console.error("\n❌ Error:", error);
        process.exit(1);
    }
}

main();
