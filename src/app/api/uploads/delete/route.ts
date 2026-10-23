import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { deleteWorkspaceAsset } from '@/lib/cloudinary/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const body = await req.json();

    const { workspaceId, publicId } = body;

    if (!workspaceId || !publicId) {
      return NextResponse.json({ error: 'workspaceId and publicId are required' }, { status: 400 });
    }

    // Require admin or owner permissions for deleting cloud assets
    await authorizeWorkspaceAccess(user, workspaceId, ['admin', 'owner']);

    // Authorized deletion strictly within the workspace folder
    const result = await deleteWorkspaceAsset(workspaceId, publicId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete asset' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: result.result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Asset deletion failed';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
