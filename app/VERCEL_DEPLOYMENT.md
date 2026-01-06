# Vercel Deployment Guide - Fixed for 250 MB Limit

## Changes Made to Fix Deployment

### 1. **Created `.vercelignore`**
Excludes large files from deployment:
- `crawler-output/` (17 MB of JSON files)
- `chroma_db/` (local vector database)
- `model/` (Python scripts)
- `tests/` and `coverage/`

### 2. **Updated `next.config.ts`**
Added aggressive file exclusions for serverless functions:
- Excluded `onnxruntime-node` (404 MB) - only needed for embedded Chroma
- Excluded `@img/*` packages (33 MB) - Sharp image processing
- Excluded `@huggingface/*` (3 MB) - ML models
- Configured webpack to externalize heavy dependencies

### 3. **Optimized Prisma Configuration**
Updated `prisma/schema.prisma`:
- Changed `binaryTargets` from `["native", "windows"]` to `["native", "debian-openssl-3.0.x"]`
- Vercel uses Linux, not Windows - saves ~20 MB by not including Windows binaries

### 4. **Fixed TypeScript Build Errors**
- Updated [src/app/api/graphql/route.ts](src/app/api/graphql/route.ts) for Next.js 15 compatibility
- Recreated type export files in [types/](types/) directory
- Fixed module export issues

---

## Environment Variables Required

Add these to your Vercel project settings (**Settings → Environment Variables**):

```bash
DATABASE_URL=your_production_postgres_url
OPENAI_API_KEY=sk-your-openai-key
CHROMA_URL=https://your-hosted-chroma-url.com
```

### Important: Chroma DB Hosting

**You MUST use a hosted Chroma instance in production**, not local file storage.

Options:
1. **Chroma Cloud (Recommended)**: https://www.trychroma.com/
2. **Self-hosted**: Deploy Chroma on Railway, Fly.io, or DigitalOcean
3. **Docker**: Use `docker-compose.yml` to deploy alongside your app

Example Chroma Cloud setup:
```bash
CHROMA_URL=https://api.trychroma.com
CHROMA_API_KEY=your_chroma_api_key  # if required
```

---

## Deployment Steps

### 1. **Prepare Database**
```bash
# Run migrations on your production database
npx prisma migrate deploy
```

### 2. **Push to GitHub**
```bash
git add .
git commit -m "Optimize for Vercel deployment"
git push
```

### 3. **Deploy to Vercel**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js
4. Add environment variables (DATABASE_URL, OPENAI_API_KEY, CHROMA_URL)
5. Click **Deploy**

### 4. **Verify Deployment**
Check that:
- GraphQL API works at `/api/graphql`
- Chatbot can query books and site content
- No function size errors

---

## How the Fix Works

### Before (500 MB):
```
onnxruntime-node: 404 MB  ← Included unnecessarily
@img packages: 33 MB      ← Sharp for image processing
generated/prisma: 37 MB   ← Windows + Linux binaries
crawler-output: 17 MB     ← Static JSON files
```

### After (~50-80 MB):
```
chromadb (HTTP client only): ~5 MB
generated/prisma (Linux only): ~20 MB
Application code: ~25-50 MB
```

**Key insight**: chromadb has two modes:
1. **Embedded** (needs onnxruntime-node, 400+ MB)
2. **HTTP Client** (just makes API calls, <5 MB) ← We use this

By excluding the embedded dependencies and using `CHROMA_URL`, we stay well under 250 MB.

---

## Troubleshooting

### Still getting "Max serverless function size exceeded"?

1. **Check build output**:
   ```bash
   npm run build
   # Look for warnings about large dependencies
   ```

2. **Verify exclusions are working**:
   ```bash
   # Check .next/server/pages/api/graphql.js size
   # Should be < 50 MB
   ```

3. **Ensure Chroma is in HTTP mode**:
   - Verify `CHROMA_URL` environment variable is set
   - Should point to a remote server (http://... or https://...)
   - NOT a file path

4. **Consider Vercel Pro**:
   - Increases limit to 300 MB
   - Costs $20/month per member

### Build warnings about chromadb

The warning:
```
Critical dependency: the request of a dependency is an expression
```

This is **safe to ignore**. It's because chromadb dynamically imports optional dependencies. Since we're using HTTP mode and excluding those dependencies, it won't affect runtime.

---

## Testing Locally

Before deploying, test the production build:

```bash
npm run build
npm run start
```

Visit http://localhost:3000 and verify:
- Chatbot works
- GraphQL API responds at /api/graphql
- No errors in console

---

## Additional Optimizations (Optional)

### Use Edge Runtime for Smaller Functions
Edit `src/app/api/graphql/route.ts`:
```typescript
export const runtime = 'edge'; // Add this line
```
Note: Edge runtime has limitations (no Node.js APIs)

### Split GraphQL into Separate API Routes
If the function is still too large, split resolvers:
- `/api/graphql/books` - Book search only
- `/api/graphql/chat` - Chat/prompts only
- `/api/graphql/admin` - Crawling/admin only

---

## Success Criteria

✅ Build completes without errors  
✅ Function size < 250 MB  
✅ GraphQL API accessible  
✅ Chatbot can search books  
✅ Site content search works  
✅ Chroma connects to remote instance  

---

## Questions?

If deployment still fails:
1. Check Vercel build logs for specific errors
2. Verify all environment variables are set
3. Ensure Chroma instance is accessible from Vercel
4. Check DATABASE_URL connection string is correct

