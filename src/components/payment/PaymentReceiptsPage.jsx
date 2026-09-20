/**
 * ScrapSetu — Payment Receipts Page (Module 16)
 *
 * Shared page component for Repair Shop and Recycler to view all their
 * uploaded payment receipts and statuses.
 *
 * Used as:
 *   <PaymentReceiptsPage role="repair" backPath="/repair-shop/transactions" />
 *   <PaymentReceiptsPage role="recycler" backPath="/recycler/orders" />
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import PageContainer from '../common/PageContainer';
import Card from '../common/Card';
import {
  getReceiptsByUploader,
  formatFileSize,
  getStatusColor,
  getStatusLabel,
} from '../../services/paymentReceiptService';
import PaymentReceiptModal from './PaymentReceiptModal';
import { getTransactionById } from '../../services/transactionService';

const PaymentReceiptsPage = ({ role, backPath, NavBar }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const userId = user?.userId || '';

  const [receipts, setReceipts] = useState([]);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setReceipts(getReceiptsByUploader(userId));
  }, [userId, refreshKey]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleOpenReceipt = (receipt) => {
    // Load the transaction for this receipt to pass to modal
    const tx = getTransactionById(receipt.transactionId);
    if (tx) {
      setSelectedReceiptTx({ ...tx, ...receipt._txOverride });
    } else {
      // Reconstruct minimal transaction object from receipt data
      setSelectedReceiptTx({
        transactionId: receipt.transactionId,
        lotId: receipt.lotId,
        totalAmount: receipt.amount,
        materialCategory: receipt.materialCategory,
        collectorName: '—',
        paymentMethod: receipt.paymentMethod,
        cfOrderId: receipt.cfOrderId,
        cfPaymentId: receipt.cfPaymentId,
      });
    }
  };

  const isRepair = role === 'repair';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1100px">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button
            onClick={() => navigate(backPath)}
            className="btn btn-ghost"
            style={{ padding: '6px' }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              📎 Payment Receipts
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              All payment receipts uploaded by your {isRepair ? 'repair shop' : 'recycler facility'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            style={{
              background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {NavBar && <NavBar />}

        {/* Status Legend */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {['pending', 'uploaded', 'verified', 'rejected'].map((s) => {
            const c = getStatusColor(s);
            return (
              <span
                key={s}
                style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
                  borderRadius: '99px', background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                }}
              >
                {getStatusLabel(s)}
              </span>
            );
          })}
        </div>

        {/* Receipt List */}
        {receipts.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📎</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Receipts Yet</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Upload payment receipts from the Transactions page after recording a payment.
            </p>
            <button
              onClick={() => navigate(backPath)}
              style={{
                marginTop: '1rem', padding: '0.65rem 1.5rem',
                background: '#0f172a', color: '#fff', border: 'none',
                borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Go to Transactions
            </button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {receipts.map((r) => {
              const sc = getStatusColor(r.receiptStatus);
              return (
                <Card
                  key={r.receiptId}
                  style={{ padding: '1.15rem', borderLeft: `4px solid ${sc.border}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      {/* IDs row */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {[r.receiptId, r.transactionId, r.lotId].filter(Boolean).map((id) => (
                          <span
                            key={id}
                            style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}
                          >
                            {id}
                          </span>
                        ))}
                        {/* Status badge */}
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 800, padding: '2px 9px',
                          borderRadius: '99px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          textTransform: 'uppercase',
                        }}>
                          {r.receiptStatus}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.0rem', fontWeight: 700, marginBottom: '2px' }}>
                        {r.materialCategory || 'Payment Receipt'}
                      </h3>

                      {/* File info */}
                      {r.filename ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#475569', marginBottom: '2px' }}>
                          <FileText size={13} />
                          <span style={{ fontWeight: 600 }}>{r.filename}</span>
                          <span style={{ color: '#94a3b8' }}>({formatFileSize(r.fileSizeBytes)})</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '2px' }}>
                          No file uploaded yet
                        </div>
                      )}

                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {r.uploadTimestamp
                          ? `Uploaded: ${new Date(r.uploadTimestamp).toLocaleString('en-IN')}`
                          : `Created: ${new Date(r.createdAt).toLocaleString('en-IN')}`}
                        {' • '}Payment: <strong>{r.paymentMethod}</strong>
                      </div>

                      {r.cfOrderId && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          🔗 Cashfree: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{r.cfOrderId}</span>
                        </div>
                      )}

                      {r.rejectionReason && (
                        <div style={{ fontSize: '0.76rem', color: '#dc2626', marginTop: '4px', fontStyle: 'italic' }}>
                          ❌ Rejected: {r.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Right: Amount + Actions */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d', marginBottom: '8px' }}>
                        ₹{(r.amount || 0).toLocaleString('en-IN')}
                      </div>
                      <button
                        id={`btn-manage-receipt-${r.receiptId}`}
                        onClick={() => handleOpenReceipt(r)}
                        style={{
                          padding: '6px 14px', background: sc.color, color: '#fff',
                          border: 'none', borderRadius: '8px', fontSize: '0.8rem',
                          fontWeight: 700, cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: '5px',
                        }}
                      >
                        <Upload size={13} />
                        {r.receiptStatus === 'pending' || r.receiptStatus === 'rejected' ? 'Upload' : 'View/Manage'}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>

      {/* Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
        uploadedBy={userId}
        uploadedByRole={role}
        buyerName={user?.name || ''}
        onUploaded={() => {
          setSelectedReceiptTx(null);
          handleRefresh();
        }}
      />
    </div>
  );
};

export default PaymentReceiptsPage;
