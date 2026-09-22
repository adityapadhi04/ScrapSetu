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
import Modal from '../../components/common/Modal';
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
import { findRecyclerMatches } from '../../services/recyclerMatchingService';
import { createRecyclerInquiry } from '../../services/recyclerInquiryService';
import { getOffersForLot, acceptOffer } from '../../services/offerService';
import {
  createTransaction,
  getTransactionsByCollector,
  getCollectorEarnings,
  getTransactionByOffer
} from '../../services/transactionService';
import {
  createHandover,
  confirmCollectorHandover,
  getHandoversByTransaction
} from '../../services/handoverService';
import {
  createPaymentRecord,
  getPaymentsByTransaction,
  VALID_PAYMENT_METHODS
} from '../../services/paymentService';
import DigitalScrapReceipt from '../../components/transactions/DigitalScrapReceipt';
import SafetyGuidanceCard from '../../components/SafetyGuidanceCard';
import {
  getPickupsByCollector,
  getPickupByTransactionId,
  createPickupRequest,
  schedulePickup,
  cancelPickup
} from '../../services/pickupService';
import CashfreePaymentModal from '../../components/payment/CashfreePaymentModal';

/**
 * 7-Step Mobile-First Scrap Lot Creation Wizard for Collector (Module 3)
 * Lets collectors photograph, categorize, weigh, grade, and create real scrap lots.
 */
