import 'server-only';
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

interface ServiceAccountData {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
}

let adminAppInstance: App | null = null;

function loadServiceAccount(): ServiceAccountData | null {
  // Option 1: Vercel / Production environment variable containing stringified JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return parsed;
      }
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields.');
    } catch (err) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err instanceof Error ? err.message : err);
    }
  }

  // Option 2: Local development service account file path
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const candidatePaths: string[] = [];

  if (configuredPath) {
    if (path.isAbsolute(configuredPath)) {
      candidatePaths.push(configuredPath);
    } else {
      candidatePaths.push(path.resolve(/*turbopackIgnore: true*/ process.cwd(), configuredPath));
    }
  }

  // Fallback checks in project root
  const rootFiles = [
    'invoicecraftstudio-firebase-adminsdk-fbsvc-d4ba57101f.json',
    'serviceAccountKey.json',
    'firebase-service-account.json'
  ];

  for (const f of rootFiles) {
    const fullPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), f);
    if (!candidatePaths.includes(fullPath)) {
      candidatePaths.push(fullPath);
    }
  }

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.project_id && parsed.client_email && parsed.private_key) {
          return parsed;
        }
      }
    } catch {
      // Continue checking
    }
  }

  return null;
}

export function initFirebaseAdmin(): App {
  if (adminAppInstance) return adminAppInstance;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAppInstance = existingApps[0];
    return adminAppInstance;
  }

  const credentials = loadServiceAccount();

  if (!credentials) {
    console.warn(
      '[Firebase Admin] Warning: No valid service account found. Please ensure FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON is configured.'
    );

    try {
      adminAppInstance = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      });
      return adminAppInstance;
    } catch {
      throw new Error('Firebase Admin SDK initialization failed: No credentials available.');
    }
  }

  const privateKey = credentials.private_key?.replace(/\\n/g, '\n');

  adminAppInstance = initializeApp({
    credential: cert({
      projectId: credentials.project_id,
      clientEmail: credentials.client_email,
      privateKey
    }),
    projectId: credentials.project_id,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });

  return adminAppInstance;
}

export function getAdminAuth(): Auth {
  const app = initFirebaseAdmin();
  return getAuth(app);
}

export function getAdminDb(): Firestore {
  const app = initFirebaseAdmin();
  return getFirestore(app);
}

export function getAdminStorage(): Storage {
  const app = initFirebaseAdmin();
  return getStorage(app);
}

export const adminAuth = getAdminAuth;
export const adminDb = getAdminDb;
export const adminStorage = getAdminStorage;
