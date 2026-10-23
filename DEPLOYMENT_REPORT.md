# PRODUCTION DEPLOYMENT & VERCEL GUIDE
**InvoiceCraft Studio**
**Date:** October 24, 2026

---

## 1. Project Deployment Readiness

The application has been verified for production deployment to **Vercel**:
- `npm run typecheck`: Passed (0 errors)
- `npm run test`: Passed (16/16 tests passing)
- `npm run build`: Passed (Next.js 16.4.2 Turbopack produced 25 routes)
- Dynamic route segment configurations repaired
- Secret credentials shielded via `.gitignore`

---

## 2. GitHub & Vercel Connection Instructions

### Step 1: Initialize Git and Push to GitHub (Without Sensitive Files)
Run these commands in PowerShell within `c:\Users\Dell\Downloads\invoicecraft-studio`:

```powershell
# 1. Initialize git
git init

# 2. Check that .gitignore is respected (no .json service accounts or .env files staged)
git status

# 3. Stage and commit clean codebase
git add .
git commit -m "feat: complete visible sender address editing, security audit, and deployment readiness"

# 4. Create and push to your GitHub repository
# (Replace YOUR_USERNAME and YOUR_REPO with your GitHub details)
git remote add origin https://github.com/YOUR_USERNAME/invoicecraft-studio.git
git branch -M main
git push -u origin main
```

> **CRITICAL SECURITY NOTE:** Verify with `git status` that `invoicecraftstudio-firebase-adminsdk-*.json` and `.env` are NOT listed in the changes to be committed.

---

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository: `invoicecraft-studio`.
4. Framework Preset: **Next.js** (Root Directory: `./`).

---

### Step 3: Configure Vercel Environment Variables

Add the following environment variables in the Vercel Dashboard under **Project Settings -> Environment Variables**:

| Variable Name | Environment | Purpose / Value |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Production, Preview | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Production, Preview | `[your-project].firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Production, Preview | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Production, Preview | `[your-project].firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Production, Preview | Firebase App ID |
| `CLOUDINARY_CLOUD_NAME` | Production, Preview (Server-only) | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Production, Preview (Server-only) | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Production, Preview (Server-only) | Cloudinary API Secret |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Production, Preview (Server-only) | Single-line stringified service account JSON |

#### Formatting `FIREBASE_SERVICE_ACCOUNT_JSON` for Vercel
Copy the entire content of your Firebase service account JSON into a single line:
```json
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
```
Paste this single-line string into `FIREBASE_SERVICE_ACCOUNT_JSON`. The `admin.ts` loader will automatically parse it and connect Firebase Admin without requiring any local file paths.

---

### Step 4: Configure Firebase Authorized Domains
After Vercel assigns your production URL (e.g. `invoicecraft-studio.vercel.app`):
1. Go to **Firebase Console -> Authentication -> Settings -> Authorized domains**.
2. Click **Add domain**.
3. Enter your Vercel deployment domain (e.g., `invoicecraft-studio.vercel.app`).
4. Also add any custom domains you assign to the project.

---

### Step 5: Verify Deployment
Perform the test business scenario on the live deployment:
1. Register and log in.
2. Create workspace **The Gift Garden** with currency **PKR**.
3. Open **Create Invoice** and test the **Edit Sender Details** button.
4. Verify that Option A changes the draft only and leaves the workspace profile untouched.
5. Create customer **Almas**, add items (Bouquet: PKR 2,500; Cake: PKR 1,500; Delivery: PKR 400), and verify total is PKR 4,400.
6. Issue the invoice, download the branded PDF, and record a payment of PKR 1,000.
