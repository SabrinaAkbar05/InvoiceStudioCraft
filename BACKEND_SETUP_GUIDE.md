# InvoiceCraft Studio — Backend Setup Guide

## Current Architecture: Local-First

InvoiceCraft Studio is intentionally **local-first**. All data is stored in the browser''s IndexedDB via a custom `LocalDatabase` class in `src/lib/db/indexeddb.ts`.

**No backend is required** to run the application.

---

## Future Backend: Supabase PostgreSQL

When you are ready to add cloud sync, Supabase is the recommended backend.

### 1. Create Supabase Project

1. Go to https://supabase.com → New Project
2. Note your Project URL and anon key

### 2. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 3. Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Schema

Run in Supabase SQL editor:

```sql
-- Workspaces
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT DEFAULT ''USD'',
  invoice_number_prefix TEXT DEFAULT ''INV-'',
  invoice_number_next INTEGER DEFAULT 1001,
  payment_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Kits
CREATE TABLE brand_kits (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  primary_color TEXT DEFAULT ''#6254E8'',
  secondary_color TEXT DEFAULT ''#8B7CF6'',
  accent_color TEXT DEFAULT ''#F59E0B'',
  background_color TEXT DEFAULT ''#FFFFFF'',
  text_color TEXT DEFAULT ''#1F2937'',
  template_id TEXT DEFAULT ''corporate'',
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  name TEXT NOT NULL,
  email TEXT,
  company_name TEXT,
  phone TEXT,
  address JSONB,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  default_price DECIMAL(10,2),
  unit TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  invoice_number TEXT NOT NULL,
  title TEXT,
  status TEXT DEFAULT ''draft'',
  issue_date DATE,
  due_date DATE,
  customer_id TEXT REFERENCES customers(id),
  customer_snapshot JSONB,
  items JSONB NOT NULL DEFAULT ''[]'',
  discount_type TEXT DEFAULT ''none'',
  discount_value DECIMAL(10,2) DEFAULT 0,
  tax_type TEXT DEFAULT ''percentage'',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  delivery_charge DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_total DECIMAL(10,2) DEFAULT 0,
  tax_total DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT ''USD'',
  notes TEXT,
  payment_instructions TEXT,
  brand_kit_snapshot JSONB,
  payments JSONB DEFAULT ''[]'',
  page_format TEXT DEFAULT ''a4'',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Row Level Security

```sql
-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- (repeat for all tables)

-- Policy: users can only access their own workspace data
CREATE POLICY "workspace_access" ON invoices
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
  ));
```

### 6. Repository Migration

Replace `src/lib/db/indexeddb.ts` with Supabase queries.

Example invoice repository:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getInvoices(workspaceId: string) {
  const { data, error } = await supabase
    .from(''invoices'')
    .select(''*'')
    .eq(''workspace_id'', workspaceId)
    .order(''created_at'', { ascending: false })
  
  if (error) throw error
  return data
}
```

---

## Alternative: Firebase Firestore

See `firebase-firestore` skill for Firestore-specific setup.

---

## Data Migration

To migrate from IndexedDB to backend:
1. Use Settings > Export Backup to download JSON
2. Parse JSON and insert into database tables
3. Update repository imports to point to backend implementation
