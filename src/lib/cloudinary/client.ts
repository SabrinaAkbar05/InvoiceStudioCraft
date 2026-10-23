import { auth } from '@/lib/firebase/client';

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export async function uploadToCloudinary(
  file: File,
  workspaceId: string,
  assetType: 'logos' | 'signatures' | 'invoice-assets',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  // 1. Get Firebase ID token for authentication
  const currentUser = auth.currentUser;
  const token = currentUser ? await currentUser.getIdToken() : '';

  // 2. Request signed upload parameters from server
  const signRes = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ workspaceId, assetType })
  });

  if (!signRes.ok) {
    const errorData = await signRes.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to sign upload request (${signRes.status})`);
  }

  const { timestamp, signature, folder, apiKey, cloudName, allowedFormats, maxFileSize } =
    await signRes.json();

  // Validate format and size on client before upload
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (fileExt && !allowedFormats.includes(fileExt)) {
    throw new Error(`File format .${fileExt} is not permitted. Allowed: ${allowedFormats.join(', ')}`);
  }

  if (file.size > maxFileSize) {
    const maxMb = (maxFileSize / (1024 * 1024)).toFixed(0);
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed ${maxMb}MB`);
  }

  // 3. Upload to Cloudinary direct upload endpoint
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadEndpoint);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secureUrl: response.secure_url,
            publicId: response.public_id,
            width: response.width,
            height: response.height,
            format: response.format,
            bytes: response.bytes
          });
        } catch (err) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || 'Cloudinary upload failed'));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
    xhr.send(formData);
  });
}
