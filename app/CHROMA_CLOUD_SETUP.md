# Chroma Cloud Migration - Vercel Environment Variables

## ✅ Migration Complete

Your ChromaDB has been successfully migrated to Chroma Cloud with optimized IDs to comply with the free tier's 128-byte limit.

## Changes Made

### 1. Updated ID Generation ([graphql/services/compare.service.ts](graphql/services/compare.service.ts))
- Long IDs are now hashed using MD5 (37 characters: `hash_` + 32-char hash)
- IDs under 100 characters are kept as-is
- This ensures compliance with Chroma Cloud's 128-byte ID limit

### 2. Migration Script ([scripts/migrate-to-cloud.ts](scripts/migrate-to-cloud.ts))
- Automatically shortens long IDs during migration
- Preserves original IDs in metadata for reference
- Uploads data in batches of 100 items

### 3. Chroma Client Configuration ([lib/chroma.ts](lib/chroma.ts))
- Auto-detects environment
- Uses `CloudClient` when `CHROMA_API_KEY` is present (production)
- Uses `ChromaClient` with localhost otherwise (development)

## Required Environment Variables for Vercel

Add these environment variables to your Vercel project:

1. Go to your Vercel project → Settings → Environment Variables
2. Add the following variables:

```bash
# Chroma Cloud Configuration
CHROMA_API_KEY=ck-GPCvNWdSXaXYX1y7XJmGePTf8tPbTNaoFV1WC6SSxaT6
CHROMA_TENANT=2aed35de-5cc0-4927-ab17-946554414aaa
CHROMA_DATABASE=books
```

## Important Notes

- ⚠️ **Do NOT set `CHROMA_URL`** in Vercel - the app automatically uses CloudClient when `CHROMA_API_KEY` is present
- Local development will continue to use `http://localhost:8000` from your `.env` file
- The ID hashing is consistent between local and cloud, so you can develop locally and deploy to cloud seamlessly

## Migrated Collections

✅ **kvkli_content** - Website content chunks (3073 items)
✅ **books** - Book recommendations database

## Next Steps

### 1. Fix Neon Database Tables

Your original error was about missing database tables. Run this command:

\`\`\`bash
npx prisma migrate deploy
\`\`\`

Make sure your `DATABASE_URL` environment variable points to your Neon database.

### 2. Add Environment Variables to Vercel

Add the Chroma Cloud variables listed above to your Vercel project settings.

### 3. Redeploy

After adding the environment variables, redeploy your application on Vercel.

## Troubleshooting

If you encounter issues:

- **"Collection not found"**: The migration script will create collections automatically
- **"Quota exceeded"**: The ID hashing should prevent this, but if it happens, contact Chroma support
- **Local development issues**: Make sure your local ChromaDB is running on `http://localhost:8000`

