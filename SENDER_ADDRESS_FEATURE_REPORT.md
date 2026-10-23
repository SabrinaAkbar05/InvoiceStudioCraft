# SENDER ADDRESS FEATURE REPORT
**InvoiceCraft Studio — Phase 2 Implementation Summary**
**Date:** October 24, 2026

---

## 1. Feature Overview

The Visible Sender Address Editing feature enables users to view and customize the sender business information directly while creating or viewing invoices on `/invoices/new` and `/invoices/[id]`. The controls are placed prominently at the top of the editing interface rather than buried in settings.

---

## 2. User Interface Changes

### 2.1 Creation Page (`/invoices/new`)
Near the top of the left editing column, two balanced cards are prominently displayed:
1. **FROM (SENDER)**:
   - Displays sender name, street address, city, country, email, and phone.
   - Includes a prominent button labeled **"Edit Sender Details"**.
   - Features a direct link to change sender details at any time.
2. **BILL TO (CLIENT)**:
   - Displays selected recipient information with an **"Edit Client"** button that navigates directly to the client contacts tab.

### 2.2 Sender Details Modal (`SenderEditorModal.tsx`)
A dedicated, responsive dialog with full validation for all required fields:
- **Business / Sender Name** (required)
- **Street Address Line 1** (required)
- **Address Line 2** (optional)
- **City** (required)
- **State / Province** (optional)
- **Postal / ZIP Code** (optional)
- **Country** (required)
- **Email Address** (required, email format validated)
- **Phone Number** (optional)
- **Website** (optional)
- **Tax / NTN / VAT ID** (optional)

### 2.3 Two Save Options
Users choose how changes are applied via radio selection:
- **Option A: Update This Invoice Only** — Updates the current invoice draft without touching the workspace default profile.
- **Option B: Save as Default Business Profile** — Updates this invoice and syncs changes to the workspace profile in Firestore for all future invoices.

---

## 3. Template & Live Preview Integration

All four templates (`Corporate`, `Minimal`, `Elegant`, `Creative`) were updated:
```typescript
// Resolution pattern:
const senderName = invoice.sender?.name || workspace?.name || 'Your Company';
const senderAddress = invoice.sender?.address || workspace?.address;
```
Edits appear immediately in the split-screen live invoice document preview without requiring a page reload or PDF export.

---

## 4. Issued Invoice Immutability Protection

In `InvoiceDetailClient.tsx`:
- When viewing a draft invoice, the user can freely update the sender address.
- When viewing an **issued, partially paid, or paid invoice**, the sender information is locked to preserve financial history.
- If a correction is requested on an issued invoice, the user is offered a duplicate workflow into a fresh draft, preventing silent modifications to previously issued financial records.

---

## 5. Automated Verification

New unit test suite: `src/tests/sender-address.test.ts`
- `renders default workspace details when no invoice sender override is present` (PASS)
- `prioritizes invoice-specific sender override when provided` (PASS)
- `preserves workspace defaults when Option A (invoice-only) is applied` (PASS)
- `locks sender address on issued invoices against silent rewrite` (PASS)
