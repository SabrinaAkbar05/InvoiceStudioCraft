import React, { Suspense } from 'react';
import { InvoiceDetailClient } from './InvoiceDetailClient';

export const dynamic = 'force-dynamic';

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={null}>
      <InvoiceDetailClient />
    </Suspense>
  );
}
