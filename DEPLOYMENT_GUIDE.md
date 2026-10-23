# InvoiceCraft Studio — Deployment Guide

## Prerequisites

- Node.js 18.17+ or 20+
- npm 9+

## Local Development

```bash
cd invoicecraft-studio
npm install
npm run dev
```

Open http://localhost:3000

## Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel (Recommended)

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Framework: Next.js (auto-detected)
4. Build Command: `npm run build`
5. Output Directory: `.next`
6. Deploy

No environment variables required (local-first, no backend).

## Deploy to Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=.next
```

Add `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Important Notes

- This is a **local-first app** — all data is stored in the browser''s IndexedDB
- Data does NOT persist across different browsers or devices
- Users should use Settings > Export Backup regularly
- No server-side database — zero backend infrastructure required
- Works offline after first load (no API calls)

## Build Output

```
Route (app)              Type
/                        Static
/brand-studio            Static
/customers               Static
/dashboard               Static
/features                Static
/invoices                Static
/invoices/[id]           Partial Prerender (Suspense)
/invoices/new            Static
/pricing                 Static
/products                Static
/settings                Static
/setup                   Static
```

## Performance

- All routes are statically prerendered
- /invoices/[id] uses Partial Prerender with Suspense streaming
- IndexedDB operations are async and non-blocking
- PDF generation is client-side (no server load)
