/**
 * ScrapSetu — Payment Receipt Service (Module 16)
 *
 * Stores payment receipt documents uploaded by Repair Shops and Recyclers.
 * Files are stored as base64 data URLs in localStorage (prototype/demo).
 *
 * Receipt statuses:
 *   pending            — receipt record created, no file yet
 *   uploaded           — file uploaded, awaiting verification
 *   verified           — admin/platform confirmed receipt
 *   rejected           — receipt rejected (reason stored)
 *
 * Each receipt links to: transactionId, lotId, amount, paymentMethod,
 *   uploadedBy (userId), uploadedByRole, filename, fileType, fileSize,
 *   fileData (base64), uploadTimestamp.
 *
 * Cashfree payments: cfOrderId and cfPaymentId linked where available.
 */

export const STORAGE_KEY_RECEIPTS = 'scrapsetu_payment_receipts';

export const RECEIPT_STATUSES = ['pending', 'uploaded', 'verified', 'rejected'];

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────

const getReceipts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECEIPTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveReceipts = (receipts) => {
  localStorage.setItem(STORAGE_KEY_RECEIPTS, JSON.stringify(receipts));
};

const generateReceiptId = (receipts) => {
  const max = receipts.reduce((acc, r) => {
    const num = parseInt((r.receiptId || '').replace('RCPT-', ''), 10);
    return isNaN(num) ? acc : Math.max(acc, num);
  }, 0);
  return `RCPT-${String(max + 1).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

export const validateReceiptFile = (file) => {
  if (!file) return 'No file selected.';
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Invalid file type. Please upload a JPG, PNG, or PDF.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is too large. Maximum size is 5 MB.';
  }
  return null; // OK
};

// ─────────────────────────────────────────────
// Create (initial placeholder before file upload)
// ─────────────────────────────────────────────

export const createReceiptRecord = ({
  transactionId,
  lotId,
  amount,
  paymentMethod,
  uploadedBy,
  uploadedByRole,
  buyerName,
  materialCategory,
  cfOrderId = null,
  cfPaymentId = null,
}) => {
  if (!transactionId) throw new Error('transactionId is required');
  if (!uploadedBy) throw new Error('uploadedBy is required');

  const receipts = getReceipts();

  // Idempotency: one active receipt per transaction (not rejected)
  const existing = receipts.find(
    (r) => r.transactionId === transactionId && r.receiptStatus !== 'rejected'
  );
  if (existing) return existing;

  const receiptId = generateReceiptId(receipts);
  const now = new Date().toISOString();

  const record = {
    receiptId,
    transactionId,
    lotId: lotId || null,
    amount: parseFloat(amount) || 0,
    paymentMethod: paymentMethod || 'Other',
    uploadedBy,
    uploadedByRole,
    buyerName: buyerName || '',
    materialCategory: materialCategory || '',
    cfOrderId,
    cfPaymentId,
    receiptStatus: 'pending',
    filename: null,
    fileType: null,
    fileSizeBytes: null,
    fileData: null,       // base64 data URL — set on upload
    uploadTimestamp: null,
    verifiedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };

  receipts.push(record);
  saveReceipts(receipts);
  return record;
};

// ─────────────────────────────────────────────
// Upload file to existing receipt record
// ─────────────────────────────────────────────

/**
 * Attach a file (as base64) to an existing receipt record.
 * Returns a Promise so callers can await FileReader.
 */
export const uploadReceiptFile = (receiptId, file) => {
  return new Promise((resolve, reject) => {
    const validationError = validateReceiptFile(file);
    if (validationError) {
      reject(new Error(validationError));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const receipts = getReceipts();
        const idx = receipts.findIndex((r) => r.receiptId === receiptId);
        if (idx === -1) {
          reject(new Error(`Receipt not found: ${receiptId}`));
          return;
        }
        const now = new Date().toISOString();
        receipts[idx] = {
          ...receipts[idx],
          receiptStatus: 'uploaded',
          filename: file.name,
          fileType: file.type,
          fileSizeBytes: file.size,
          fileData: e.target.result,  // base64 data URL
          uploadTimestamp: now,
          updatedAt: now,
        };
        saveReceipts(receipts);
        resolve(receipts[idx]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

// ─────────────────────────────────────────────
// Combined: create + upload in one step
// ─────────────────────────────────────────────

export const createAndUploadReceipt = async ({
  transactionId,
  lotId,
  amount,
  paymentMethod,
  uploadedBy,
  uploadedByRole,
  buyerName,
  materialCategory,
  cfOrderId,
  cfPaymentId,
  file,
}) => {
  const record = createReceiptRecord({
    transactionId, lotId, amount, paymentMethod,
    uploadedBy, uploadedByRole, buyerName, materialCategory,
    cfOrderId, cfPaymentId,
  });
  const updated = await uploadReceiptFile(record.receiptId, file);
  return updated;
};

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

export const getReceiptById = (receiptId) => {
  return getReceipts().find((r) => r.receiptId === receiptId) || null;
};

export const getReceiptByTransaction = (transactionId) => {
  return getReceipts().find((r) => r.transactionId === transactionId) || null;
};

export const getReceiptsByUploader = (uploadedBy) => {
  return getReceipts()
    .filter((r) => r.uploadedBy === uploadedBy)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getAllReceipts = () => {
  return getReceipts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// ─────────────────────────────────────────────
// Status Updates (idempotent)
// ─────────────────────────────────────────────

const _patchReceipt = (receiptId, patch) => {
  const receipts = getReceipts();
  const idx = receipts.findIndex((r) => r.receiptId === receiptId);
  if (idx === -1) throw new Error(`Receipt not found: ${receiptId}`);
  receipts[idx] = { ...receipts[idx], ...patch, updatedAt: new Date().toISOString() };
  saveReceipts(receipts);
  return receipts[idx];
};

export const verifyReceipt = (receiptId) => {
  return _patchReceipt(receiptId, {
    receiptStatus: 'verified',
    verifiedAt: new Date().toISOString(),
  });
};

export const rejectReceipt = (receiptId, reason = '') => {
  return _patchReceipt(receiptId, {
    receiptStatus: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  });
};

// ─────────────────────────────────────────────
// Delete (only pending/rejected can be deleted)
// ─────────────────────────────────────────────

export const deleteReceipt = (receiptId, requestingUserId) => {
  const receipts = getReceipts();
  const r = receipts.find((x) => x.receiptId === receiptId);
  if (!r) throw new Error(`Receipt not found: ${receiptId}`);
  if (r.uploadedBy !== requestingUserId) throw new Error('Unauthorized: cannot delete another user\'s receipt.');
  if (r.receiptStatus === 'verified') throw new Error('Cannot delete a verified receipt.');
  const updated = receipts.filter((x) => x.receiptId !== receiptId);
  saveReceipts(updated);
};

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────

export const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'verified': return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
    case 'uploaded': return { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' };
    case 'rejected': return { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' };
    default:         return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':  return '⏳ Pending Upload';
    case 'uploaded': return '📤 Uploaded — Awaiting Verification';
    case 'verified': return '✅ Verified';
    case 'rejected': return '❌ Rejected';
    default:         return status;
  }
};
