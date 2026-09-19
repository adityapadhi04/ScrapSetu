import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  ArrowLeft, 
  Check, 
  Package, 
  IndianRupee, 
  QrCode, 
  FileCheck, 
  User, 
  Sparkles, 
  Info, 
  Upload, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Store, 
  Recycle, 
  LogOut,
  Trash2,
  RefreshCw,
  AlertCircle,
  Edit3,
  PlusCircle,
  HelpCircle,
  CheckCircle,
  Cpu,
  Cable,
  BatteryCharging,
  Zap,
  Monitor,
  Smartphone,
  Laptop
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import MobileBottomNav from '../../components/common/MobileBottomNav';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  getScrapLotsByCollector, 
  createScrapLot, 
  MATERIAL_OPTIONS, 
  CONDITION_OPTIONS 
} from '../../services/scrapLotService';
import { 
  MOCK_COLLECTOR_DATA, 
  MOCK_COLLECTOR_TRANSACTIONS 
} from '../../data/mockData';

/**
 * 7-Step Mobile-First Scrap Lot Creation Wizard for Collector (Module 3)
 * Lets collectors photograph, categorize, weigh, grade, and create real scrap lots.
 */
export const CollectorSellPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';

  // Wizard Step state: 1 (Photo) -> 2 (Material) -> 3 (Weight) -> 4 (Condition) -> 5 (Location) -> 6 (Notes & Review) -> 7 (Success)
  const [step, setStep] = useState(1);

  // Form Fields (Preserved across Back/Next navigation)
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [materialType, setMaterialType] = useState('PCB');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [condition, setCondition] = useState('fair');
  const [locationArea, setLocationArea] = useState(user?.meta?.area || 'Gunupur');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLot, setCreatedLot] = useState(null);

  // Hidden File Inputs for Camera & Gallery
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Handle Photo File Upload / Capture
  const handlePhotoChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('photoFormatError'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('photoSizeError'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target.result;
      setPhoto(dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setError('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Optional Geolocation Autofill
  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationArea('Gunupur Sector 2 (GPS Verified)');
        },
        (err) => {
          // Gracefully fallback to default without crashing
          setLocationArea('Gunupur');
        },
        { timeout: 5000 }
      );
    }
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedFromPhoto = () => {
    if (!photo) {
      setError(t('photoRequiredWarning'));
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 3 Validation -> Proceed to Step 4
  const handleProceedFromWeight = () => {
    const num = parseFloat(weight);
    if (isNaN(num) || num <= 0) {
      setError(t('weightRequiredWarning'));
      return;
    }
    setError('');
    setStep(4);
  };

  // Step 5 Validation -> Proceed to Step 6
  const handleProceedFromLocation = () => {
    if (!locationArea.trim()) {
      setError(t('locationRequiredWarning'));
      return;
    }
    setError('');
    setStep(6);
  };

  // Final Submission: Create Scrap Lot
  const handleCreateLot = () => {
    setError('');
    setIsSubmitting(true);

    try {
      const selectedMatObj = MATERIAL_OPTIONS.find((m) => m.type === materialType);
      const category = selectedMatObj?.category || 'Electronic Components';

      const newLot = createScrapLot({
        collectorId: activeCollectorId,
        materialType,
        materialCategory: category,
        photo,
        weight,
        weightUnit,
        condition,
        location: locationArea,
        notes
      });

      setCreatedLot(newLot);
      setStep(7); // Success Screen
    } catch (err) {
      console.error('Failed to create scrap lot:', err);
      setError(err.message || 'Failed to create scrap lot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset wizard to create another lot
  const handleCreateAnother = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setMaterialType('PCB');
    setWeight('');
    setWeightUnit('kg');
    setCondition('fair');
    setLocationArea(user?.meta?.area || 'Gunupur');
    setNotes('');
    setError('');
    setCreatedLot(null);
    setStep(1);
  };

  const selectedMaterialObj = MATERIAL_OPTIONS.find((m) => m.type === materialType) || MATERIAL_OPTIONS[0];
  const selectedConditionObj = CONDITION_OPTIONS.find((c) => c.key === condition) || CONDITION_OPTIONS[1];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer mobile>
        
        {/* Wizard Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              id="wizard-back-button"
              onClick={() => {
                if (step > 1 && step < 7) {
                  setError('');
                  setStep(step - 1);
                } else {
                  navigate('/collector');
                }
              }}
              className="btn btn-ghost"
              style={{ padding: '6px', minHeight: '36px' }}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {step === 7 ? t('lotCreatedSuccess') : t('sellScrap')}
            </h1>
          </div>

          {step < 7 && (
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: '99px' }}>
              {t('stepProgress', { step, total: 6 }).replace('{step}', step).replace('{total}', 6)}
            </span>
          )}
        </div>

        {/* Compact Progress Bar */}
        {step < 7 && (
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '99px', marginBottom: '1.25rem', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(step / 6) * 100}%`,
                height: '100%',
                background: '#15803d',
                borderRadius: '99px',
                transition: 'width 0.25s ease'
              }}
            />
          </div>
        )}

        {/* Common Error Banner */}
        {error && (
          <div
            id="wizard-error-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.86rem',
              fontWeight: 600,
              marginBottom: '1rem',
              animation: 'shake 0.2s ease-in-out'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            STEP 1: ADD PHOTO (Mobile-friendly camera / gallery upload & preview)
            ========================================================================= */}
        {step === 1 && (
          <div>
            {/* Hidden File Inputs */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
              id="camera-file-input"
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={galleryInputRef}
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
              id="gallery-file-input"
            />

            {!photoPreview ? (
              <div
                style={{
                  borderRadius: '20px',
                  background: '#0f172a',
                  color: 'white',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                  border: '2px dashed #475569'
                }}
              >
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '20px',
                    background: 'rgba(134, 239, 172, 0.15)',
                    color: '#86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}
                >
                  <Camera size={36} />
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  {t('addScrapPhoto')}
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.75rem', lineHeight: 1.4 }}>
                  {t('photoSubtitle')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <button
                    id="btn-take-photo"
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '0.9rem',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      borderRadius: '12px',
                      border: 'none',
                      background: '#15803d',
                      color: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(21, 128, 61, 0.35)'
                    }}
                  >
                    <Camera size={20} />
                    <span>📷 {t('takePhoto')}</span>
                  </button>

                  <button
                    id="btn-upload-gallery"
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderRadius: '12px',
                      border: '1px solid #475569',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={18} />
                    <span>🖼 {t('uploadFromGallery')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <Card style={{ padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxHeight: '280px', borderRadius: '12px', overflow: 'hidden', background: '#0f172a', marginBottom: '1rem' }}>
                  <img
                    id="photo-preview-img"
                    src={photoPreview}
                    alt="Scrap Preview"
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#86efac',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    ✓ Photo Added
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '0.65rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={15} />
                    <span>{t('retakePhoto')}</span>
                  </button>

                  <button
                    id="btn-remove-photo"
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '0.65rem 1rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>{t('removePhoto')}</span>
                  </button>
                </div>
              </Card>
            )}

            {photoPreview && (
              <button
                id="btn-step1-next"
                type="button"
                onClick={handleProceedFromPhoto}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  border: 'none',
                  background: '#15803d',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(21, 128, 61, 0.3)'
                }}
              >
                <span>Continue to Material →</span>
              </button>
            )}
          </div>
        )}

        {/* =========================================================================
            STEP 2: SELECT SCRAP TYPE (Manual Material Selection)
            ========================================================================= */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {t('selectScrapType')}
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span>{t('manualSelection')}</span>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
              {MATERIAL_OPTIONS.map((mat) => {
                const isSelected = materialType === mat.type;
                const matLabel = t(mat.nameKey, mat.fallbackName);
                const catLabel = t(mat.categoryKey, mat.category);

                return (
                  <button
                    key={mat.type}
                    type="button"
                    onClick={() => setMaterialType(mat.type)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      border: isSelected ? `2.5px solid ${mat.color}` : '1.5px solid #e2e8f0',
                      background: isSelected ? mat.bg : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>{mat.icon}</span>
                      {isSelected && <CheckCircle size={18} color={mat.color} />}
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: isSelected ? 800 : 700, color: '#0f172a', marginBottom: '2px' }}>
                      {matLabel}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                      {catLabel}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ← {t('back')}
              </button>

              <button
                id="btn-step2-next"
                type="button"
                onClick={() => setStep(3)}
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: 'none',
                  background: '#15803d',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
                }}
              >
                <span>Next: Weight →</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: ENTER WEIGHT
            ========================================================================= */}
        {step === 3 && (
          <div>
            <Card style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {t('enterWeight')}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Selected Item: <strong>{selectedMaterialObj.icon} {t(selectedMaterialObj.nameKey, selectedMaterialObj.fallbackName)}</strong>
              </p>

              {/* Unit Switcher */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setWeightUnit('kg')}
                  style={{
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: weightUnit === 'kg' ? '2px solid #15803d' : '1px solid #e2e8f0',
                    background: weightUnit === 'kg' ? '#dcfce7' : '#ffffff',
                    color: weightUnit === 'kg' ? '#15803d' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  kg ({t('unitKg')})
                </button>
                <button
                  type="button"
                  onClick={() => setWeightUnit('g')}
                  style={{
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: weightUnit === 'g' ? '2px solid #15803d' : '1px solid #e2e8f0',
                    background: weightUnit === 'g' ? '#dcfce7' : '#ffffff',
                    color: weightUnit === 'g' ? '#15803d' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  g ({t('unitG')})
                </button>
              </div>

              {/* Weight Numeric Input */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <input
                  id="lot-weight-input"
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="0.0"
                  autoFocus
                  style={{
                    width: '180px',
                    padding: '0.75rem',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: '2px solid #cbd5e1',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#15803d')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#64748b', marginLeft: '8px' }}>
                  {weightUnit}
                </span>
              </div>

              {/* Quick Weight Presets */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {['1.0', '2.5', '4.5', '10.0'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setWeight(preset);
                      if (error) setError('');
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: weight === preset ? '#dcfce7' : '#f8fafc',
                      color: weight === preset ? '#15803d' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    +{preset} {weightUnit}
                  </button>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ← {t('back')}
              </button>

              <button
                id="btn-step3-next"
                type="button"
                onClick={handleProceedFromWeight}
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: 'none',
                  background: '#15803d',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
                }}
              >
                <span>Next: Condition →</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: SELECT CONDITION
            ========================================================================= */}
        {step === 4 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {t('selectCondition')}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              {CONDITION_OPTIONS.map((cond) => {
                const isSelected = condition === cond.key;
                const condLabel = t(cond.labelKey, cond.fallbackName);

                return (
                  <button
                    key={cond.key}
                    type="button"
                    onClick={() => setCondition(cond.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: isSelected ? `2.5px solid ${cond.color}` : '1.5px solid #e2e8f0',
                      background: isSelected ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{cond.symbol}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {condLabel}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {cond.description}
                      </div>
                    </div>
                    {isSelected && <CheckCircle size={20} color={cond.color} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ← {t('back')}
              </button>

              <button
                id="btn-step4-next"
                type="button"
                onClick={() => setStep(5)}
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: 'none',
                  background: '#15803d',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
                }}
              >
                <span>Next: Location →</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 5: CONFIRM LOCATION
            ========================================================================= */}
        {step === 5 && (
          <div>
            <Card style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                <MapPin size={22} color="#15803d" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {t('confirmLocation')}
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Provide the collection or pickup location for this scrap lot.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="location-area-input"
                  style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
                >
                  {t('localityArea')} *
                </label>
                <input
                  id="location-area-input"
                  type="text"
                  value={locationArea}
                  onChange={(e) => {
                    setLocationArea(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Gunupur, Gandhi Chowk, Sector 4"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#15803d')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>

              <button
                id="btn-detect-location"
                type="button"
                onClick={handleDetectLocation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  background: '#f0fdf4',
                  color: '#15803d',
                  cursor: 'pointer'
                }}
              >
                <MapPin size={16} />
                <span>📍 {t('useCurrentLocation')}</span>
              </button>
            </Card>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(4)}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ← {t('back')}
              </button>

              <button
                id="btn-step5-next"
                type="button"
                onClick={handleProceedFromLocation}
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: 'none',
                  background: '#15803d',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
                }}
              >
                <span>Next: Review →</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 6: ADDITIONAL NOTES & REVIEW
            ========================================================================= */}
        {step === 6 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {t('reviewScrapLot')}
              </h2>
            </div>

            {/* Review Summary Card */}
            <Card style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
              {/* Photo Preview Thumbnail if available */}
              {photo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <img
                    src={photo}
                    alt="Scrap Preview"
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                      ✓ Photo Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Edit3 size={14} />
                    <span>{t('edit')}</span>
                  </button>
                </div>
              )}

              {/* Material Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{t('selectScrapType')}</span>
                  <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                    {selectedMaterialObj.icon} {t(selectedMaterialObj.nameKey, selectedMaterialObj.fallbackName)}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    ({t(selectedMaterialObj.categoryKey, selectedMaterialObj.category)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Edit3 size={14} />
                  <span>{t('edit')}</span>
                </button>
              </div>

              {/* Weight Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{t('enterWeight')}</span>
                  <strong style={{ fontSize: '1.05rem', color: '#15803d' }}>
                    {weight} {weightUnit}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Edit3 size={14} />
                  <span>{t('edit')}</span>
                </button>
              </div>

              {/* Condition Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{t('selectCondition')}</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                    {selectedConditionObj.symbol} {t(selectedConditionObj.labelKey, selectedConditionObj.fallbackName)}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Edit3 size={14} />
                  <span>{t('edit')}</span>
                </button>
              </div>

              {/* Location Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{t('confirmLocation')}</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                    📍 {locationArea}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Edit3 size={14} />
                  <span>{t('edit')}</span>
                </button>
              </div>
            </Card>

            {/* Optional Additional Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="lot-notes-input"
                style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}
              >
                {t('additionalNotes')}
              </label>
              <textarea
                id="lot-notes-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.92rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  color: '#0f172a',
                  resize: 'vertical'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#15803d')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep(5)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                ← {t('back')}
              </button>

              <button
                id="btn-create-lot"
                type="button"
                onClick={handleCreateLot}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0.9rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: 'none',
                  background: isSubmitting ? '#94a3b8' : '#15803d',
                  color: '#ffffff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(21, 128, 61, 0.35)'
                }}
              >
                <PlusCircle size={20} />
                <span>{isSubmitting ? t('creatingLot') : t('createScrapLot')}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 7: SUCCESS CONFIRMATION SCREEN
            ========================================================================= */}
        {step === 7 && createdLot && (
          <div>
            <Card
              style={{
                textAlign: 'center',
                padding: '2rem 1.25rem',
                border: '2px solid #86efac',
                background: '#f0fdf4',
                marginBottom: '1.25rem'
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.85rem auto',
                  color: '#15803d'
                }}
              >
                <Check size={36} />
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#15803d',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '99px',
                    letterSpacing: '0.04em'
                  }}
                >
                  {t('statusCreated')}
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534', margin: '0 0 0.4rem 0' }}>
                {t('lotCreatedSuccess')}
              </h2>

              {/* Prominent Lot ID Display */}
              <div
                style={{
                  background: '#ffffff',
                  border: '2px dashed #86efac',
                  borderRadius: '12px',
                  padding: '1rem',
                  maxWidth: '260px',
                  margin: '0 auto 1.25rem auto'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                  {t('lotId')}
                </span>
                <strong
                  id="created-lot-id-badge"
                  style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}
                >
                  {createdLot.id}
                </strong>
              </div>

              {/* Summary Details */}
              <div
                style={{
                  textAlign: 'left',
                  background: '#ffffff',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.88rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{t('selectScrapType')}</span>
                  <strong>{selectedMaterialObj.icon} {t(selectedMaterialObj.nameKey, selectedMaterialObj.fallbackName)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{t('enterWeight')}</span>
                  <strong style={{ color: '#15803d' }}>{createdLot.weight} {createdLot.weightUnit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{t('selectCondition')}</span>
                  <strong>{selectedConditionObj.symbol} {t(selectedConditionObj.labelKey, selectedConditionObj.fallbackName)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>{t('confirmLocation')}</span>
                  <strong>📍 {createdLot.location}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  id="btn-view-my-lots"
                  type="button"
                  onClick={() => navigate('/collector/lots')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '1rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    border: 'none',
                    background: '#15803d',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
                  }}
                >
                  <Package size={18} />
                  <span>📦 {t('viewMyLots')}</span>
                </button>

                <button
                  id="btn-create-another"
                  type="button"
                  onClick={handleCreateAnother}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '0.8rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    border: '1.5px solid #86efac',
                    background: '#ffffff',
                    color: '#15803d',
                    cursor: 'pointer'
                  }}
                >
                  <PlusCircle size={17} />
                  <span>➕ {t('createAnotherLot')}</span>
                </button>

                <button
                  id="btn-go-collector-dashboard"
                  type="button"
                  onClick={() => navigate('/collector')}
                  style={{
                    padding: '0.65rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  🏠 {t('goToDashboard')}
                </button>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Mobile-friendly Collector Transactions History (Card layout, not a table)
 */
export const CollectorTransactionsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => navigate('/collector')}
              className="btn btn-ghost"
              style={{ padding: '6px', minHeight: '36px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('transactions')}</h1>
          </div>
          <Badge variant="neutral">2 Records</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {MOCK_COLLECTOR_TRANSACTIONS.map((tx) => (
            <Card
              key={tx.id}
              style={{
                padding: '1.15rem',
                borderLeft: tx.statusType === 'completed' ? '5px solid #16a34a' : '5px solid #d97706'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <Badge variant={tx.statusType === 'completed' ? 'success' : 'warning'}>
                  {tx.statusBadge}
                </Badge>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: tx.statusType === 'completed' ? '#15803d' : '#b45309' }}>
                  {tx.amount}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '2px' }}>
                {tx.material}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                Weight: <strong>{tx.weight}</strong> • Buyer: <strong>{tx.buyerName}</strong> ({tx.buyerType})
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span>LOT: <strong>{tx.id}</strong> • {tx.date}</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>{tx.paymentMode}</span>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Simple Collector Earnings Screen
 */
export const CollectorEarningsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/collector')}
            className="btn btn-ghost"
            style={{ padding: '6px', minHeight: '36px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('earnings')}</h1>
        </div>

        {/* Hero Card: THIS MONTH */}
        <div className="card-hero-earnings" style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            THIS MONTH / इस महीने
          </span>
          <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0' }}>
            {MOCK_COLLECTOR_DATA.thisMonthTotal}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Completed ✓</span>
              <strong style={{ fontSize: '1.1rem', color: '#86efac' }}>
                {MOCK_COLLECTOR_DATA.completedEarnings}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Pending ⏳</span>
              <strong style={{ fontSize: '1.1rem', color: '#fde68a' }}>
                {MOCK_COLLECTOR_DATA.pendingEarnings}
              </strong>
            </div>
          </div>
        </div>

        {/* Recent Earnings List */}
        <Card style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
            Recent Earnings (हाल की बिक्री)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_COLLECTOR_DATA.recentEarningsBreakdown.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.92rem', display: 'block' }}>{item.material}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {item.weight} • {item.date}
                  </span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Minimal Privacy-Conscious Collector Profile
 */
export const CollectorProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer mobile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/collector')}
            className="btn btn-ghost"
            style={{ padding: '6px', minHeight: '36px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('profile')}</h1>
        </div>

        {/* Identity Summary Card */}
        <Card style={{ textAlign: 'center', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: '#15803d' }}>
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{MOCK_COLLECTOR_DATA.name}</h2>
          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748b', display: 'block', margin: '2px 0 6px 0' }}>
            ID: {MOCK_COLLECTOR_DATA.id}
          </span>
          <Badge variant="success">{t('collectorName')}</Badge>
        </Card>

        {/* Minimal Information Fields */}
        <Card style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Operating Area</span>
              <strong>{MOCK_COLLECTOR_DATA.operatingArea}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Total Completed Transactions</span>
              <strong>2 Lots (₹16,900)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Pending Handovers</span>
              <strong style={{ color: '#b45309' }}>1 Lot (₹1,550)</strong>
            </div>
          </div>
        </Card>

        {/* Switch Account Section */}
        <Card style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            🔄 {t('switchAccount')}
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.85rem' }}>
            Switch to a different portal account on this device.
          </p>
          <AccountSwitcher dropup={false} />
        </Card>

        {/* Logout Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button
            id="collector-logout-button"
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.85rem',
              borderRadius: '10px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Collector Lots Page
 */
export const CollectorLotsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';
  const [lots, setLots] = useState([]);

  useEffect(() => {
    const data = getScrapLotsByCollector(activeCollectorId);
    setLots(data);
  }, [activeCollectorId]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '4rem' }}>
      <PageContainer mobile>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              id="collector-lots-back-button"
              onClick={() => navigate('/collector')}
              className="btn btn-ghost"
              style={{ padding: '6px', minHeight: '36px' }}
              aria-label="Back to Collector Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              📦 {t('myLots')}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              id="lots-count-badge"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                padding: '3px 10px',
                borderRadius: '99px'
              }}
            >
              {lots.length} {lots.length === 1 ? 'Lot' : 'Lots'}
            </span>
            <button
              id="btn-add-scrap-lot-header"
              type="button"
              onClick={() => navigate('/collector/sell')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                background: '#15803d',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={14} />
              <span>{t('sellScrap')}</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {lots.length === 0 ? (
          <Card id="empty-lots-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #cbd5e1' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '20px',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: '#64748b'
              }}
            >
              <Package size={34} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
              {t('noLotsYet')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '280px', margin: '0 auto 1.5rem auto' }}>
              Photograph and document your collected e-waste materials to track them here.
            </p>
            <button
              id="btn-create-first-lot"
              type="button"
              onClick={() => navigate('/collector/sell')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.85rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                borderRadius: '10px',
                border: 'none',
                background: '#15803d',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(21, 128, 61, 0.3)'
              }}
            >
              <PlusCircle size={18} />
              <span>{t('createFirstLot')}</span>
            </button>
          </Card>
        ) : (
          <div id="collector-lots-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {lots.map((lot) => {
              const matObj = MATERIAL_OPTIONS.find((m) => m.type === lot.materialType);
              const condObj = CONDITION_OPTIONS.find((c) => c.key === lot.condition);

              const matName = matObj ? t(matObj.nameKey, matObj.fallbackName) : lot.materialType;
              const catName = matObj ? t(matObj.categoryKey, matObj.category) : lot.materialCategory;
              const condName = condObj ? t(condObj.labelKey, condObj.fallbackName) : lot.condition;

              const displayLocation = typeof lot.location === 'string'
                ? lot.location
                : (lot.location?.area || lot.location?.city || 'Local Pickup');

              return (
                <Card
                  key={lot.id}
                  className="collector-lot-card"
                  style={{
                    padding: '1.1rem',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    transition: 'box-shadow 0.15s ease'
                  }}
                >
                  {/* Top Bar: Lot ID + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="lot-id-tag"
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: '#0f172a',
                          background: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {lot.id}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(lot.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '99px'
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>{t('statusCreated')}</span>
                    </span>
                  </div>

                  {/* Main Content Row: Thumbnail/Icon + Details */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Thumbnail if photo attached, else stylized icon box */}
                    {lot.photo ? (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: '10px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid #e2e8f0',
                          background: '#0f172a'
                        }}
                      >
                        <img
                          src={lot.photo}
                          alt={matName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: '10px',
                          background: matObj?.bg || '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.75rem',
                          flexShrink: 0,
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {matObj?.icon || '📦'}
                      </div>
                    )}

                    {/* Middle Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                          {matName}
                        </h3>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d' }}>
                          {lot.weight} {lot.weightUnit}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>
                        {catName}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '4px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: condObj?.color || '#334155'
                          }}
                        >
                          {condObj?.symbol} {condName}
                        </span>

                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <MapPin size={11} />
                          <span>{displayLocation}</span>
                        </span>
                      </div>

                      {lot.notes && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', marginTop: '6px' }}>
                          "{lot.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};
