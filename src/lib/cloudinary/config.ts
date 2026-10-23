import 'server-only';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Verify and read Cloudinary credentials server-side only
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(
    '[Cloudinary Config] Warning: Missing Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET).'
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export type AllowedAssetType = 'logos' | 'signatures' | 'invoice-assets';

export interface CloudinarySignedParams {
  timestamp: number;
  signature: string;
  folder: string;
  apiKey: string;
  cloudName: string;
  allowedFormats: string[];
  maxFileSize: number;
}

// Limits per asset type to prevent abuse and protect storage
const ASSET_LIMITS: Record<AllowedAssetType, { maxSize: number; formats: string[] }> = {
  logos: {
    maxSize: 2 * 1024 * 1024, // 2MB
    formats: ['png', 'jpg', 'jpeg', 'svg', 'webp']
  },
  signatures: {
    maxSize: 1 * 1024 * 1024, // 1MB
    formats: ['png', 'jpg', 'jpeg', 'webp']
  },
  'invoice-assets': {
    maxSize: 5 * 1024 * 1024, // 5MB
    formats: ['png', 'jpg', 'jpeg', 'pdf', 'webp']
  }
};

/**
 * Builds a strictly isolated folder path for InvoiceCraft Studio assets.
 * NEVER allows modifying assets outside of invoicecraft/{workspaceId}/...
 */
export function getWorkspaceFolderPath(workspaceId: string, assetType: AllowedAssetType): string {
  // Sanitize workspaceId and assetType to prevent directory traversal
  const cleanWorkspaceId = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanWorkspaceId) {
    throw new Error('Invalid workspace ID for asset storage');
  }
  return `invoicecraft/${cleanWorkspaceId}/${assetType}`;
}

/**
 * Generates server-signed upload parameters for direct client upload.
 * Restricts folder destination, timestamp, and asset limits.
 */
export function generateSignedUploadParams(
  workspaceId: string,
  assetType: AllowedAssetType
): CloudinarySignedParams {
  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error('Cloudinary credentials are not configured on the server');
  }

  const folder = getWorkspaceFolderPath(workspaceId, assetType);
  const timestamp = Math.round(new Date().getTime() / 1000);
  const limits = ASSET_LIMITS[assetType];

  // Parameters to sign
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    timestamp,
    signature,
    folder,
    apiKey,
    cloudName,
    allowedFormats: limits.formats,
    maxFileSize: limits.maxSize
  };
}

/**
 * Authorizes and deletes an asset from Cloudinary.
 * Enforces that the public_id must reside within invoicecraft/{workspaceId}/ to protect JUWMarketplace and other workspaces.
 */
export async function deleteWorkspaceAsset(
  workspaceId: string,
  publicId: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error('Cloudinary credentials are not configured on the server');
  }

  const cleanWorkspaceId = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const expectedPrefix = `invoicecraft/${cleanWorkspaceId}/`;

  if (!publicId.startsWith(expectedPrefix)) {
    throw new Error(
      `Access Denied: Attempted to delete an asset outside of workspace ${cleanWorkspaceId} bounds.`
    );
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return { success: result.result === 'ok', result: result.result };
  } catch (error) {
    const err = error as UploadApiErrorResponse;
    return { success: false, error: err.message || 'Cloudinary asset deletion failed' };
  }
}

export { cloudinary };