export const CollectorSellPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';

  // Wizard Step state: 1 (Photo) -> 2 (AI Identify Material) -> 3 (Weight) -> 4 (Location) -> 5 (Notes & Review) -> 6 (Success)
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
  const [detectedItems, setDetectedItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [itemWeights, setItemWeights] = useState({});
  const [createdLots, setCreatedLots] = useState([]);
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

  // Module 7: Authorized Recycler Marketplace State
  const [showRecyclersModal, setShowRecyclersModal] = useState(false);
  const [selectedRecyclerDetails, setSelectedRecyclerDetails] = useState(null);
  const [inquirySentRecyclers, setInquirySentRecyclers] = useState([]);
  const [lastCreatedInquiry, setLastCreatedInquiry] = useState(null);

  // Compute matching authorized recyclers dynamically (Module 7)
  const recyclerMatches = useMemo(() => {
    if (!reusePotential || (reusePotential.pathway !== 'recycle' && reusePotential.pathway !== 'both')) {
      return [];
    }
    const selectedMatObj = MATERIAL_OPTIONS.find((m) => m.type === materialType);
    const category = selectedMatObj?.category || materialType;
    return findRecyclerMatches({
      materialCategory: category,
      weight: parseFloat(weight) || 0,
      location: locationArea,
      condition
    });
  }, [reusePotential, materialType, weight, locationArea, condition]);

  const handleSendRecyclerInquiry = (recMatch) => {
    const targetRecycler = recMatch.recycler || recMatch;
    try {
      const inq = createRecyclerInquiry({
        collectorId: activeCollectorId,
        collectorName: user?.name || 'Ramesh Kumar',
        lotId: createdLot?.id || null,
        recyclerId: targetRecycler.recyclerId,
        recyclerName: targetRecycler.businessName,
        materialCategory: materialType,
        materialSubcategory,
        condition,
        weight: parseFloat(weight) || 0,
        weightUnit,
        collectorLocation: locationArea,
        estimatedPrice: priceEstimate ? `₹${priceEstimate.minPrice} – ₹${priceEstimate.maxPrice} / kg` : null
      });
      setLastCreatedInquiry(inq);
      setInquirySentRecyclers((prev) => [...prev, targetRecycler.recyclerId]);
      return inq;
    } catch (err) {
      console.error('Failed to send inquiry to recycler:', err);
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
        const items = result.detectedItems || [];
        setDetectedItems(items);
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

  // Remove an item from detected list
  const handleRemoveDetectedItem = (itemId) => {
    setDetectedItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  // Edit/override an item's category while preserving original AI suggestion
  const handleEditDetectedItem = (itemId, newCategory) => {
    const catItem = getCatalogItemByCategory(newCategory);
    setDetectedItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          return {
            ...item,
            category: newCategory,
            subcategory: catItem?.defaultSubcategory || newCategory,
            identificationMethod: 'manual',
            collectorConfirmed: true,
            // Preserve original AI prediction for auditability
            aiSuggestedCategory: item.aiSuggestedCategory || item.category,
            aiSuggestedSubcategory: item.aiSuggestedSubcategory || item.subcategory,
            aiConfidenceScore: item.aiConfidenceScore || item.confidence
          };
        }
        return item;
      })
    );
    setEditingItemId(null);
  };

  // Add missing material manually
  const handleAddMissingMaterial = (newCategory) => {
    const catItem = getCatalogItemByCategory(newCategory);
    const newItem = {
      itemId: `DET-M${Date.now().toString().slice(-4)}`,
      category: newCategory,
      subcategory: catItem?.defaultSubcategory || newCategory,
      confidence: 1.0,
      boundingBox: null,
      identificationMethod: 'manual',
      rationale: 'Manually added by collector from photo inspection.',
      aiSuggestedCategory: null,
      aiSuggestedSubcategory: null,
      aiConfidenceScore: null,
      collectorConfirmed: true
    };
    setDetectedItems((prev) => [...prev, newItem]);
    setShowAddMaterialModal(false);
  };

  // Confirm all detected items and advance to Step 3
  const handleConfirmAllDetections = () => {
    if (!detectedItems || detectedItems.length === 0) {
      setError('Please add or select at least one material.');
      return;
    }
    setError('');
    const primary = detectedItems[0];
    setMaterialType(primary.category);
    setMaterialSubcategory(primary.subcategory);
    setIdentificationMethod(primary.identificationMethod || 'demo_ai');
    setConfidenceScore(primary.confidence || 0.85);
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

  // Step 3 Validation -> Proceed to Step 4 (Location)
  const handleProceedFromWeight = () => {
    const num = parseFloat(weight);
    if (isNaN(num) || num <= 0) {
      setError(t('weightRequiredWarning'));
      return;
    }
    setError('');
    setStep(4);
  };

  // Step 4 Validation -> Proceed to Step 5 (Review)
  const handleProceedFromLocation = () => {
    if (!locationArea.trim()) {
      setError(t('locationRequiredWarning'));
      return;
    }
    setError('');
    setStep(5);
  };

  // Final Submission: Create Scrap Lot + Linked SIH Material Dataset Record
  const handleCreateLot = () => {
    setError('');
    setIsSubmitting(true);

    try {
      if (detectedItems && detectedItems.length > 1) {
        // Multi-Item E-Waste Unified Lot Creation (Module 3 & Module 4)
        const totalNumWeight = parseFloat(weight) || 5;
        const weightPerItem = Math.max(0.1, parseFloat((totalNumWeight / detectedItems.length).toFixed(1)));

        const itemsList = detectedItems.map((item) => {
          const selectedMatObj = MATERIAL_OPTIONS.find((m) => m.type === item.category);
          const itemCategory = selectedMatObj?.category || item.category;
          const itemWeight = itemWeights[item.itemId] ? parseFloat(itemWeights[item.itemId]) : weightPerItem;
          return {
            id: item.itemId,
            name: item.category,
            category: itemCategory,
            subcategory: item.subcategory || selectedMatObj?.defaultSubcategory || item.category,
            condition,
            weight: itemWeight
          };
        });

        const newLot = createScrapLot({
          collectorId: activeCollectorId,
          materialType: 'Mixed E-Waste',
          materialCategory: 'Mixed E-Waste',
          materialSubcategory: detectedItems.map((d) => d.category).join(', '),
          items: itemsList,
          photo,
          weight: totalNumWeight,
          weightUnit,
          condition,
          location: locationArea,
          notes: notes ? `${notes}` : `Mixed E-Waste lot with ${detectedItems.length} items: ${detectedItems.map((d) => d.category).join(', ')}`,
          sourceType: 'platform_user',
          identificationMethod: 'demo_ai',
          confidenceScore: 0.92,
          collectorConfirmed: true,
          estimatedPrice: priceEstimate?.midPrice || 450,
          estimatedLotValueMin: priceEstimate?.estimatedLotValueMin || Math.round(totalNumWeight * 350),
          estimatedLotValueMax: priceEstimate?.estimatedLotValueMax || Math.round(totalNumWeight * 550)
        });

        setCreatedLots([newLot]);
        setCreatedLot(newLot);
        setStep(6);
      } else {
        const selectedMatObj = MATERIAL_OPTIONS.find((m) => m.type === materialType);
        const category = selectedMatObj?.category || 'Electronic Components';
        const numWeight = parseFloat(weight) || 1;

        const singleItem = [{
          name: materialType,
          category,
          subcategory: materialSubcategory || selectedMatObj?.defaultSubcategory || materialType,
          condition,
          weight: numWeight
        }];

        const newLot = createScrapLot({
          collectorId: activeCollectorId,
          materialType,
          materialCategory: category,
          materialSubcategory,
          items: singleItem,
          photo,
          weight: numWeight,
          weightUnit,
          condition,
          location: locationArea,
          notes,
          sourceType: 'platform_user',
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

        setCreatedLots([newLot]);
        setCreatedLot(newLot);
        setStep(6);
      }
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
    setDetectedItems([]);
    setCreatedLots([]);
    setItemWeights({});
    setEditingItemId(null);
    setShowAddMaterialModal(false);
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
                if (step > 1 && step < 6) {
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
              {step === 6 ? t('lotCreatedSuccess') : t('sellScrap')}
            </h1>
          </div>

          {step < 6 && (
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: '99px' }}>
              {t('stepProgress', { step, total: 5 }).replace('{step}', step).replace('{total}', 5)}
            </span>
          )}
        </div>

        {/* Compact Progress Bar */}
        {step < 6 && (
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '99px', marginBottom: '1.25rem', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(step / 5) * 100}%`,
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

                {/* Multi-Item Detected E-Waste Items (when confident and not in manual catalog mode) */}
                {aiResult.isConfident && !showManualSelection && (
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={16} color="#15803d" />
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {t('detectedItemsTitle') || 'Detected E-Waste Items'} ({detectedItems.length})
                          </h3>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
                          {t('detectedItemsSubtitle') || 'Multiple e-waste items identified in photo — review, edit, or add missing materials'}
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        Prototype CV
                      </span>
                    </div>

                    {/* Detected Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                      {detectedItems.map((item, idx) => {
                        const matObj = MATERIAL_OPTIONS.find((m) => m.type === item.category) || { icon: '📦', fallbackName: item.category };
                        const isEditing = editingItemId === item.itemId;

                        return (
                          <Card
                            key={item.itemId || idx}
                            style={{
                              padding: '0.9rem',
                              border: isEditing ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                              borderRadius: '12px',
                              background: item.collectorConfirmed ? '#f8fafc' : '#ffffff'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '2rem' }}>{matObj.icon}</span>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>#{idx + 1}</span>
                                    <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>{item.category}</span>
                                    {item.collectorConfirmed && (
                                      <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                        Edited
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
                                    {item.subcategory || item.category}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '0.72rem', color: '#64748b' }}>
                                    <span>Confidence: <strong style={{ color: '#166534' }}>{Math.round((item.confidence || 0.8) * 100)}%</strong></span>
                                    <span>•</span>
                                    <span>Method: {item.identificationMethod === 'manual' ? 'Manual' : 'Prototype CV'}</span>
                                    {item.boundingBox && (
                                      <>
                                        <span>•</span>
                                        <span>Region: [{item.boundingBox.x}%, {item.boundingBox.y}%]</span>
                                      </>
                                    )}
                                  </div>
                                  {item.rationale && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', marginTop: '3px', maxWidth: '360px' }}>
                                      "{item.rationale}"
                                    </div>
                                  )}
                                  {item.aiSuggestedCategory && item.aiSuggestedCategory !== item.category && (
                                    <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '3px' }}>
                                      Original AI suggestion: {item.aiSuggestedCategory} ({Math.round((item.aiConfidenceScore || 0) * 100)}%)
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(isEditing ? null : item.itemId)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: isEditing ? '#f1f5f9' : '#ffffff',
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isEditing ? 'Cancel' : 'Edit'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDetectedItem(item.itemId)}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1px solid #fecaca',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {isEditing && (
                              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                                  Change Material Category:
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
                                  {MATERIAL_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.type}
                                      type="button"
                                      onClick={() => handleEditDetectedItem(item.itemId, opt.type)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '5px 8px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        border: item.category === opt.type ? '2px solid #15803d' : '1px solid #cbd5e1',
                                        background: item.category === opt.type ? '#f0fdf4' : '#ffffff',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <span>{opt.icon}</span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.fallbackName}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>

                    {/* Add Missing Material Modal / Inline Box */}
                    {showAddMaterialModal ? (
                      <Card style={{ padding: '1rem', marginBottom: '1rem', border: '2px solid #15803d', background: '#f0fdf4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#166534' }}>Select Material to Add:</strong>
                          <button
                            type="button"
                            onClick={() => setShowAddMaterialModal(false)}
                            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px' }}>
                          {MATERIAL_OPTIONS.map((opt) => (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => handleAddMissingMaterial(opt.type)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              <span>{opt.icon}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.fallbackName}</span>
                            </button>
                          ))}
                        </div>
                      </Card>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
                        <button
                          id="btn-add-missing-material"
                          type="button"
                          onClick={() => setShowAddMaterialModal(true)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            borderRadius: '10px',
                            border: '1.5px dashed #15803d',
                            background: '#f0fdf4',
                            color: '#15803d',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <PlusCircle size={16} />
                          <span>{t('addMissingMaterial') || '+ Add Missing Material'}</span>
                        </button>
                      </div>
                    )}

                    {/* Action Buttons: Confirm Detections vs Browse Full Catalog */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        id="btn-confirm-all-detections"
                        type="button"
                        onClick={handleConfirmAllDetections}
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
                        <span>✓ {t('confirmAllItems') || 'Confirm Detected Items →'}</span>
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
                  </div>
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
                <span>Next: Location →</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: CONFIRM LOCATION
            ========================================================================= */}
        {step === 4 && (
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
            STEP 5: ADDITIONAL NOTES & REVIEW
            ========================================================================= */}
        {step === 5 && (
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
                  onClick={() => setStep(4)}
                  style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Edit3 size={14} />
                  <span>{t('edit')}</span>
                </button>
              </div>
            </Card>

            {/* Module 11: Safety Handling & Transport Guidance in Review */}
            <div style={{ marginBottom: '1.25rem' }}>
              <SafetyGuidanceCard
                materialCategory={materialType}
                condition={condition}
                compact={false}
                showTransport={true}
                showHandling={true}
                showDoNotActions={true}
              />
            </div>

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
                {reusePotential.pathway === 'both' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                      Choose Pathway (Explore either or both):
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        id="btn-find-repair-shops"
                        type="button"
                        onClick={() => setShowRepairShopsModal(true)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#fffbeb',
                          border: '1.5px solid #fde68a',
                          padding: '0.65rem 0.5rem',
                          borderRadius: '8px',
                          color: '#92400e',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Wrench size={16} />
                        <span>🔧 {t('findRepairShops')} ({repairShopMatches.length})</span>
                      </button>

                      <button
                        id="btn-find-authorized-recyclers"
                        type="button"
                        onClick={() => setShowRecyclersModal(true)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#f0f9ff',
                          border: '1.5px solid #bae6fd',
                          padding: '0.65rem 0.5rem',
                          borderRadius: '8px',
                          color: '#0369a1',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Recycle size={16} />
                        <span>♻️ {t('findAuthorizedRecyclers')} ({recyclerMatches.length})</span>
                      </button>
                    </div>
                  </div>
                ) : reusePotential.pathway === 'reuse' ? (
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
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1' }}>
                        ♻️ {recyclerMatches.length} {t('authorizedRecyclers')}
                      </span>
                      <button
                        id="btn-find-authorized-recyclers"
                        type="button"
                        onClick={() => setShowRecyclersModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 0.95rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                        }}
                      >
                        <Recycle size={14} />
                        <span>{t('findAuthorizedRecyclers')} ({recyclerMatches.length})</span>
                      </button>
                    </div>

                    {/* Quick Preview of Top Recycler Match */}
                    {recyclerMatches.length > 0 && (
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #bae6fd',
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <strong style={{ color: '#0f172a' }}>{recyclerMatches[0].recycler.businessName}</strong>
                          <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.72rem' }}>
                            📍 {recyclerMatches[0].recycler.address.city} • Min {recyclerMatches[0].recycler.minimumWeightKg} kg
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>
                          ✓ {recyclerMatches[0].reasons[0]}
                        </span>
                      </div>
                    )}
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

            {/* Modal: Authorized Recyclers Discovery (Module 7) */}
            {showRecyclersModal && (
              <div
                id="recyclers-modal"
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
                onClick={() => setShowRecyclersModal(false)}
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
                      <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                        <Recycle size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {t('authorizedRecyclers')}
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {recyclerMatches.length} facilities accept {materialType}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRecyclersModal(false)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#166534' }}>
                    ℹ️ {t('prototypeRecyclerNotice')}
                  </div>

                  {lastCreatedInquiry && (
                    <div
                      id="inquiry-success-banner"
                      style={{
                        background: '#ecfdf5',
                        border: '1.5px solid #6ee7b7',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 800, fontSize: '0.88rem' }}>
                          <CheckCircle2 size={18} color="#059669" />
                          <span>{t('inquirySent')}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                          Inquiry ID: <strong style={{ fontFamily: 'monospace' }}>{lastCreatedInquiry.inquiryId}</strong> generated & sent to <strong>{lastCreatedInquiry.recyclerName}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLastCreatedInquiry(null)}
                        style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {recyclerMatches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                      <Recycle size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>{t('recyclerNotFound')}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.25rem' }}>
                      {recyclerMatches.map((match) => {
                        const rec = match.recycler;
                        const isSent = inquirySentRecyclers.includes(rec.recyclerId);
                        return (
                          <div
                            key={rec.recyclerId}
                            style={{
                              border: '1.5px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '1rem',
                              background: '#ffffff'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                                  {rec.businessName}
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  📍 {rec.address.city}, {rec.address.state} • {rec.pickupAvailable ? '🚚 ' + t('pickupAvailableText') : '🏢 ' + t('dropOffOnly')}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px' }}>
                                {t('demoVerified')}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 700 }}>{t('minimumLotWeight')}:</span> {rec.minimumWeightKg} kg • <span style={{ fontWeight: 700 }}>Services:</span> {rec.services.join(', ')}
                            </div>

                            {/* Why this recycler reasons */}
                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '8px', fontSize: '0.72rem', color: '#334155' }}>
                              <span style={{ fontWeight: 800, color: '#0284c7', display: 'block', marginBottom: '3px' }}>
                                ✓ {t('whyThisRecycler')}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {match.reasons.map((r, idx) => (
                                  <span key={idx}>• {r}</span>
                                ))}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedRecyclerDetails(rec)}
                                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: '4px 0' }}
                              >
                                {t('viewDetails')} →
                              </button>

                              <button
                                type="button"
                                disabled={isSent}
                                onClick={() => handleSendRecyclerInquiry(match)}
                                style={{
                                  background: isSent ? '#dcfce7' : '#0284c7',
                                  color: isSent ? '#15803d' : '#ffffff',
                                  border: isSent ? '1px solid #86efac' : 'none',
                                  padding: '0.45rem 0.85rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  cursor: isSent ? 'default' : 'pointer'
                                }}
                              >
                                {isSent ? t('inquirySent') : t('sendInterest')}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowRecyclersModal(false)}
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

            {/* Modal: Recycler Details */}
            {selectedRecyclerDetails && (
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
                onClick={() => setSelectedRecyclerDetails(null)}
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
                        {selectedRecyclerDetails.businessName}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ID: {selectedRecyclerDetails.recyclerId} • {selectedRecyclerDetails.authorizationType}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRecyclerDetails(null)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  {lastCreatedInquiry && lastCreatedInquiry.recyclerId === selectedRecyclerDetails.recyclerId && (
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1.5px solid #6ee7b7',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        color: '#065f46'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                        <CheckCircle2 size={16} color="#059669" />
                        <span>Inquiry Generated: <code style={{ fontFamily: 'monospace', color: '#047857' }}>{lastCreatedInquiry.inquiryId}</code></span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#047857', display: 'block', marginTop: '2px' }}>
                        Interest sent successfully. Recycler will review specifications.
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Facility Address</span>
                      <strong>📍 {selectedRecyclerDetails.address.area}, {selectedRecyclerDetails.address.city}, {selectedRecyclerDetails.address.state} - {selectedRecyclerDetails.address.pincode}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Contact Person</span>
                      <strong>{selectedRecyclerDetails.contactName} • {selectedRecyclerDetails.phone}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Accepted Materials</span>
                      <strong>{selectedRecyclerDetails.acceptedMaterials?.join(', ')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>{t('operatingAreasText')}</span>
                      <span>{selectedRecyclerDetails.operatingAreas?.join(', ')}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>{t('minimumLotWeight')}</span>
                      <strong>{selectedRecyclerDetails.minimumWeightKg} kg</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>{t('paymentMethodsText')}</span>
                      <span>{selectedRecyclerDetails.paymentMethods?.join(', ')}</span>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', color: '#475569' }}>
                      <span style={{ fontWeight: 700, display: 'block' }}>Authorization Reference:</span>
                      <code>{selectedRecyclerDetails.authorizationNumber}</code> ({selectedRecyclerDetails.verificationStatus})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedRecyclerDetails(null)}
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
                      disabled={inquirySentRecyclers.includes(selectedRecyclerDetails.recyclerId)}
                      onClick={() => {
                        handleSendRecyclerInquiry(selectedRecyclerDetails);
                        setSelectedRecyclerDetails(null);
                      }}
                      style={{
                        flex: 2,
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: inquirySentRecyclers.includes(selectedRecyclerDetails.recyclerId) ? '#dcfce7' : '#0284c7',
                        color: inquirySentRecyclers.includes(selectedRecyclerDetails.recyclerId) ? '#15803d' : '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {inquirySentRecyclers.includes(selectedRecyclerDetails.recyclerId) ? t('inquirySent') : t('sendInterest')}
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
                onClick={() => setStep(4)}
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
            STEP 6: SUCCESS CONFIRMATION SCREEN
            ========================================================================= */}
        {step === 6 && createdLot && (
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

              {/* Whole Lot Items Breakdown */}
              {createdLot.items && createdLot.items.length > 0 && (
                <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#166534' }}>
                      📦 Constituent Items in this Lot ({createdLot.items.length}):
                    </strong>
                    <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      Complete Single Lot
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {createdLot.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #bbf7d0',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                            • {item.name || item.category}
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>
                            {item.subcategory ? `${item.subcategory} • ` : ''}Condition: {item.condition}
                          </span>
                        </div>
                        {item.weight > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '0.82rem', color: '#15803d' }}>
                              {item.weight} kg
                            </strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Module 7: Step 7 Recycler Opportunity Banner */}
              {reusePotential && (reusePotential.pathway === 'recycle' || reusePotential.pathway === 'both') && (
                <div
                  id="success-recycler-card"
                  style={{
                    background: '#f0f9ff',
                    border: '1.5px solid #bae6fd',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    marginBottom: '1.25rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Recycle size={15} />
                      <span>{t('recyclingRecommendedDesc')}</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#bae6fd', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                      {t('pathwayRecycle')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#0369a1', margin: '0 0 8px 0' }}>
                    {recyclerMatches.length} authorized recyclers accept {materialType}. You can dispatch or schedule a pickup directly.
                  </p>
                  <button
                    id="btn-success-find-recyclers"
                    type="button"
                    onClick={() => setShowRecyclersModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Recycle size={13} />
                    <span>{t('findAuthorizedRecyclers')} ({recyclerMatches.length})</span>
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
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';
  const [transactions, setTransactions] = useState([]);
  const [receiptData, setReceiptData] = useState(null);

  // Handover modal state
  const [handoverModalTx, setHandoverModalTx] = useState(null);
  const [handoverMethod, setHandoverMethod] = useState('collector_delivers');
  const [handoverLocation, setHandoverLocation] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');

  // Payment modal state
  const [paymentModalTx, setPaymentModalTx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRefNote, setPaymentRefNote] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Module 14 Pickup modal state
  const [pickupModalTx, setPickupModalTx] = useState(null);
  const [pickupMethod, setPickupMethod] = useState('buyer_pickup');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [pickupError, setPickupError] = useState('');

  const refreshList = () => {
    const data = getTransactionsByCollector(activeCollectorId);
    setTransactions(data);
  };

  useEffect(() => {
    refreshList();
  }, [activeCollectorId]);

  const handleViewReceipt = (tx) => {
    const handovers = getHandoversByTransaction(tx.transactionId);
    const payments = getPaymentsByTransaction(tx.transactionId);
    setReceiptData({
      transaction: tx,
      handover: handovers[0] || null,
      payment: payments[0] || null
    });
  };

  const handleOpenHandover = (tx) => {
    setHandoverModalTx(tx);
    setHandoverMethod('collector_delivers');
    setHandoverLocation('');
    setHandoverNotes('');
  };

  const handleConfirmHandoverSubmit = () => {
    if (!handoverModalTx) return;
    try {
      const existing = getHandoversByTransaction(handoverModalTx.transactionId);
      let targetHandover = existing[0];
      if (!targetHandover) {
        targetHandover = createHandover({
          transactionId: handoverModalTx.transactionId,
          lotId: handoverModalTx.lotId,
          collectorId: activeCollectorId,
          buyerId: handoverModalTx.buyerId,
          buyerRole: handoverModalTx.buyerRole,
          materialCategory: handoverModalTx.materialCategory,
          weight: handoverModalTx.weight,
          weightUnit: handoverModalTx.weightUnit,
          handoverMethod,
          handoverLocation: { area: handoverLocation.trim() || 'Collector Location', city: '', state: '' },
          notes: handoverNotes.trim()
        });
      }
      confirmCollectorHandover(targetHandover.handoverId, activeCollectorId);
      refreshList();
      setHandoverModalTx(null);
    } catch (err) {
      console.error('Failed to confirm handover:', err);
    }
  };

  const handleOpenPayment = (tx) => {
    setPaymentModalTx(tx);
    setPaymentMethod('Cash');
    setPaymentRefNote('');
    setPaymentError('');
  };

  const handleOpenPickup = (tx) => {
    setPickupModalTx(tx);
    const existing = getPickupByTransactionId(tx.transactionId);
    if (existing) {
      setPickupMethod(existing.method || 'buyer_pickup');
      setPickupDate(existing.scheduledDate || '');
      setPickupTime(existing.scheduledTime || '');
      setPickupLocation(existing.location || '');
      setPickupNotes(existing.notes || '');
    } else {
      setPickupMethod('buyer_pickup');
      setPickupDate('');
      setPickupTime('');
      setPickupLocation('');
      setPickupNotes('');
    }
    setPickupError('');
  };

  const handleSavePickupSubmit = () => {
    if (!pickupModalTx) return;
    try {
      const existing = getPickupByTransactionId(pickupModalTx.transactionId);
      if (existing) {
        schedulePickup(existing.pickupId, {
          method: pickupMethod,
          scheduledDate: pickupDate,
          scheduledTime: pickupTime,
          location: pickupLocation,
          notes: pickupNotes,
        }, user);
      } else {
        createPickupRequest({
          transactionId: pickupModalTx.transactionId,
          lotId: pickupModalTx.lotId,
          collectorId: activeCollectorId,
          buyerId: pickupModalTx.buyerId,
          buyerRole: pickupModalTx.buyerRole,
          method: pickupMethod,
          scheduledDate: pickupDate,
          scheduledTime: pickupTime,
          location: pickupLocation,
          notes: pickupNotes,
        }, user);
      }
      refreshList();
      setPickupModalTx(null);
    } catch (err) {
      setPickupError(err.message || 'Failed to save pickup coordination');
    }
  };

  const handleSavePaymentSubmit = () => {
    if (!paymentModalTx) return;
    try {
      createPaymentRecord({
        transactionId: paymentModalTx.transactionId,
        collectorId: activeCollectorId,
        buyerId: paymentModalTx.buyerId,
        buyerRole: paymentModalTx.buyerRole,
        amount: paymentModalTx.totalAmount,
        currency: 'INR',
        paymentMethod,
        referenceNote: paymentRefNote.trim(),
        recordedBy: activeCollectorId
      });
      refreshList();
      setPaymentModalTx(null);
    } catch (err) {
      setPaymentError(err.message || 'Payment recording failed');
    }
  };

  const statusBadge = (status) => {
    const map = {
      completed: { variant: 'success', label: '✓ Completed' },
      handover_pending: { variant: 'warning', label: '⏳ Handover Pending' },
      payment_pending: { variant: 'warning', label: '⏳ Payment Pending' },
      payment_recorded: { variant: 'info', label: '💰 Payment Recorded' },
      created: { variant: 'neutral', label: 'Created' },
      cancelled: { variant: 'error', label: 'Cancelled' },
    };
    return map[status] || { variant: 'neutral', label: status };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '4rem' }}>
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
          <Badge variant="neutral">{transactions.length} {transactions.length === 1 ? 'Record' : 'Records'}</Badge>
        </div>

        {transactions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>{t('noTransactionsYet')}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Accept an offer on a scrap lot to create your first transaction.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {transactions.map((tx) => {
              const badge = statusBadge(tx.transactionStatus);
              const isCompleted = tx.transactionStatus === 'completed';
              const canHandover = tx.handoverStatus !== 'confirmed' && tx.handoverStatus !== 'collector_confirmed';
              const canRecordPayment = tx.paymentStatus !== 'recorded';

              return (
                <Card
                  key={tx.transactionId}
                  className="collector-transaction-card"
                  style={{
                    padding: '1.15rem',
                    borderLeft: `5px solid ${isCompleted ? '#16a34a' : '#d97706'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      {tx.handoverStatus === 'confirmed' && (
                        <Badge variant="success">Handover ✓</Badge>
                      )}
                      {tx.paymentStatus === 'recorded' && (
                        <Badge variant="success">Paid ({tx.paymentMethod}) ✓</Badge>
                      )}
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isCompleted ? '#15803d' : '#b45309' }}>
                      ₹{(tx.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>{tx.materialCategory}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.65rem' }}>
                    {tx.weight} {tx.weightUnit} • ₹{tx.agreedPrice}/kg • {tx.buyerName} ({tx.buyerRole})
                  </p>

                  {/* Module 14: Pickup Status Indicator */}
                  {(() => {
                    const pkp = getPickupByTransactionId(tx.transactionId);
                    return (
                      <div style={{ width: '100%', margin: '0.45rem 0', padding: '0.55rem 0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 700, color: '#475569' }}>
                            🚚 {pkp ? (pkp.method === 'buyer_pickup' ? (t('buyerPickup') || 'Buyer Pickup') : (t('collectorDropoff') || 'Collector Drop-off')) : (t('pickupCoordination') || 'Collection Coordination')}:
                          </span>
                          <Badge variant={pkp?.status === 'completed' ? 'success' : (pkp?.status === 'scheduled' ? 'info' : (pkp?.status === 'cancelled' ? 'error' : 'warning'))}>
                            {pkp ? pkp.status.toUpperCase() : (t('pickupRequested') || 'REQUESTED')}
                          </Badge>
                        </div>
                        {pkp && (pkp.scheduledDate || pkp.location) && (
                          <div style={{ color: '#64748b', fontSize: '0.74rem' }}>
                            {pkp.scheduledDate && <span>📅 {pkp.scheduledDate} {pkp.scheduledTime} · </span>}
                            {pkp.location && <span>📍 {pkp.location}</span>}
                          </div>
                        )}
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPickup(tx)}
                            style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.76rem' }}
                          >
                            {pkp ? `✏️ ${t('schedulePickup') || 'Update Schedule'}` : `+ ${t('schedulePickup') || 'Schedule Pickup / Drop-off'}`}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem', fontSize: '0.74rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[tx.transactionId, tx.offerId, tx.lotId].map((id) => (
                        <span key={id} style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#0f172a' }}>{id}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canHandover && (
                        <Button
                          variant="primary"
                          size="sm"
                          id={`btn-handover-${tx.transactionId}`}
                          onClick={() => handleOpenHandover(tx)}
                        >
                          {t('confirmHandover')}
                        </Button>
                      )}
                      {canRecordPayment && (
                        <Button
                          variant="outline"
                          size="sm"
                          id={`btn-record-payment-${tx.transactionId}`}
                          onClick={() => handleOpenPayment(tx)}
                        >
                          {t('recordPayment')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        id={`btn-view-receipt-${tx.transactionId}`}
                        onClick={() => handleViewReceipt(tx)}
                      >
                        {t('viewReceipt')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>

      {/* Module 14: Pickup Scheduling Modal */}
      {pickupModalTx && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                🚚 {t('schedulePickup') || 'Schedule Pickup / Drop-off'}
              </h3>
              <button onClick={() => setPickupModalTx(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {t('pickupMethod') || 'Coordination Method'}
                </label>
                <select
                  value={pickupMethod}
                  onChange={(e) => setPickupMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="buyer_pickup">{t('buyerPickup') || 'Buyer Pickup (Vehicle collects from you)'}</option>
                  <option value="collector_dropoff">{t('collectorDropoff') || 'Collector Drop-off (Deliver to facility)'}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {t('scheduledDate') || 'Scheduled Date'}
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {t('scheduledTime') || 'Scheduled Time'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {t('pickupLocation') || 'Meeting / Facility Location'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Gunupur Bus Stand, Rayagada"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {t('pickupNotes') || 'Coordination Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Packed in 2 burlap bags, ready for pickup"
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              {pickupError && (
                <div style={{ color: '#dc2626', fontSize: '0.78rem' }}>{pickupError}</div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <Button variant="outline" fullWidth onClick={() => setPickupModalTx(null)}>
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={handleSavePickupSubmit}>
                  {t('confirmPickupSchedule') || 'Save Schedule'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {handoverModalTx && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setHandoverModalTx(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              📦 {t('confirmHandover')}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              Transaction <strong>{handoverModalTx.transactionId}</strong> • {handoverModalTx.materialCategory} ({handoverModalTx.weight} {handoverModalTx.weightUnit})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Handover Method
                </label>
                <select
                  value={handoverMethod}
                  onChange={(e) => setHandoverMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="collector_delivers">Collector Delivers to Buyer</option>
                  <option value="buyer_pickup">Buyer Pickup</option>
                  <option value="drop_off">Drop-off at Designated Facility</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Handover Location (Descriptive)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gunupur Collector Point / MIDC Facility"
                  value={handoverLocation}
                  onChange={(e) => setHandoverLocation(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional delivery details..."
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setHandoverModalTx(null)}>Cancel</Button>
              <Button variant="primary" id="btn-submit-handover" onClick={handleConfirmHandoverSubmit}>
                Confirm Handover
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalTx && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setPaymentModalTx(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              💰 {t('recordPayment')}
            </h3>
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', color: '#92400e', marginBottom: '1rem', fontWeight: 600 }}>
              ⚠️ Demo payment record — not real payment processing.
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              Transaction <strong>{paymentModalTx.transactionId}</strong> • Total: <strong style={{ color: '#15803d' }}>₹{(paymentModalTx.totalAmount || 0).toLocaleString('en-IN')}</strong>
            </p>

            {paymentError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                {paymentError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  {VALID_PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Reference Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash at handoff / Demo UPI ref"
                  value={paymentRefNote}
                  onChange={(e) => setPaymentRefNote(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setPaymentModalTx(null)}>Cancel</Button>
              <Button variant="primary" id="btn-submit-payment" onClick={handleSavePaymentSubmit}>
                Save Payment Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setReceiptData(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <DigitalScrapReceipt
              transaction={receiptData.transaction}
              handover={receiptData.handover}
              payment={receiptData.payment}
            />
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <Button variant="outline" onClick={() => setReceiptData(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};

/**
 * Collector Earnings Screen — Live from transactionService (Module 9)
 */
export const CollectorEarningsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const activeCollectorId = user?.userId || 'usr-collector-01';
  const earnings = getCollectorEarnings(activeCollectorId);

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

        {/* Hero Card */}
        <div className="card-hero-earnings" style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('recordedEarnings')}
          </span>
          <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0' }}>
            ₹{earnings.totalRecorded.toLocaleString('en-IN')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Completed ✓</span>
              <strong style={{ fontSize: '1.1rem', color: '#86efac' }}>
                ₹{earnings.totalRecorded.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Pending ⏳</span>
              <strong style={{ fontSize: '1.1rem', color: '#fde68a' }}>
                ₹{earnings.totalPending.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: t('completedTransactions'), value: earnings.completedCount, color: '#15803d' },
            { label: 'Active Transactions', value: earnings.activeTransactions, color: '#1d4ed8' },
          ].map(({ label, value, color }) => (
            <Card key={label} style={{ padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <Card style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
            {t('transactionHistory')}
          </h3>
          {earnings.recentTransactions.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('noTransactionsYet')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {earnings.recentTransactions.map((tx) => {
                const isPaid = tx.paymentStatus === 'recorded';
                return (
                  <div
                    key={tx.transactionId}
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
                      <strong style={{ fontSize: '0.92rem', display: 'block' }}>
                        {tx.materialCategory}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {tx.transactionId} • {tx.weight} {tx.weightUnit}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isPaid ? '#15803d' : '#b45309', display: 'block' }}>
                        ₹{(tx.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: isPaid ? '#16a34a' : '#92400e', fontWeight: 600 }}>
                        {isPaid ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Disclaimer */}
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
          {t('demoPaymentDisclaimer')}
        </div>
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
  const [selectedLotForOffers, setSelectedLotForOffers] = useState(null);
  const [selectedOfferForConfirm, setSelectedOfferForConfirm] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cashfree payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOffer, setPaymentOffer] = useState(null);   // offer being paid for
  const [paymentTxnId, setPaymentTxnId] = useState(null);   // TXN-xxxx for the payment
  const [verifiedTxnIds, setVerifiedTxnIds] = useState(new Set()); // track which txns are VERIFIED

  useEffect(() => {
    const data = getScrapLotsByCollector(activeCollectorId);
    setLots(data);
  }, [activeCollectorId, refreshTrigger]);

  const handleConfirmAccept = () => {
    if (!selectedOfferForConfirm) return;
    try {
      const updatedOffer = acceptOffer(selectedOfferForConfirm.offerId, selectedOfferForConfirm.lotId);
      // Auto-create a transaction for this accepted offer
      let txnId = null;
      try {
        const newTxn = createTransaction({
          offerId: selectedOfferForConfirm.offerId,
          lotId: selectedOfferForConfirm.lotId,
          collectorId: activeCollectorId,
          collectorName: user?.name || 'Collector',
          buyerId: selectedOfferForConfirm.buyerId,
          buyerRole: selectedOfferForConfirm.buyerRole,
          buyerName: selectedOfferForConfirm.buyerName,
          materialCategory: selectedOfferForConfirm.materialCategory,
          materialSubcategory: selectedOfferForConfirm.materialSubcategory || '',
          weight: selectedOfferForConfirm.weight,
          weightUnit: selectedOfferForConfirm.weightUnit || 'kg',
          agreedPrice: selectedOfferForConfirm.offeredPrice,
          totalAmount: selectedOfferForConfirm.totalOfferValue,
        });
        txnId = newTxn?.transactionId || null;
      } catch (txErr) {
        // Transaction may already exist — try to fetch existing
        console.warn('Transaction already exists or could not be created:', txErr.message);
        try {
          const existingTxn = getTransactionByOffer(selectedOfferForConfirm.offerId);
          txnId = existingTxn?.transactionId || null;
        } catch (_) {}
      }

      // Close the confirmation modal and open the Cashfree payment modal
      setSelectedOfferForConfirm(null);
      setSelectedLotForOffers(null);

      if (txnId) {
        setPaymentOffer({ ...selectedOfferForConfirm });
        setPaymentTxnId(txnId);
        setPaymentModalOpen(true);
      } else {
        // Fallback: no transaction ID — refresh lots without payment modal
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to accept offer:', err);
    }
  };

  const handlePaymentVerified = ({ transactionId }) => {
    // Mark this transaction as verified locally so handover can be enabled
    setVerifiedTxnIds((prev) => new Set([...prev, transactionId]));
    setPaymentModalOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

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

                  {/* Offers Overview Bar (Module 8) */}
                  {(() => {
                    const lotOffers = getOffersForLot(lot.id);
                    const isSelected = lot.offerStatus === 'offer_selected';
                    return (
                      <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                            {t('offers')}:
                          </span>
                          {isSelected ? (
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '99px' }}>
                              ✓ {t('offerSelectedStatus')}
                            </span>
                          ) : lotOffers.length > 0 ? (
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '99px' }}>
                              {lotOffers.length} {lotOffers.length === 1 ? 'Offer' : 'Offers'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                              {t('noOffersYet')}
                            </span>
                          )}
                        </div>

                        {lotOffers.length > 0 && (
                          <Button
                            id={`btn-compare-offers-${lot.id}`}
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedLotForOffers(lot)}
                          >
                            💰 {t('compareOffers')} ({lotOffers.length})
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Compare Offers */}
        <Modal
          isOpen={!!selectedLotForOffers}
          onClose={() => setSelectedLotForOffers(null)}
          title={`${t('offersForLot')}: ${selectedLotForOffers?.id || ''}`}
          maxWidth="640px"
        >
          {selectedLotForOffers && (() => {
            const currentLotOffers = getOffersForLot(selectedLotForOffers.id);
            return (
              <div>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                        {selectedLotForOffers.materialType || selectedLotForOffers.materialCategory}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '6px' }}>
                        • {selectedLotForOffers.weight} {selectedLotForOffers.weightUnit} • {selectedLotForOffers.condition}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700 }}>
                      {t('platformEstimate')}: {selectedLotForOffers.estimatedPrice ? `₹${selectedLotForOffers.estimatedPrice}/kg` : 'Pending'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {currentLotOffers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      {t('noOffersYet')}
                    </div>
                  ) : (
                    currentLotOffers.map((o) => {
                      const isAccepted = o.status === 'accepted';
                      const isRejected = o.status === 'rejected';
                      return (
                        <div
                          key={o.offerId}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '10px',
                            border: `1.5px solid ${isAccepted ? '#86efac' : isRejected ? '#fecaca' : '#e2e8f0'}`,
                            background: isAccepted ? '#f0fdf4' : isRejected ? '#fef2f2' : '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
                                  {o.buyerName}
                                </strong>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: o.buyerRole === 'repair' ? '#fef3c7' : '#e0f2fe',
                                    color: o.buyerRole === 'repair' ? '#92400e' : '#0369a1'
                                  }}
                                >
                                  {o.buyerRole === 'repair' ? 'Repair Shop (Reuse)' : 'Authorized Recycler'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                                Offered: <strong style={{ color: '#0f172a' }}>₹{o.offeredPrice}/kg</strong> • Total: <strong style={{ color: '#15803d' }}>₹{o.totalOfferValue?.toLocaleString('en-IN')}</strong>
                              </div>
                              {o.message && (
                                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '3px 0 0 0', fontStyle: 'italic' }}>
                                  "{o.message}"
                                </p>
                              )}
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              {isAccepted ? (
                                <Badge variant="success">Selected ✓</Badge>
                              ) : isRejected ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }}>Rejected</span>
                              ) : (
                                <Button
                                  id={`btn-select-offer-${o.offerId}`}
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setSelectedOfferForConfirm(o)}
                                >
                                  {t('selectOffer')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" onClick={() => setSelectedLotForOffers(null)}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* Modal: Select Offer Confirmation */}
        <Modal
          isOpen={!!selectedOfferForConfirm}
          onClose={() => setSelectedOfferForConfirm(null)}
          title={t('selectOfferConfirmTitle')}
          maxWidth="500px"
        >
          {selectedOfferForConfirm && (
            <div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Buyer:</span>
                    <strong>{selectedOfferForConfirm.buyerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Buyer Type:</span>
                    <span>{selectedOfferForConfirm.buyerRole === 'repair' ? 'Repair Shop (Reuse)' : 'Authorized Recycler'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Material:</span>
                    <span>{selectedOfferForConfirm.materialCategory} ({selectedOfferForConfirm.weight} {selectedOfferForConfirm.weightUnit})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Offered Rate:</span>
                    <strong>₹{selectedOfferForConfirm.offeredPrice}/kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#166534' }}>Total Valuation:</span>
                    <strong style={{ fontSize: '1.15rem', color: '#15803d' }}>
                      ₹{selectedOfferForConfirm.totalOfferValue?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Mandatory Platform Disclaimer */}
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '0.75rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                ⚠️ {t('selectOfferDisclaimer')}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setSelectedOfferForConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  id="btn-confirm-accept-offer"
                  variant="secondary"
                  fullWidth
                  onClick={handleConfirmAccept}
                >
                  {t('selectThisOffer')}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>

      {/* Cashfree Payment Modal — opens after collector accepts an offer */}
      <CashfreePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setRefreshTrigger((prev) => prev + 1);
        }}
        offer={paymentOffer}
        transactionId={paymentTxnId}
        collectorId={activeCollectorId}
        onPaymentVerified={handlePaymentVerified}
      />

      <MobileBottomNav role="COLLECTOR" />
    </div>
  );
};
