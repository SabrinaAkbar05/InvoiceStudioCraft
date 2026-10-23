# SECURITY AUDIT & FIREBASE CREDENTIAL REPORT
**InvoiceCraft Studio**
**Date:** October 24, 2026

---

## 1. Credential Security Findings

### 1.1 Local Workspace Inspection
- **Service Account File:** Located at project root: `invoicecraftstudio-firebase-adminsdk-fbsvc-d4ba57101f.json`.
- **Git Tracking Status:** Verified that the directory is currently uninitialized or excluded from Git tracking. No `.git` repository was active with committed credentials.
- **`.gitignore` Protection:** Verified that `.gitignore` contains strict glob rules:
  ```gitignore
  *-adminsdk-*.json
  *firebase-adminsdk*.json
  service-account*.json
  .env*
  ```
- **Zero-Secret Commit Rule:** When creating or pushing to GitHub, `invoicecraftstudio-firebase-adminsdk-*.json` and real `.env` files MUST NEVER be staged or pushed.

### 1.2 Recommended Service Account Key Rotation
If the file `invoicecraftstudio-firebase-adminsdk-fbsvc-d4ba57101f.json` was ever shared or uploaded to any public repository in the past:
1. Open the [Firebase Console](https://console.firebase.google.com/) -> Project Settings -> **Service accounts**.
2. Select your Admin SDK service account.
3. Generate a new private key and download the replacement JSON.
4. Delete/revoke key `d4ba57101f...` from the Firebase console.
5. Store the replacement JSON string safely into your Vercel project environment variables as `FIREBASE_SERVICE_ACCOUNT_JSON`.

---

## 2. Server-Side Authentication & Role-Based Authorization

### 2.1 Independent Verification
All server API routes (`/api/invoices`, `/api/invoices/[id]`, `/api/invoices/[id]/payments`, `/api/customers`, `/api/products`, `/api/uploads/*`) independently authenticate callers:
- Verify bearer token using `getAdminAuth().verifyIdToken()`.
- Validate workspace tenant access using `authorizeWorkspaceAccess()`.
- Client-supplied claims, user IDs, or role assertions are never trusted.

### 2.2 Firestore Security Rules Hardening
- **User Profiles (`/users/{userId}`):** Restrict read/write to `isUser(userId)`. Ordinary users cannot inspect other users' emails or profile documents.
- **Workspaces & Members:** Only admins and owners can modify member roles, preventing privilege escalation.
- **Issued Invoices:** Write operations on non-draft invoices are rejected from the client SDK, forcing financial mutations through authorized server endpoints.
- **Audit Logs:** Immutable audit events (`allow update, delete: if false`).

---

## 3. Cloudinary Multi-Tenant Isolation (JUWMarketplace Protection)

- **Dedicated Namespace:** All uploads are restricted strictly to `invoicecraft/{workspaceId}/{assetType}`.
- **Signed Parameters:** Upload signatures are generated server-side with strict constraints on folder, file size, and allowed extensions (`png`, `jpg`, `webp`, `svg`).
- **Bound Check Deletion:** The delete endpoint verifies that `publicId.startsWith('invoicecraft/${workspaceId}/')`. Any attempt to target assets outside this folder (such as JUWMarketplace assets) triggers an immediate `Access Denied` exception.
