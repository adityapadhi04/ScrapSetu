import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Laptop,
  Wrench
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
import { identifyMaterial } from '../../services/materialIdentificationService';
import { getCatalogItemByCategory } from '../../data/materialCatalog';
import { estimateFairPrice } from '../../services/priceIntelligenceService';
import { evaluateReusePotential } from '../../services/reuseIntelligenceService';
import { findRepairShopMatches } from '../../services/repairMatchingService';
import { createRepairInquiry } from '../../services/repairShopService';

/**
 * 7-Step Mobile-First Scrap Lot Creation Wizard for Collector (Module 3)
 * Lets collectors photograph, categorize, weigh, grade, and create real scrap lots.
 */
export const CollectorSellPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';

  // Wizard Step state: 1 (Photo) -> 2 (AI Identify Material) -> 3 (Weight) -> 4 (Condition) -> 5 (Location) -> 6 (Notes & Review) -> 7 (Success)
  const [step, setStep] = useState(1);

  // Form Fields (Preserved across Back/Next navigation)
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [materialType, setMaterialType] = useState('PCB');
  const [materialSubcategory, setMaterialSubcategory] = useState('Computer PCB');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [condition, setCondition] = useState('fair');
  const [locationArea, setLocationArea] = useState(user?.meta?.area || 'Gunupur');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLot, setCreatedLot] = useState(null);

  // Module 4: AI Identification & Human-in-the-Loop State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [identificationMethod, setIdentificationMethod] = useState('demo_ai');
  const [confidenceScore, setConfidenceScore] = useState(0.91);
  const [collectorConfirmed, setCollectorConfirmed] = useState(false);
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState(null);
  const [aiSuggestedSubcategory, setAiSuggestedSubcategory] = useState(null);
  const [aiConfidenceScore, setAiConfidenceScore] = useState(null);

  // Module 5: Price Intelligence State
  const [showWhyPriceModal, setShowWhyPriceModal] = useState(false);

  // Compute explainable Fair Price Estimate dynamically
  const priceEstimate = useMemo(() => {
    if (!materialType || !weight) return null;
    const selectedMatObj = MATERIAL_OPTIONS.find((m) => m.type === materialType);
    const category = selectedMatObj?.category || 'Electronic Components';
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight <= 0) return null;

    return estimateFairPrice({
      materialCategory: category,
      materialSubcategory: materialSubcategory || selectedMatObj?.defaultSubcategory || materialType,
      weight: numWeight,
      weightUnit,
      condition,
      location: locationArea
    });
  }, [materialType, materialSubcategory, weight, weightUnit, condition, locationArea]);

  // Module 6: Reuse Intelligence & Repair Shop Marketplace State
  const [showRepairShopsModal, setShowRepairShopsModal] = useState(false);
  const [selectedShopDetails, setSelectedShopDetails] = useState(null);
  const [interestSentShops, setInterestSentShops] = useState([]);

  // Compute explainable Reuse Potential dynamically (Module 6)
  const reusePotential = useMemo(() => {
    if (!materialType) return null;
    const selectedMatObj = MATERIAL_OPTIONS.find((m) => m.type === materialType);
    const category = selectedMatObj?.category || materialType;
    return evaluateReusePotential({
      materialCategory: category,
      materialSubcategory: materialSubcategory || selectedMatObj?.defaultSubcategory || materialType,
      condition,
      weight: parseFloat(weight) || 0
    });
  }, [materialType, materialSubcategory, condition, weight]);

  // Compute matching repair shops dynamically (Module 6)
  const repairShopMatches = useMemo(() => {
    if (!reusePotential || (reusePotential.pathway !== 'reuse' && reusePotential.pathway !== 'both')) {
      return [];
    }
    const selectedMatObj = MATERIAL_OPTIONS.find((m) => m.type === materialType);
    const category = selectedMatObj?.category || materialType;
    return findRepairShopMatches({
      materialCategory: category,
      materialSubcategory: materialSubcategory || selectedMatObj?.defaultSubcategory || materialType,
      condition,
      location: locationArea
    });
  }, [reusePotential, materialType, materialSubcategory, condition, locationArea]);

  const handleSendInterest = (shopMatch) => {
    const targetShop = shopMatch.shop || shopMatch;
    try {
      createRepairInquiry({
        collectorId: activeCollectorId,
        collectorName: user?.name || 'Ramesh Kumar',
        lotId: createdLot?.id || null,
        repairShopId: targetShop.repairShopId,
        repairShopName: targetShop.name,
        materialCategory: materialType,
        materialSubcategory,
        condition,
        weightKg: parseFloat(weight) || 0,
        estimatedPrice: priceEstimate?.estimatedPrice || null,
        collectorLocation: locationArea
      });
      setInterestSentShops((prev) => [...prev, targetShop.repairShopId]);
    } catch (err) {
      console.error('Failed to send interest to repair shop:', err);
    }
  };

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

  // Step 1 Validation -> Proceed to Step 2 (Trigger AI inference)
  const handleProceedFromPhoto = async () => {
    if (!photo) {
      setError(t('photoRequiredWarning'));
      return;
    }
    setError('');
    setStep(2);

    // If AI identification has not yet run for this photo, run inference
    if (!aiResult) {
      setIsAnalyzing(true);
      try {
        const result = await identifyMaterial(photo, { skipDelay: false });
        setAiResult(result);
        setAiSuggestedCategory(result.materialCategory);
        setAiSuggestedSubcategory(result.materialSubcategory);
        setAiConfidenceScore(result.confidenceScore);

        if (result.isConfident) {
          setMaterialType(result.materialCategory);
          setMaterialSubcategory(result.materialSubcategory);
          setIdentificationMethod('demo_ai');
          setConfidenceScore(result.confidenceScore);
          setShowManualSelection(false);
        } else {
          // Low confidence -> allow manual selection fallback
          setMaterialType(result.materialCategory || 'Other E-waste');
          setMaterialSubcategory(result.materialSubcategory || 'Unsorted E-waste');
          setIdentificationMethod('manual');
          setConfidenceScore(result.confidenceScore);
          setShowManualSelection(true);
        }
      } catch (err) {
        console.error('AI inference error:', err);
        setShowManualSelection(true);
        setIdentificationMethod('manual');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // Collector confirms AI-suggested material
  const handleConfirmAiMaterial = () => {
    if (!aiResult) return;
    setMaterialType(aiResult.materialCategory);
    setMaterialSubcategory(aiResult.materialSubcategory);
    setIdentificationMethod('demo_ai');
    setConfidenceScore(aiResult.confidenceScore);
    setCollectorConfirmed(true);
    setStep(3); // Proceed to Weight
  };

  // Collector chooses to manually select another material (Human-in-the-Loop Override)
  const handleChooseAnotherMaterial = () => {
    setShowManualSelection(true);
  };

  // Collector selects category manually from catalog grid
  const handleSelectManualMaterial = (selectedCat) => {
    setMaterialType(selectedCat);
    const catItem = getCatalogItemByCategory(selectedCat);
    setMaterialSubcategory(catItem?.defaultSubcategory || selectedCat);
    setIdentificationMethod('manual');
    setCollectorConfirmed(true);
    // Preserves aiSuggestedCategory, aiSuggestedSubcategory, and aiConfidenceScore for audit tracking
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

  // Final Submission: Create Scrap Lot + Linked SIH Material Dataset Record
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
        materialSubcategory,
        photo,
        weight,
        weightUnit,
        condition,
        location: locationArea,
        notes,
        identificationMethod,
        confidenceScore,
        collectorConfirmed: true,
        aiSuggestedCategory,
        aiSuggestedSubcategory,
        aiConfidenceScore,
        estimatedPrice: priceEstimate?.midPrice || null,
        estimatedLotValueMin: priceEstimate?.estimatedLotValueMin || null,
        estimatedLotValueMax: priceEstimate?.estimatedLotValueMax || null
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
    setMaterialSubcategory('Computer PCB');
    setAiResult(null);
    setShowManualSelection(false);
    setIsAnalyzing(false);
    setIdentificationMethod('demo_ai');
    setConfidenceScore(0.91);
    setCollectorConfirmed(false);
    setAiSuggestedCategory(null);
    setAiSuggestedSubcategory(null);
    setAiConfidenceScore(null);
    setShowWhyPriceModal(false);
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
            STEP 2: IDENTIFY MATERIAL (AI Material Identification + Human Confirmation)
            ========================================================================= */}
        {step === 2 && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <Sparkles size={20} color="#15803d" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {t('identifyMaterial')}
                </h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                {t('prototypeNotice')}
              </p>
            </div>

            {/* Analyzing State with subtle animation */}
            {isAnalyzing && (
              <Card style={{ padding: '2.5rem 1.5rem', textAlign: 'center', marginBottom: '1.25rem', border: '2px solid #86efac', background: '#f0fdf4' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#bbf7d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    color: '#15803d',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }}
                >
                  <Sparkles size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>
                  {t('analyzingPhoto')}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '300px', margin: '0 auto 1.25rem auto' }}>
                  Extracting visual features and matching against prototype e-waste catalog rules...
                </p>
                <div style={{ width: '160px', height: '5px', background: '#bbf7d0', borderRadius: '99px', margin: '0 auto', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '60%',
                      height: '100%',
                      background: '#15803d',
                      borderRadius: '99px',
                      animation: 'pulse 1s infinite alternate'
                    }}
                  />
                </div>
              </Card>
            )}

            {/* AI Identification Result Screen */}
            {!isAnalyzing && aiResult && (
              <div>
                {/* Photo Thumbnail + Classification Pill */}
                {photo && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.75rem',
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '1rem'
                    }}
                  >
                    <img
                      src={photo}
                      alt="Uploaded Scrap"
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                        Scrap Photo
                      </span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                        {selectedMaterialObj.icon} {selectedMaterialObj.fallbackName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {t('retakePhoto')}
                    </button>
                  </div>
                )}

                {/* AI-Assisted Suggestion Card (when confident and not overridden) */}
                {aiResult.isConfident && !showManualSelection && (
                  <Card
                    id="ai-suggestion-card"
                    style={{
                      padding: '1.25rem',
                      border: '2px solid #86efac',
                      background: '#f0fdf4',
                      borderRadius: '14px',
                      marginBottom: '1.25rem'
                    }}
                  >
                    {/* Header badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#15803d',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '99px',
                          letterSpacing: '0.03em'
                        }}
                      >
                        <Sparkles size={12} />
                        <span>{t('aiAssistedSuggestion')}</span>
                      </span>

                      <span
                        id="ai-confidence-badge"
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#166534',
                          background: '#bbf7d0',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {t('aiConfidence')}: {Math.round(aiResult.confidenceScore * 100)}%
                      </span>
                    </div>

                    {/* Identified Material Main Badge */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #86efac',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <span style={{ fontSize: '2.4rem' }}>{selectedMaterialObj.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                          {aiResult.materialCategory}
                        </div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#15803d' }}>
                          {aiResult.materialSubcategory}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {aiResult.materialDescription}
                        </div>
                      </div>
                    </div>

                    {/* Why this suggestion? Accordion / Box */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        marginBottom: '1.25rem',
                        border: '1px solid #bbf7d0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Info size={15} color="#15803d" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534' }}>
                          {t('whyThisSuggestion')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                        {t('aiSuggestionExplanation')}
                      </p>
                      {aiResult.suggestions?.[0]?.rationale && (
                        <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                          "{aiResult.suggestions[0].rationale}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons: Confirm vs Choose Another */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        id="btn-confirm-ai-material"
                        type="button"
                        onClick={handleConfirmAiMaterial}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '0.9rem',
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
                        <Check size={18} />
                        <span>✓ {t('confirmMaterial', { material: aiResult.materialCategory }).replace('{material}', aiResult.materialCategory)}</span>
                      </button>

                      <button
                        id="btn-choose-another-material"
                        type="button"
                        onClick={handleChooseAnotherMaterial}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={15} />
                        <span>{t('chooseAnotherMaterial')}</span>
                      </button>
                    </div>
                  </Card>
                )}

                {/* Manual Selection Grid (shown if user overrides or if AI has low confidence) */}
                {(showManualSelection || !aiResult.isConfident) && (
                  <div>
                    {/* Notice if low confidence or override */}
                    {!aiResult.isConfident ? (
                      <div
                        id="low-confidence-banner"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#b45309',
                          fontSize: '0.84rem',
                          marginBottom: '1rem'
                        }}
                      >
                        <AlertCircle size={20} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>{t('notConfident')}: </strong>
                          <span>{t('notConfidentDesc')}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        id="human-override-banner"
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.78rem',
                          color: '#475569',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>
                          💡 AI Suggestion was <strong>{aiSuggestedCategory}</strong> ({Math.round((aiConfidenceScore || 0.91) * 100)}%). Select your confirmed material:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowManualSelection(false)}
                          style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Use AI Suggestion
                        </button>
                      </div>
                    )}

                    {/* Catalog Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                      {MATERIAL_OPTIONS.map((mat) => {
                        const isSelected = materialType === mat.type;
                        const matLabel = t(mat.nameKey, mat.fallbackName);
                        const catLabel = t(mat.categoryKey, mat.category);

                        return (
                          <button
                            key={mat.type}
                            id={`btn-select-${mat.type.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            type="button"
                            onClick={() => handleSelectManualMaterial(mat.type)}
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
                        onClick={() => {
                          setCollectorConfirmed(true);
                          setStep(3);
                        }}
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
              </div>
            )}
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
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{t('identifyMaterial')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                      {selectedMaterialObj.icon} {t(selectedMaterialObj.nameKey, selectedMaterialObj.fallbackName)}
                    </strong>
                    {materialSubcategory && (
                      <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
                        • {materialSubcategory}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: identificationMethod === 'demo_ai' ? '#dcfce7' : '#f1f5f9',
                        color: identificationMethod === 'demo_ai' ? '#15803d' : '#475569'
                      }}
                    >
                      {identificationMethod === 'demo_ai' ? `🤖 ${t('aiAssisted')} (${Math.round((confidenceScore || 0.91) * 100)}%)` : `👤 ${t('manualMethod')}`}
                    </span>
                    {identificationMethod === 'manual' && aiSuggestedCategory && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        (AI suggested: {aiSuggestedCategory})
                      </span>
                    )}
                  </div>
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

            {/* Module 5: Estimated Fair Price & Value Card */}
            {priceEstimate && (
              <Card
                id="estimated-fair-price-card"
                style={{
                  padding: '1.25rem',
                  border: '2px solid #86efac',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  borderRadius: '14px',
                  marginBottom: '1.25rem',
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#dcfce7',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#15803d'
                      }}
                    >
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                        {t('estimatedFairPrice')}
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {t('prototypeEstimateNotice')}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#047857',
                      background: '#d1fae5',
                      padding: '2px 8px',
                      borderRadius: '99px'
                    }}
                  >
                    Demo Prototype
                  </span>
                </div>

                {priceEstimate.isReliable ? (
                  <>
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #86efac',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                          {t('ratePerKg')}
                        </span>
                        <span
                          id="estimated-rate-range"
                          style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d' }}
                        >
                          ₹{priceEstimate.minPrice} – ₹{priceEstimate.maxPrice} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>/ kg</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                          {t('estimatedLotValue')} ({weight} {weightUnit})
                        </span>
                        <span
                          id="estimated-lot-value"
                          style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}
                        >
                          ₹{priceEstimate.estimatedLotValueMin} – ₹{priceEstimate.estimatedLotValueMax}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        id="btn-why-this-price"
                        type="button"
                        onClick={() => setShowWhyPriceModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'none',
                          border: 'none',
                          color: '#15803d',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: '4px 0'
                        }}
                      >
                        <HelpCircle size={15} />
                        <span>{t('whyThisPrice')}</span>
                      </button>

                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {priceEstimate.historicalRecordsUsed} {t('historicalRecordsUsed').toLowerCase()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1.5px solid #fde68a',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      color: '#92400e'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>
                      <AlertCircle size={16} />
                      <span>{t('notEnoughHistoricalData')}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#b45309', margin: 0 }}>
                      {t('notEnoughDataExplanation')}
                    </p>
                  </div>
                )}

                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.65rem', lineHeight: '1.3' }}>
                  ℹ️ {t('informationalEstimateDisclaimer')}
                </div>
              </Card>
            )}

            {/* Module 6: Reuse Before Recycle Advisory & Repair Shop Matches */}
            {reusePotential && (
              <Card
                id="reuse-recommendation-card"
                style={{
                  padding: '1.25rem',
                  border: (reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both')
                    ? '2px solid #fde047'
                    : '2px solid #93c5fd',
                  background: (reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both')
                    ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '14px',
                  marginBottom: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: (reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? '#fef3c7' : '#e0f2fe',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: (reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? '#d97706' : '#0284c7'
                      }}
                    >
                      {(reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? <Wrench size={18} /> : <Recycle size={18} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {t('reuseBeforeRecycle')}
                      </h3>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {t('reusePathwayRecommendation')}
                      </span>
                    </div>
                  </div>

                  <span
                    id="reuse-pathway-badge"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: (reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? '#92400e' : '#075985',
                      background: (reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? '#fef3c7' : '#e0f2fe',
                      border: `1px solid ${(reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? '#fde68a' : '#bae6fd'}`,
                      padding: '3px 9px',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {(reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? `🔧 ${t('pathwayReuse')}` : `♻️ ${t('pathwayRecycle')}`}
                  </span>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.85rem',
                    lineHeight: '1.45',
                    color: '#334155'
                  }}
                >
                  <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>
                    {reusePotential.reason}
                  </p>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {reusePotential.suggestedActions?.join(' • ')}
                  </div>
                </div>

                {/* Pathway Specific Action */}
                {(reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                        ⚡ {repairShopMatches.length} {t('repairShopsInterested')}
                      </span>
                      <button
                        id="btn-find-repair-shops"
                        type="button"
                        onClick={() => setShowRepairShopsModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#d97706',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 0.95rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
                        }}
                      >
                        <Wrench size={14} />
                        <span>{t('findRepairShops')} ({repairShopMatches.length})</span>
                      </button>
                    </div>

                    {/* Quick Preview of Top Match */}
                    {repairShopMatches.length > 0 && (
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #fef3c7',
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#0f172a' }}>{repairShopMatches[0].shop.name}</strong>
                          <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.72rem' }}>
                            📍 {repairShopMatches[0].distanceLabel}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>
                          ✓ {repairShopMatches[0].matchReasons[0]}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', color: '#0369a1' }}>
                      {t('recyclingRecommendedDesc')}
                    </span>
                    <button
                      id="btn-continue-recycler"
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('btn-create-lot');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t('continueToRecycler')} →
                    </button>
                  </div>
                )}

                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.65rem', lineHeight: '1.3' }}>
                  ℹ️ {t('reusePrototypeNotice')} • {t('repairShopNotice')}
                </div>
              </Card>
            )}

            {/* Modal: Repair Shops Interested (Module 6) */}
            {showRepairShopsModal && (
              <div
                id="repair-shops-modal"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.55)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  zIndex: 9999
                }}
                onClick={() => setShowRepairShopsModal(false)}
              >
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    maxWidth: '520px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '1.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                        <Wrench size={18} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {t('repairShopsInterested')}
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Based on {materialType} • {condition} condition • {locationArea || 'Gunupur'}
                        </span>
                      </div>
                    </div>
                    <button
                      id="btn-close-repair-shops"
                      type="button"
                      onClick={() => setShowRepairShopsModal(false)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', fontSize: '1.2rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.74rem', color: '#92400e', marginBottom: '1rem' }}>
                    ⚠️ {t('repairShopNotice')}
                  </div>

                  {repairShopMatches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>No repair shops found matching this material in this area.</p>
                      <span style={{ fontSize: '0.75rem' }}>You can still create a scrap lot to reach formal aggregators.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      {repairShopMatches.map((match) => {
                        const shop = match.shop;
                        const isSent = interestSentShops.includes(shop.repairShopId);

                        return (
                          <div
                            key={shop.repairShopId}
                            style={{
                              border: '1.5px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '1rem',
                              background: '#ffffff',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                  {shop.name}
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  📍 {match.distanceLabel} • Owner: <strong>{shop.ownerName}</strong>
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  color: match.hasActiveDemand ? '#b45309' : '#15803d',
                                  background: match.hasActiveDemand ? '#fef3c7' : '#dcfce7',
                                  padding: '2px 8px',
                                  borderRadius: '99px'
                                }}
                              >
                                {match.compatibility}
                              </span>
                            </div>

                            {/* Active Wanted Item Banner if present */}
                            {match.matchedWantedItem && (
                              <div
                                style={{
                                  background: '#fffbeb',
                                  border: '1px dashed #fde68a',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '0.74rem',
                                  color: '#b45309',
                                  margin: '6px 0',
                                  display: 'flex',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <span>⭐ <strong>Wants:</strong> {match.matchedWantedItem.materialCategory} ({match.matchedWantedItem.preferredCondition})</span>
                                <strong>{match.matchedWantedItem.offeringPrice}</strong>
                              </div>
                            )}

                            {/* "Why this shop?" Explanation */}
                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.6rem 0.75rem', margin: '8px 0' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                {t('whyThisShop')}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {match.matchReasons.map((r, i) => (
                                  <span key={i} style={{ fontSize: '0.74rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ color: '#15803d', fontWeight: 800 }}>✓</span> {r}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedShopDetails(shop)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#0284c7',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  padding: '4px 0'
                                }}
                              >
                                {t('viewShopDetails')} →
                              </button>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  disabled={isSent}
                                  onClick={() => handleSendInterest(match)}
                                  style={{
                                    background: isSent ? '#dcfce7' : '#15803d',
                                    color: isSent ? '#15803d' : '#ffffff',
                                    border: isSent ? '1px solid #86efac' : 'none',
                                    padding: '0.45rem 0.85rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    cursor: isSent ? 'default' : 'pointer'
                                  }}
                                >
                                  {isSent ? t('interestSent') : t('sendInterest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowRepairShopsModal(false)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t('skipDecideLater')}
                  </button>
                </div>
              </div>
            )}

            {/* Modal: View Shop Details */}
            {selectedShopDetails && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  zIndex: 10000
                }}
                onClick={() => setSelectedShopDetails(null)}
              >
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    maxWidth: '440px',
                    width: '100%',
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {selectedShopDetails.name}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ID: {selectedShopDetails.repairShopId} • {selectedShopDetails.sourceType === 'demo_seed' ? 'Demo Seed Shop' : 'Registered Shop'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedShopDetails(null)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Location</span>
                      <strong>📍 {typeof selectedShopDetails.location === 'object' ? `${selectedShopDetails.location.area}, ${selectedShopDetails.location.state}` : selectedShopDetails.location}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Owner / Contact</span>
                      <strong>{selectedShopDetails.ownerName} • {selectedShopDetails.contact}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Accepted Materials</span>
                      <strong>{selectedShopDetails.acceptedMaterials?.join(', ')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Services</span>
                      <span>{selectedShopDetails.services?.join(' • ')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedShopDetails(null)}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      disabled={interestSentShops.includes(selectedShopDetails.repairShopId)}
                      onClick={() => {
                        handleSendInterest(selectedShopDetails);
                        setSelectedShopDetails(null);
                      }}
                      style={{
                        flex: 2,
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: interestSentShops.includes(selectedShopDetails.repairShopId) ? '#dcfce7' : '#15803d',
                        color: interestSentShops.includes(selectedShopDetails.repairShopId) ? '#15803d' : '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {interestSentShops.includes(selectedShopDetails.repairShopId) ? t('interestSent') : t('sendInterest')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Why This Price Modal */}
            {showWhyPriceModal && priceEstimate && (
              <div
                id="why-price-modal"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(15, 23, 42, 0.55)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  zIndex: 9999
                }}
                onClick={() => setShowWhyPriceModal(false)}
              >
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    maxWidth: '440px',
                    width: '100%',
                    padding: '1.5rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #e2e8f0'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                        <HelpCircle size={18} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {t('whyThisPriceTitle')}
                      </h3>
                    </div>
                    <button
                      id="btn-close-why-price"
                      type="button"
                      onClick={() => setShowWhyPriceModal(false)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', fontSize: '1.1rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Plain Language Explanation */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      fontSize: '0.86rem',
                      lineHeight: '1.45',
                      color: '#334155',
                      marginBottom: '1rem'
                    }}
                  >
                    {priceEstimate.plainExplanation}
                  </div>

                  {/* Pricing Breakdown Factors */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>{t('factorMaterial')}</span>
                      <strong>₹{priceEstimate.historicalMidPrice} / kg</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>{t('factorCondition')}</span>
                      <strong>{selectedConditionObj.symbol} {selectedConditionObj.fallbackName} (×{priceEstimate.factors.conditionMultiplier})</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>{t('factorWeight')}</span>
                      <strong>{weight} {weightUnit}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>{t('factorLocation')}</span>
                      <strong>📍 {locationArea || 'Gunupur'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>{t('factorRecordsCount')}</span>
                      <strong>{priceEstimate.historicalRecordsUsed} records</strong>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.72rem', color: '#166534', marginBottom: '1rem' }}>
                    ⚠️ {t('demoDataNotice')} {t('informationalEstimateDisclaimer')}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWhyPriceModal(false)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {t('close') || 'Got it'}
                  </button>
                </div>
              </div>
            )}

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

              {/* Prominent Lot ID, Material ID, and Price ID Display */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: createdLot.priceId ? '1fr 1fr 1fr' : '1fr 1fr',
                  gap: '8px',
                  maxWidth: '380px',
                  margin: '0 auto 1.25rem auto'
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    border: '2px dashed #86efac',
                    borderRadius: '12px',
                    padding: '0.65rem'
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    {t('lotId')}
                  </span>
                  <strong
                    id="created-lot-id-badge"
                    style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}
                  >
                    {createdLot.id}
                  </strong>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '2px dashed #93c5fd',
                    borderRadius: '12px',
                    padding: '0.65rem'
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    {t('materialId')}
                  </span>
                  <strong
                    id="created-material-id-badge"
                    style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0284c7' }}
                  >
                    {createdLot.materialId || 'MAT-0001'}
                  </strong>
                </div>

                {createdLot.priceId && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '2px dashed #fde68a',
                      borderRadius: '12px',
                      padding: '0.65rem'
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                      {t('priceId')}
                    </span>
                    <strong
                      id="created-price-id-badge"
                      style={{ fontSize: '1.1rem', fontWeight: 900, color: '#d97706' }}
                    >
                      {createdLot.priceId}
                    </strong>
                  </div>
                )}
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
                  <span style={{ color: '#64748b' }}>{t('identifyMaterial')}</span>
                  <strong>{selectedMaterialObj.icon} {createdLot.materialType} ({createdLot.materialSubcategory || selectedMaterialObj.fallbackName})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{t('identificationMethod')}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: createdLot.identificationMethod === 'demo_ai' ? '#dcfce7' : '#f1f5f9',
                      color: createdLot.identificationMethod === 'demo_ai' ? '#15803d' : '#475569'
                    }}
                  >
                    {createdLot.identificationMethod === 'demo_ai' ? `🤖 ${t('aiAssisted')} (${Math.round((createdLot.confidenceScore || 0.91) * 100)}%)` : `👤 ${t('manualMethod')}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{t('enterWeight')}</span>
                  <strong style={{ color: '#15803d' }}>{createdLot.weight} {createdLot.weightUnit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{t('selectCondition')}</span>
                  <strong>{selectedConditionObj.symbol} {t(selectedConditionObj.labelKey, selectedConditionObj.fallbackName)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>{t('confirmLocation')}</span>
                  <strong>📍 {typeof createdLot.location === 'object' ? createdLot.location.area : createdLot.location}</strong>
                </div>
                {createdLot.estimatedPrice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                    <span style={{ color: '#64748b' }}>{t('estimatedFairPrice')}</span>
                    <strong style={{ color: '#15803d' }}>
                      ₹{createdLot.estimatedPrice} / kg
                      {createdLot.estimatedLotValueMin && createdLot.estimatedLotValueMax && (
                        <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700, marginLeft: '6px' }}>
                          (₹{createdLot.estimatedLotValueMin} – ₹{createdLot.estimatedLotValueMax})
                        </span>
                      )}
                    </strong>
                  </div>
                )}
              </div>

              {/* Module 6: Step 7 Reuse Opportunity Banner */}
              {reusePotential && (reusePotential.pathway === 'reuse' || reusePotential.pathway === 'both') && (
                <div
                  id="success-reuse-card"
                  style={{
                    background: '#fef3c7',
                    border: '1.5px solid #fde68a',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    marginBottom: '1.25rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Wrench size={15} />
                      <span>{t('potentialReuseDesc')}</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fde68a', color: '#78350f', padding: '2px 6px', borderRadius: '4px' }}>
                      {t('pathwayReuse')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#78350f', margin: '0 0 8px 0' }}>
                    {repairShopMatches.length} local repair shops are looking for components like this. You can connect directly for parts harvesting.
                  </p>
                  <button
                    id="btn-success-find-shops"
                    type="button"
                    onClick={() => setShowRepairShopsModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Wrench size={13} />
                    <span>{t('findRepairShops')} ({repairShopMatches.length})</span>
                  </button>
                </div>
              )}

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
                  {/* Top Bar: Lot ID + Material ID + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
                      {lot.materialId && (
                        <span
                          className="mat-id-tag"
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: '#0284c7',
                            background: '#e0f2fe',
                            padding: '2px 7px',
                            borderRadius: '6px'
                          }}
                        >
                          {lot.materialId}
                        </span>
                      )}
                      {lot.priceId && (
                        <span
                          className="price-id-tag"
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: '#d97706',
                            background: '#fef3c7',
                            padding: '2px 7px',
                            borderRadius: '6px'
                          }}
                        >
                          {lot.priceId}
                        </span>
                      )}
                      {lot.estimatedPrice && (
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#15803d',
                            background: '#dcfce7',
                            padding: '2px 7px',
                            borderRadius: '6px'
                          }}
                        >
                          ₹{lot.estimatedLotValueMin && lot.estimatedLotValueMax ? `${lot.estimatedLotValueMin} – ₹${lot.estimatedLotValueMax}` : `${lot.estimatedPrice}/kg`}
                        </span>
                      )}
                      {lot.identificationMethod === 'demo_ai' && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#15803d',
                            background: '#dcfce7',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          🤖 AI {lot.confidenceScore ? `${Math.round(lot.confidenceScore * 100)}%` : ''}
                        </span>
                      )}
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
