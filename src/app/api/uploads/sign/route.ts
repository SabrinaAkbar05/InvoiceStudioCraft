import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerRequest, authorizeWorkspaceAccess } from '@/lib/auth/server';
import { generateSignedUploadParams, AllowedAssetType } from '@/lib/cloudinary/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateServerRequest(req);
    const body = await req.json();

    const { workspaceId, assetType } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!assetType || !['logos', 'signatures', 'invoice-assets'].includes(assetType)) {
      return NextResponse.json(
        { error: 'Invalid assetType. Must be one of: logos, signatures, invoice-assets' },
        { status: 400 }
      );
    }

    // Verify workspace membership and permissions
    await authorizeWorkspaceAccess(user, workspaceId, ['member', 'admin', 'owner']);

    // Generate restricted signed upload parameters
    const signedParams = generateSignedUploadParams(workspaceId, assetType as AllowedAssetType);

    return NextResponse.json(signedParams);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload signing failed';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
