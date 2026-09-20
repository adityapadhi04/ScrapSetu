import React from 'react';
import { calculateTransactionImpact } from '../../services/environmentalImpactService';

/**
 * ScrapSetu — Digital Scrap Receipt Component (Module 9)
 *
 * Displays a printable, shareable receipt for a completed scrap transaction.
 * Includes all traceability chain IDs, payment details, and a demo receipt code.
 *
 * PROTOTYPE DISCLAIMER:
 * This is a DEMO RECEIPT for prototype traceability purposes only.
 * It does not constitute a legal tax invoice, GST receipt, or financial document.
 * The "Demo Receipt Code" is a simple identifier, not a QR payment code.
 */
export const DigitalScrapReceipt = ({ transaction, handover, payment, style }) => {
  if (!transaction) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount) => {
    if (amount == null) return '—';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const statusColor = (status) => {
    if (!status) return '#64748b';
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'confirmed' || s === 'recorded') return '#15803d';
    if (s === 'pending' || s === 'collector_confirmed') return '#d97706';
    if (s === 'cancelled' || s === 'failed' || s === 'disputed') return '#dc2626';
    return '#2563eb';
  };

  const buyerTypeLabel = transaction.buyerRole === 'repair' ? 'Repair Shop' : 'Authorized Recycler';
  const demoReceiptCode = `SCRAP-${transaction.transactionId}`;

  const handoverMethodLabel = {
    collector_delivers: 'Collector Delivers',
    buyer_pickup: 'Buyer Pickup',
    drop_off: 'Drop-off at Buyer Location'
  }[handover?.handoverMethod] || (handover?.handoverMethod || '—');

  const envImpact = calculateTransactionImpact(transaction);

  return (
    <div
      id={`receipt-${transaction.transactionId}`}
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '14px',
        padding: '1.5rem',
        maxWidth: '540px',
        width: '100%',
        fontFamily: 'system-ui, sans-serif',
        ...style
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
          🔗 ScrapSetu
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Digital Scrap Receipt
        </div>
        <div style={{ marginTop: '8px', display: 'inline-block', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.72rem', padding: '3px 8px', borderRadius: '5px', fontWeight: 600 }}>
          ⚠️ Demo receipt — not a legal financial document
        </div>
      </div>

      {/* Receipt Code */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Demo Receipt Code</div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '1.1rem',
          fontWeight: 900,
          color: '#0f172a',
          background: '#f1f5f9',
          padding: '6px 16px',
          borderRadius: '8px',
          display: 'inline-block',
          letterSpacing: '0.05em'
        }}>
          {demoReceiptCode}
        </div>
      </div>

      {/* ID Chain */}
      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.76rem' }}>
        <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em' }}>Traceability Chain</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
          {[
            { label: 'LOT', value: transaction.lotId },
            { label: 'OFR', value: transaction.offerId },
            { label: 'TXN', value: transaction.transactionId },
            handover ? { label: 'HAND', value: handover.handoverId } : null,
            payment ? { label: 'PAY', value: payment.paymentId } : null
          ].filter(Boolean).map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                {item.value}
              </span>
              {idx < arr.length - 1 && <span style={{ color: '#94a3b8' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
        {[
          { label: 'Date', value: formatDate(transaction.createdAt) },
          { label: 'Collector', value: transaction.collectorName || transaction.collectorId },
          { label: 'Buyer', value: transaction.buyerName },
          { label: 'Buyer Type', value: buyerTypeLabel },
          { label: 'Material', value: `${transaction.materialCategory}${transaction.materialSubcategory ? ` (${transaction.materialSubcategory})` : ''}` },
          { label: 'Weight', value: `${transaction.weight} ${transaction.weightUnit}` },
          { label: 'Agreed Price', value: `${formatAmount(transaction.agreedPrice)}/${transaction.priceUnit}` },
          { label: 'Total Amount', value: formatAmount(transaction.totalAmount), highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ fontWeight: highlight ? 800 : 600, color: highlight ? '#15803d' : '#0f172a', fontSize: highlight ? '1rem' : '0.85rem' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Status Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
        {[
          { label: 'Transaction', value: transaction.transactionStatus?.replace(/_/g, ' ') || '—' },
          { label: 'Handover', value: transaction.handoverStatus?.replace(/_/g, ' ') || '—' },
          { label: 'Payment', value: transaction.paymentStatus?.replace(/_/g, ' ') || '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.66rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: statusColor(value), textTransform: 'capitalize' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Environmental Contribution (Module 11) */}
      {envImpact && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🌱 Environmental Contribution
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
              Prototype Estimate
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#4b5563' }}>Recovery Pathway:</span>
            <strong style={{ color: envImpact.pathway === 'Reuse / Repair' ? '#b45309' : '#0369a1' }}>
              {envImpact.pathway === 'Reuse / Repair' ? '🔧 Reuse / Repair' : '♻️ Authorized Recycling'}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#4b5563' }}>Material Diverted:</span>
            <strong style={{ color: '#15803d' }}>
              {envImpact.divertedWeight} kg ({transaction.materialCategory})
            </strong>
          </div>

          {envImpact.benefitDescription && (
            <p style={{ margin: '6px 0 0 0', fontSize: '0.74rem', color: '#166534', lineHeight: 1.35, fontStyle: 'italic' }}>
              "{envImpact.benefitDescription}"
            </p>
          )}

          <div style={{ fontSize: '0.66rem', color: '#6b7280', marginTop: '6px', borderTop: '1px dashed #86efac', paddingTop: '4px' }}>
            ⚠️ Prototype environmental estimate based on mass diversion. Not a certified carbon credit or regulatory offset.
          </div>
        </div>
      )}

      {/* Payment Details */}
      {payment && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
          <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '5px' }}>Payment Details</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#374151' }}>Method:</span>
            <strong>{payment.paymentMethod}</strong>
          </div>
          {payment.referenceNote && (
            <div style={{ marginTop: '4px', color: '#4b5563', fontStyle: 'italic', fontSize: '0.78rem' }}>
              "{payment.referenceNote}"
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ color: '#374151' }}>Recorded:</span>
            <span>{formatDate(payment.paidAt)}</span>
          </div>
        </div>
      )}

      {/* Handover Details */}
      {handover && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
          <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: '5px' }}>Handover Details</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#374151' }}>Method:</span>
            <strong>{handoverMethodLabel}</strong>
          </div>
          {handover.handoverDate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: '#374141' }}>Date:</span>
              <span>{formatDate(handover.handoverDate)}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {transaction.notes && (
        <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
          Note: {transaction.notes}
        </div>
      )}

      {/* Footer Disclaimer */}
      <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', lineHeight: 1.5 }}>
        <strong>Demo payment record — not real payment processing.</strong><br />
        ScrapSetu Prototype • SIH26229 • CPCB E-Waste Traceability
      </div>
    </div>
  );
};

export default DigitalScrapReceipt;
