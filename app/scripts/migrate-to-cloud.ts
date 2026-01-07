/**
 * Migration script to move local ChromaDB collections to Chroma Cloud
 * 
 * This script:
 * 1. Connects to local ChromaDB
 * 2. Exports all data from specified collections
 * 3. Connects to Chroma Cloud
 * 4. Imports the data to cloud collections
 */

import { config } from "dotenv";
import { ChromaClient, CloudClient } from "chromadb";
import { createHash } from "crypto";

// Load environment variables from .env file
config();

/**
 * Generate a shorter ID hash to comply with Chroma Cloud's 128-byte limit
 * Free tier has strict ID size limits, so we hash long IDs
 */
function shortenId(originalId: string): string {
  // If ID is already short enough, keep it
  if (originalId.length <= 100) {
    return originalId;
  }
  
  // Create MD5 hash for long IDs (32 chars) + prefix for readability
  const hash = createHash('md5').update(originalId).digest('hex');
  return `hash_${hash}`;
}

// Local ChromaDB configuration
const localClient = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});

// Cloud ChromaDB configuration
const cloudClient = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY || "",
  tenant: process.env.CHROMA_TENANT || "",
  database: process.env.CHROMA_DATABASE || "books",
});

const COLLECTIONS_TO_MIGRATE = ["kvkli_content"]; // kvkli_content already migrated

/**
 * Migrate a single collection from local to cloud
 */
async function migrateCollection(collectionName: string) {
  console.log(`\n📦 Migrating collection: ${collectionName}`);

  try {
    // Check if collection already exists in cloud with data
    try {
      const existingCloudCollection = await cloudClient.getCollection({
        name: collectionName,
      });
      const existingData = await existingCloudCollection.get();
      if (existingData.ids.length > 0) {
        console.log(`   ⏭️  Collection already exists in cloud with ${existingData.ids.length} items - skipping`);
        return;
      }
    } catch (error) {
      // Collection doesn't exist yet, proceed with migration
    }

    // Get local collection
    const localCollection = await localClient.getCollection({
      name: collectionName,
    });

    // Get all data from local collection
    const allData = await localCollection.get();
    
    const totalItems = allData.ids.length;
    console.log(`   Found ${totalItems} items in local collection`);

    if (totalItems === 0) {
      console.log(`   ⚠️ Collection is empty, skipping...`);
      return;
    }

    // Create or get cloud collection
    // Ensure metadata is not empty for Chroma Cloud
    const metadata = localCollection.metadata && Object.keys(localCollection.metadata).length > 0
      ? localCollection.metadata
      : { migrated: "true" };
    
    const cloudCollection = await cloudClient.getOrCreateCollection({
      name: collectionName,
      metadata: metadata,
    });

    console.log(`   ✅ Cloud collection ready`);

    // Batch upload to cloud (ChromaDB has a limit on batch size)
    const BATCH_SIZE = 100;
    let uploaded = 0;

    for (let i = 0; i < totalItems; i += BATCH_SIZE) {
      const endIdx = Math.min(i + BATCH_SIZE, totalItems);
      
      const batchIds = allData.ids.slice(i, endIdx);
      const batchEmbeddings = allData.embeddings?.slice(i, endIdx);
      const batchDocuments = allData.documents?.slice(i, endIdx);
      const batchMetadatas = allData.metadatas?.slice(i, endIdx);

      // Shorten IDs to comply with Chroma Cloud's 128-byte limit
      const shortenedIds = batchIds.map(shortenId);

      // Store original IDs in metadata for reference
      const enhancedMetadatas = batchMetadatas?.map((meta, idx) => ({
        ...meta,
        original_id: batchIds[idx],
      }));

      // Prepare add parameters
      const addParams: any = {
        ids: shortenedIds,
      };

      if (batchEmbeddings && batchEmbeddings.length > 0) {
        addParams.embeddings = batchEmbeddings;
      }

      if (batchDocuments && batchDocuments.length > 0) {
        addParams.documents = batchDocuments;
      }

      if (enhancedMetadatas && enhancedMetadatas.length > 0) {
        addParams.metadatas = enhancedMetadatas;
      }

      // Add to cloud collection
      await cloudCollection.add(addParams);
      
      uploaded += batchIds.length;
      console.log(`   📤 Uploaded ${uploaded}/${totalItems} items`);
    }

    console.log(`   ✅ Successfully migrated ${collectionName}`);
  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log("🚀 Starting ChromaDB migration to cloud...\n");
  console.log("Configuration:");
  console.log(`  - Local URL: ${process.env.CHROMA_URL || "http://localhost:8000"}`);
  console.log(`  - Cloud Tenant: ${process.env.CHROMA_TENANT}`);
  console.log(`  - Cloud Database: ${process.env.CHROMA_DATABASE}`);
  console.log(`  - Collections: ${COLLECTIONS_TO_MIGRATE.join(", ")}`);

  try {
    // Test connections
    console.log("\n🔍 Testing connections...");
    
    const localCollections = await localClient.listCollections();
    console.log(`   ✅ Local connection OK (${localCollections.length} collections)`);
    
    const cloudCollections = await cloudClient.listCollections();
    console.log(`   ✅ Cloud connection OK (${cloudCollections.length} collections)`);

    // Migrate each collection
    for (const collectionName of COLLECTIONS_TO_MIGRATE) {
      await migrateCollection(collectionName);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Update your .env file with CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE");
    console.log("   2. Add these environment variables to Vercel");
    console.log("   3. Redeploy your application");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
main();
