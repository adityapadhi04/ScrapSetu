import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import { IndianRupee, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { createOffer } from '../../services/offerService';

export const MakeOfferModal = ({
  isOpen,
  onClose,
  lot,
  buyerRole, // 'repair' | 'recycler'
  buyerId,
  buyerName,
  onOfferSubmitted
}) => {
  const { t } = useLanguage();
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill initial rate suggestion based on platform estimate midpoint if available
  useEffect(() => {
    if (lot) {
      setError(null);
      setSuccess(false);
      setMessage('');
      if (lot.priceEstimate?.fairPricePerKg) {
        setOfferedPrice(String(lot.priceEstimate.fairPricePerKg));
      } else if (lot.estimatedPrice) {
        setOfferedPrice(String(lot.estimatedPrice));
      } else {
        setOfferedPrice('');
      }
    }
  }, [lot]);

  if (!lot) return null;

  const weight = parseFloat(lot.weight) || 0;
  const priceNum = parseFloat(offeredPrice) || 0;
  const totalValue = Math.round(weight * priceNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (priceNum <= 0) {
      setError(t('offeredPriceMustBePositive') || 'Offered price must be greater than 0');
      return;
    }

    if (weight <= 0) {
      setError(t('invalidLotWeight') || 'Lot weight must be greater than 0');
      return;
    }

    if (!buyerId || !buyerRole) {
      setError(t('invalidBuyerIdentity') || 'Buyer identity could not be verified');
      return;
    }

    setSubmitting(true);
    try {
      const created = createOffer({
        lotId: lot.id,
        buyerId,
        buyerRole,
        buyerName: buyerName || (buyerRole === 'repair' ? 'Authorized Repair Shop' : 'Authorized Recycler'),
        materialCategory: lot.materialCategory || lot.materialType,
        weight,
        weightUnit: lot.weightUnit || 'kg',
        offeredPrice: priceNum,
        priceUnit: 'kg',
        message: message.trim(),
        status: 'submitted',
        sourceType: 'platform_user'
      });

      setSuccess(true);
      setTimeout(() => {
        setSubmitting(false);
        if (onOfferSubmitted) onOfferSubmitted(created);
        onClose();
      }, 900);
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Failed to submit offer');
    }
  };

  const displayLocation = typeof lot.location === 'string'
    ? lot.location
    : (lot.location?.area ? `${lot.location.area}, ${lot.location.city || ''}` : 'Regional Pickup');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('makeOffer')}: ${lot.id}`}
      maxWidth="560px"
    >
      <div>
        {/* Lot Headline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {lot.materialType || lot.materialCategory}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '3px 0 0 0' }}>
              Weight: <strong style={{ color: '#15803d' }}>{lot.weight} {lot.weightUnit || 'kg'}</strong> • Condition: <strong>{lot.condition || 'Fair'}</strong>
            </p>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>📍 {displayLocation}</span>
          </div>
          <Badge variant={buyerRole === 'repair' ? 'warning' : 'info'}>
            {buyerRole === 'repair' ? 'Repair Reuse' : 'Authorized Recycling'}
          </Badge>
        </div>

        {/* Transparent Checklist: Why can I offer? */}
        {lot.reasons && lot.reasons.length > 0 && (
          <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              ✓ {t('whyEligible')}
            </span>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: '#15803d', lineHeight: 1.5 }}>
              {lot.reasons.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Platform Estimate Display with non-binding disclaimer */}
        <div style={{ background: '#f0f9ff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IndianRupee size={15} />
              {t('platformEstimate')}:
            </span>
            <strong style={{ fontSize: '1rem', color: '#0284c7' }}>
              {lot.priceEstimate?.priceRangeFormatted || (lot.estimatedPrice ? `₹${lot.estimatedPrice}/kg` : 'Pending valuation')}
            </strong>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#0369a1', margin: '4px 0 0 0', lineHeight: 1.35 }}>
            {lot.priceEstimate?.explanation || 'Benchmark estimate based on regional scrap indices. You may offer above or below this reference rate.'}
          </p>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.25rem' }}>
            <div>
              <Input
                label={`${t('offeredPricePerKg')} (₹)`}
                type="number"
                step="0.5"
                min="1"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                placeholder="e.g. 540"
                required
              />
            </div>

            {/* Calculated Total Value Box */}
            <div style={{ background: '#f0fdf4', border: '1.5px dashed #86efac', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('totalOfferValue')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#475569', display: 'block' }}>
                  {weight} {lot.weightUnit || 'kg'} × ₹{priceNum || 0}/kg
                </span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d' }}>
                ₹{totalValue.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t('optionalMessage')}
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Ready for prompt local pickup / Interested in circuit IC components."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Feedback states */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              <span>{t('offerSubmittedSuccess')}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={submitting}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="secondary"
              fullWidth
              disabled={submitting || priceNum <= 0}
            >
              {submitting ? 'Submitting...' : t('submitOffer')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default MakeOfferModal;
