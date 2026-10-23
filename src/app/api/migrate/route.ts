import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const body = await req.json();

    const {
      workspaceId,
      migrationId,
      workspace,
      brandKit,
      customers = [],
      products = [],
      invoices = []
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await authorizeWorkspaceAccess(user, workspaceId, ['owner', 'admin']);

    const db = getAdminDb();
    const wsRef = db.collection('workspaces').doc(workspaceId);

    // Check if migration already performed with this migrationId
    const migrationDocRef = wsRef.collection('settings').doc('migration');
    const existingMigration = await migrationDocRef.get();

    if (existingMigration.exists) {
      const data = existingMigration.data();
      if (data?.completed && data?.migrationId === migrationId) {
        return NextResponse.json({
          success: true,
          message: 'Migration already completed previously with this migration ID',
          alreadyMigrated: true
        });
      }
    }

    const now = new Date().toISOString();

    // 1. Update Workspace Details if provided
    if (workspace) {
      await wsRef.set(
        {
          name: workspace.name || 'My Workspace',
          email: workspace.email || user.email,
          phone: workspace.phone || '',
          website: workspace.website || '',
          address: workspace.address || {},
          taxId: workspace.taxId || '',
          currency: workspace.currency || 'USD',
          dateFormat: workspace.dateFormat || 'YYYY-MM-DD',
          invoiceNumberPrefix: workspace.invoiceNumberPrefix || 'INV-',
          invoiceNumberNext: workspace.invoiceNumberNext || 1001,
          defaultPaymentTermsDays: workspace.defaultPaymentTermsDays || 14,
          paymentInstructions: workspace.paymentInstructions || '',
          updatedAt: now
        },
        { merge: true }
      );
    }

    // 2. Update Brand Kit if provided
    if (brandKit) {
      const bkRef = wsRef.collection('brandKits').doc(brandKit.id || `bk_${workspaceId}`);
      await bkRef.set(
        {
          ...brandKit,
          workspaceId,
          updatedAt: now
        },
        { merge: true }
      );
    }

    // 3. Batch import Customers
    if (customers.length > 0) {
      const custBatch = db.batch();
      for (const cust of customers) {
        if (!cust.id || !cust.name) continue;
        const custRef = wsRef.collection('customers').doc(cust.id);
        custBatch.set(
          custRef,
          {
            ...cust,
            workspaceId,
            updatedAt: now
          },
          { merge: true }
        );
      }
      await custBatch.commit();
    }

    // 4. Batch import Products
    if (products.length > 0) {
      const prodBatch = db.batch();
      for (const prod of products) {
        if (!prod.id || !prod.name) continue;
        const prodRef = wsRef.collection('products').doc(prod.id);
        prodBatch.set(
          prodRef,
          {
            ...prod,
            workspaceId,
            updatedAt: now
          },
          { merge: true }
        );
      }
      await prodBatch.commit();
    }

    // 5. Batch import Invoices
    if (invoices.length > 0) {
      const invBatch = db.batch();
      for (const inv of invoices) {
        if (!inv.id || !inv.invoiceNumber) continue;
        const invRef = wsRef.collection('invoices').doc(inv.id);
        invBatch.set(
          invRef,
          {
            ...inv,
            workspaceId,
            updatedAt: now
          },
          { merge: true }
        );
      }
      await invBatch.commit();
    }

    // 6. Record successful migration
    await migrationDocRef.set({
      migrationId: migrationId || `mig_${Date.now()}`,
      migratedBy: user.uid,
      completed: true,
      customersCount: customers.length,
      productsCount: products.length,
      invoicesCount: invoices.length,
      timestamp: now
    });

    return NextResponse.json({
      success: true,
      message: 'Local workspace data migrated successfully to Firestore',
      stats: {
        customers: customers.length,
        products: products.length,
        invoices: invoices.length
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Migration failed';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
