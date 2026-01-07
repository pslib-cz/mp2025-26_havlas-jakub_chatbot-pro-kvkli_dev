# Quick Deployment Checklist

## Pre-Deployment
- [ ] Set up hosted Chroma DB instance (https://www.trychroma.com/ or self-hosted)
- [ ] Have production PostgreSQL database URL ready
- [ ] Have OpenAI API key ready

## Vercel Setup
- [ ] Import repository to Vercel
- [ ] Add environment variable: `DATABASE_URL`
- [ ] Add environment variable: `OPENAI_API_KEY`
- [ ] Add environment variable: `CHROMA_URL` (must be HTTP/HTTPS URL, not file path)

## Post-Deployment
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Test GraphQL API at `https://your-app.vercel.app/api/graphql`
- [ ] Test chatbot interface
- [ ] Verify no 250 MB size errors in deployment logs

## Files Changed
- ✅ `.vercelignore` - Excludes large files
- ✅ `next.config.ts` - Excludes heavy dependencies
- ✅ `prisma/schema.prisma` - Optimized for Linux deployment
- ✅ `src/app/api/graphql/route.ts` - Next.js 15 compatible
- ✅ `types/*.ts` - Fixed module exports

## Expected Function Size
- Before: ~500 MB ❌
- After: ~50-80 MB ✅

## Support
See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed guide.
