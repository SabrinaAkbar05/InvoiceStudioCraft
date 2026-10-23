# InvoiceCraft Studio

A premium local-first invoicing application for small businesses, freelancers, and boutique owners. Create beautiful, branded invoices in under 2 minutes — no account, no cloud, no subscription required.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3.0-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-12%2F12_passing-brightgreen)](./src/tests)

## Features

- **Split-Screen Invoice Editor** — Live preview as you type
- **4 Professional Templates** — Corporate, Minimal, Elegant, Creative
- **Brand Studio** — Upload logo, auto-extract color palette
- **Natural Language Parsing** — Type "Invoice for Almas, 2 bouquets at PKR 2200 each"
- **Customer & Product Catalog** — Reusable client and item library
- **PDF Export** — High-quality multi-page PDF generation
- **Payment Tracking** — Record partial and full payments
- **100% Local-First** — All data in browser IndexedDB, no cloud needed

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and go to `/setup` to create your workspace.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.4.2 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS 4 |
| Math | Decimal.js (no floating-point errors) |
| PDF | jsPDF 4.2.1 + html2canvas |
| Storage | IndexedDB (custom wrapper) |
| Testing | Vitest (12 tests, all passing) |

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run test       # Run tests
npm run lint       # ESLint
```

## Project Structure

```
src/
├── app/           # Next.js pages
├── components/    # UI components (layout, invoices, templates)
├── lib/           # Core logic (db, calculations, pdf, ai, brand)
├── repositories/  # Data access layer
└── types/         # TypeScript definitions
```

## Documentation

- [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) — Bug audit and fixes
- [UX_REDESIGN_REPORT.md](./UX_REDESIGN_REPORT.md) — Design changes
- [QA_TEST_REPORT.md](./QA_TEST_REPORT.md) — Test results
- [BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md) — Future Supabase/Firebase integration
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Vercel/Netlify deployment

## Design Tokens

| Token | Value |
|-------|-------|
| Primary | #6254E8 |
| Secondary | #8B7CF6 |
| Background | #F8F9FC |
| Text | #171B32 |
| Border | #E7E9F2 |
| Muted | #73788C |

## License

Private — all rights reserved.
