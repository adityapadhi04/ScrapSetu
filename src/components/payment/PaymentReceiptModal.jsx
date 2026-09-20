/**
 * ScrapSetu — Payment Receipt Modal (Module 16)
 *
 * Reusable modal for Repair Shop and Recycler to:
 *   1. Upload a payment receipt (JPG, PNG, PDF ≤ 5 MB)
 *   2. View existing uploaded receipt with status
 *   3. View/open PDF or image inline
 *
 * Props:
 *   isOpen          {boolean}
 *   onClose         {function}
 *   transaction     {object}   — the transaction being receipted
 *   uploadedBy      {string}   — user ID
 *   uploadedByRole  {string}   — 'repair' | 'recycler'
 *   buyerName       {string}
 *   onUploaded      {function} — called after successful upload
 */

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Eye, Trash2 } from 'lucide-react';
import {
  createAndUploadReceipt,
  getReceiptByTransaction,
  deleteReceipt,
  validateReceiptFile,
  formatFileSize,
  getStatusColor,
  getStatusLabel,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '../../services/paymentReceiptService';

const PaymentReceiptModal = ({
  isOpen,
  onClose,
  transaction,
  uploadedBy,
  uploadedByRole,
  buyerName = '',
  onUploaded,
}) => {
  const fileInputRef = useRef(null);

  const [existingReceipt, setExistingReceipt] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load existing receipt when modal opens
  useEffect(() => {
    if (isOpen && transaction?.transactionId) {
      const r = getReceiptByTransaction(transaction.transactionId);
      setExistingReceipt(r);
      setSelectedFile(null);
      setFileError('');
      setUploadSuccess(false);
      setDeleteError('');
      setShowPreview(false);
    }
  }, [isOpen, transaction?.transactionId]);

  if (!isOpen || !transaction) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateReceiptFile(file);
    if (err) {
      setFileError(err);
      setSelectedFile(null);
    } else {
      setFileError('');
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateReceiptFile(file);
    if (err) { setFileError(err); setSelectedFile(null); }
    else { setFileError(''); setSelectedFile(file); }
  };

  const handleUpload = async () => {
    if (!selectedFile) { setFileError('Please select a file.'); return; }
    setUploading(true);
    setFileError('');
    try {
      // Find Cashfree IDs from payments if available (optional linking)
      const updated = await createAndUploadReceipt({
        transactionId: transaction.transactionId,
        lotId: transaction.lotId,
        amount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod || 'Other',
        uploadedBy,
        uploadedByRole,
        buyerName,
        materialCategory: transaction.materialCategory,
        cfOrderId: transaction.cfOrderId || null,
        cfPaymentId: transaction.cfPaymentId || null,
        file: selectedFile,
      });
      setExistingReceipt(updated);
      setUploadSuccess(true);
      setSelectedFile(null);
      if (onUploaded) onUploaded(updated);
    } catch (err) {
      setFileError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (!existingReceipt) return;
    try {
      deleteReceipt(existingReceipt.receiptId, uploadedBy);
      setExistingReceipt(null);
      setUploadSuccess(false);
      setDeleteError('');
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  const statusInfo = existingReceipt ? getStatusColor(existingReceipt.receiptStatus) : null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
          padding: '1.1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              📎 Payment Receipt
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>
              Upload Payment Receipt
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
              {transaction.transactionId} • ₹{(transaction.totalAmount || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <button
            id="receipt-modal-close"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.35rem 1.5rem' }}>
          {/* Transaction Summary */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
            padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {[
                ['Transaction', transaction.transactionId],
                ['Lot', transaction.lotId || '—'],
                ['Material', transaction.materialCategory || '—'],
                ['Amount', `₹${(transaction.totalAmount || 0).toLocaleString('en-IN')}`],
                ['Payment Method', transaction.paymentMethod || 'Not recorded'],
                ['Collector', transaction.collectorName || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>{label}</span>
                  <strong style={{ color: '#0f172a' }}>{value}</strong>
                </div>
              ))}
            </div>
            {/* Cashfree link */}
            {(transaction.cfOrderId || existingReceipt?.cfOrderId) && (
              <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#64748b' }}>
                🔗 Cashfree Order: <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 700 }}>
                  {transaction.cfOrderId || existingReceipt?.cfOrderId}
                </span>
                {(transaction.cfPaymentId || existingReceipt?.cfPaymentId) && (
                  <span> • Payment: <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 700 }}>
                    {transaction.cfPaymentId || existingReceipt?.cfPaymentId}
                  </span></span>
                )}
              </div>
            )}
          </div>

          {/* ── Existing Receipt Section ── */}
          {existingReceipt && (
            <div style={{
              background: statusInfo.bg,
              border: `1.5px solid ${statusInfo.border}`,
              borderRadius: '10px',
              padding: '0.9rem 1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: statusInfo.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {getStatusLabel(existingReceipt.receiptStatus)}
                  </div>
                  {existingReceipt.filename && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <FileText size={14} color={statusInfo.color} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
                          {existingReceipt.filename}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {formatFileSize(existingReceipt.fileSizeBytes)} •{' '}
                        Uploaded: {existingReceipt.uploadTimestamp
                          ? new Date(existingReceipt.uploadTimestamp).toLocaleString('en-IN')
                          : '—'}
                      </div>
                      {existingReceipt.receiptId && (
                        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#94a3b8', marginTop: '2px' }}>
                          {existingReceipt.receiptId}
                        </div>
                      )}
                    </>
                  )}
                  {existingReceipt.rejectionReason && (
                    <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', fontStyle: 'italic' }}>
                      Reason: {existingReceipt.rejectionReason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                  {existingReceipt.fileData && (
                    <button
                      id={`btn-view-receipt-${existingReceipt.receiptId}`}
                      onClick={() => setShowPreview(!showPreview)}
                      style={{
                        background: statusInfo.color, color: '#fff', border: 'none',
                        borderRadius: '7px', padding: '5px 10px', fontSize: '0.76rem',
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <Eye size={13} /> View
                    </button>
                  )}
                  {existingReceipt.receiptStatus !== 'verified' && (
                    <button
                      id={`btn-delete-receipt-${existingReceipt.receiptId}`}
                      onClick={handleDelete}
                      style={{
                        background: '#fee2e2', color: '#dc2626', border: 'none',
                        borderRadius: '7px', padding: '5px 10px', fontSize: '0.76rem',
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Preview */}
              {showPreview && existingReceipt.fileData && (
                <div style={{ marginTop: '0.85rem', borderTop: `1px solid ${statusInfo.border}`, paddingTop: '0.75rem' }}>
                  {existingReceipt.fileType === 'application/pdf' ? (
                    <div style={{ textAlign: 'center' }}>
                      <a
                        href={existingReceipt.fileData}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-block', padding: '0.6rem 1.2rem',
                          background: '#1d4ed8', color: '#fff', borderRadius: '8px',
                          fontSize: '0.84rem', fontWeight: 700, textDecoration: 'none',
                        }}
                      >
                        📄 Open PDF in new tab
                      </a>
                    </div>
                  ) : (
                    <img
                      src={existingReceipt.fileData}
                      alt="Payment receipt"
                      style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  )}
                </div>
              )}

              {deleteError && (
                <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#dc2626' }}>{deleteError}</div>
              )}
            </div>
          )}

          {/* ── Success Banner ── */}
          {uploadSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px',
              padding: '0.65rem 1rem', marginBottom: '1.25rem',
              fontSize: '0.84rem', color: '#15803d', fontWeight: 700,
            }}>
              <CheckCircle2 size={18} />
              Receipt uploaded successfully! Awaiting verification.
            </div>
          )}

          {/* ── Upload Section (show if no verified receipt) ── */}
          {(!existingReceipt || existingReceipt.receiptStatus === 'rejected') && !uploadSuccess && (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>
                Upload Receipt Document
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: selectedFile ? '2px solid #15803d' : '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: selectedFile ? '#f0fdf4' : '#f8fafc',
                  transition: 'all 0.15s ease',
                  marginBottom: '0.75rem',
                }}
              >
                <Upload size={28} color={selectedFile ? '#15803d' : '#94a3b8'} style={{ marginBottom: '8px' }} />
                {selectedFile ? (
                  <>
                    <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.88rem' }}>
                      Click or drag to upload
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '4px' }}>
                      {ALLOWED_EXTENSIONS.join(', ').toUpperCase()} • Max {MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                id="receipt-file-input"
              />

              {fileError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#fee2e2', color: '#dc2626', padding: '0.5rem 0.75rem',
                  borderRadius: '7px', fontSize: '0.78rem', marginBottom: '0.75rem',
                }}>
                  <AlertCircle size={14} />
                  {fileError}
                </div>
              )}

              <button
                id="btn-upload-receipt-submit"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: !selectedFile || uploading ? '#e2e8f0' : 'linear-gradient(135deg,#15803d,#166534)',
                  color: !selectedFile || uploading ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={18} />
                {uploading ? 'Uploading…' : 'Upload Receipt'}
              </button>
            </>
          )}

          {/* Replace receipt button */}
          {existingReceipt && existingReceipt.receiptStatus !== 'verified' && uploadSuccess && (
            <button
              onClick={() => { setUploadSuccess(false); setExistingReceipt(null); }}
              style={{
                width: '100%', marginTop: '0.75rem', padding: '0.7rem',
                background: 'transparent', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: '10px',
                fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Replace Receipt
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: '0.6rem', padding: '0.7rem',
              background: 'transparent', color: '#64748b',
              border: '1px solid #e2e8f0', borderRadius: '10px',
              fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
