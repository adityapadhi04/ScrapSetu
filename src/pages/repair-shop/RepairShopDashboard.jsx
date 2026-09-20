import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  PlusCircle, 
  Cpu, 
  Monitor, 
  Zap, 
  Clock, 
  IndianRupee, 
  Sparkles, 
  Store, 
  CheckCircle2,
  FileText,
  Package,
  ArrowRight,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { RepairShopNavBar } from './RepairShopSubpages';
import { 
  MOCK_REPAIR_SHOP_DATA,
  MOCK_REPAIR_SHOP_WANTED,
  MOCK_REPAIR_SHOP_COMPONENTS,
  MOCK_REPAIR_SHOP_PURCHASES,
  MOCK_REPAIR_SHOP_OFFERS
} from '../../data/mockData';
import { getWantedItems, createWantedItem } from '../../services/repairShopService';
import { getEligibleLotsForRepairShop } from '../../services/offerMatchingService';
import { getOffersForBuyer } from '../../services/offerService';
import { getAllScrapLots } from '../../services/scrapLotService';
import { subscribeToRealtimeSync } from '../../services/realtimeSync';
import MakeOfferModal from '../../components/marketplace/MakeOfferModal';

export const RepairShopDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const activeShopId = user?.repairShopId || ((user?.userId?.startsWith('SHOP')) ? user.userId : 'SHOP-0002');
  const shopName = user?.name || MOCK_REPAIR_SHOP_DATA.shopName;

  const [wantedList, setWantedList] = useState(() => {
    const items = getWantedItems('SHOP-0002');
    return items.length > 0 ? items : getWantedItems();
  });

  // Module 8: All Lots, Eligible Lots, and Live Offers State
  const [allLots, setAllLots] = useState(() => getAllScrapLots());
  const [eligibleLots, setEligibleLots] = useState(() => getEligibleLotsForRepairShop(activeShopId));
  const [myOffers, setMyOffers] = useState(() => getOffersForBuyer(activeShopId));
  const [selectedLotForModal, setSelectedLotForModal] = useState(null);
  const [activeLotsTab, setActiveLotsTab] = useState('all'); // Default to 'all' so every created lot is visible immediately
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshOffersAndLots = (silent = false) => {
    if (!silent) setIsSyncing(true);
    const freshLots = getAllScrapLots();
    setAllLots(freshLots);
    setEligibleLots(getEligibleLotsForRepairShop(activeShopId));
    setMyOffers(getOffersForBuyer(activeShopId));
    setLastSyncTime(new Date());
    if (!silent) {
      setTimeout(() => setIsSyncing(false), 300);
    }
  };

  // Real-time synchronization subscription across tabs and in-app actions
  useEffect(() => {
    refreshOffersAndLots(true);
    const unsubscribe = subscribeToRealtimeSync(() => {
      refreshOffersAndLots(true);
    });
    return () => unsubscribe();
  }, [activeShopId]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Laptop / Computer');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCondition, setNewCondition] = useState('Good');
  const [newQuantity, setNewQuantity] = useState('5');
  const [newPrice, setNewPrice] = useState('');

  const handleAddWanted = (e) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const created = createWantedItem({
        repairShopId: 'SHOP-0002',
        name: newTitle,
        materialCategory: newCategory || 'Laptop / Computer',
        materialSubcategory: newSubcategory || newTitle,
        preferredCondition: newCondition || 'Good',
        quantityNeeded: parseInt(newQuantity, 10) || 5,
        offeringPrice: newPrice || 'Market Rate',
        location: 'Lamington Road, Mumbai',
        urgency: 'Active Demand'
      });
      setWantedList([created, ...wantedList]);
    } catch (err) {
      console.error('Failed to create wanted item:', err);
    }
    setNewTitle('');
    setNewCategory('Laptop / Computer');
    setNewSubcategory('');
    setNewCondition('Good');
    setNewQuantity('5');
    setNewPrice('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1160px">
        {/* Repair Shop Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                {MOCK_REPAIR_SHOP_DATA.shopName}
              </h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Store size={14} color="#d97706" />
              {MOCK_REPAIR_SHOP_DATA.location} • Owner: <strong>{MOCK_REPAIR_SHOP_DATA.owner}</strong> • Specialist: Laptops, Motherboards & Displays
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="warning">
              Licensed Repair Entity ✓
            </Badge>
            <Badge variant="success">
              Circular Reuse Partner ✓
            </Badge>
          </div>
        </div>

        {/* Repair Shop Navigation Bar */}
        <RepairShopNavBar />

        {/* 4 Metric Summary Cards */}
        <div className="grid-cols-4" style={{ marginBottom: '1.75rem', gap: '1rem' }}>
          <Card interactive onClick={() => navigate('/repair-shop/components')} style={{ borderLeft: '4px solid #16a34a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Matching Components
              </span>
              <Sparkles size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_REPAIR_SHOP_DATA.matchingItemsCount} Found
            </div>
            <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
              From local collectors →
            </span>
          </Card>

          <Card interactive onClick={() => navigate('/repair-shop/wanted')} style={{ borderLeft: '4px solid #d97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Active Wanted Items
              </span>
              <Wrench size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {wantedList.length} Items
            </div>
            <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
              Broadcast active →
            </span>
          </Card>

          <Card interactive onClick={() => navigate('/repair-shop/offers')} style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Pending Offers
              </span>
              <IndianRupee size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {myOffers.length} Active
            </div>
            <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
              1 Accepted by collector →
            </span>
          </Card>

          <Card interactive onClick={() => navigate('/repair-shop/purchases')} style={{ borderLeft: '4px solid #7c3aed' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Recent Purchases
              </span>
              <Package size={18} color="#7c3aed" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_REPAIR_SHOP_PURCHASES.length} Lots
            </div>
            <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
              {MOCK_REPAIR_SHOP_DATA.salvageSavings} saved vs OEM →
            </span>
          </Card>
        </div>

        {/* PROMINENT FEATURE: "⭐ What I Need" (Wanted Components) */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  ⭐ What I Need (पार्ट्स की ज़रूरत)
                </h2>
                <Badge variant="warning">Active Broadcast</Badge>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Broadcast components you need for repair jobs. Nearby collectors see your demand and bring salvageable parts instead of scrapping them.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/repair-shop/wanted')}
              >
                Manage All Wanted ({wantedList.length})
              </Button>
              <Button
                variant="accent"
                icon={PlusCircle}
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                Post New Wanted Item
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {wantedList.map((item) => (
              <Card key={item.id} style={{ padding: '1.15rem', border: '1.5px solid #fef3c7', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {item.id}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.name}</h3>
                      <Badge variant="warning">{item.urgency}</Badge>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Category: <strong>{item.category}</strong> • Condition needed: <strong>{item.conditionNeeded}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Offering Rate</span>
                    <strong style={{ fontSize: '1.15rem', color: '#d97706' }}>
                      {item.offeringPrice}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', fontWeight: 700 }}>
                      ⚡ {item.matchesFound} matched lots
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #fef3c7' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Broadcasting in 10 km radius to 1,248 registered collectors
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/repair-shop/components')}
                  >
                    View Matched Scrap Lots →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Module 8: Available Scrap Lots Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  📦 {t('availableScrapLots')}
                </h2>
                <Badge variant="warning">{eligibleLots.length} Matched</Badge>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#ecfdf5', 
                  border: '1px solid #a7f3d0', 
                  color: '#065f46', 
                  fontSize: '0.74rem', 
                  fontWeight: 700, 
                  padding: '2px 8px', 
                  borderRadius: '999px' 
                }}>
                  <span style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    background: isSyncing ? '#f59e0b' : '#10b981',
                    boxShadow: isSyncing ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
                  }} />
                  {isSyncing ? 'Syncing...' : 'Real-Time Sync Active'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                Live collector scrap lots updated automatically across sessions and devices:
              </p>
            </div>

            <button
              onClick={() => refreshOffersAndLots(false)}
              title="Refresh lots in real time"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                color: '#334155',
                fontWeight: 600
              }}
            >
              <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          {/* View Filter Tabs: All Collector Lots vs Matched for Repair */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setActiveLotsTab('all')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1.5px solid',
                borderColor: activeLotsTab === 'all' ? '#0284c7' : '#e2e8f0',
                background: activeLotsTab === 'all' ? '#e0f2fe' : '#ffffff',
                color: activeLotsTab === 'all' ? '#0369a1' : '#64748b',
                fontWeight: activeLotsTab === 'all' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeLotsTab === 'all' ? '0 1px 3px rgba(2,132,199,0.15)' : 'none'
              }}
            >
              🌐 All Live Collector Lots ({allLots.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLotsTab('eligible')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1.5px solid',
                borderColor: activeLotsTab === 'eligible' ? '#d97706' : '#e2e8f0',
                background: activeLotsTab === 'eligible' ? '#fef3c7' : '#ffffff',
                color: activeLotsTab === 'eligible' ? '#92400e' : '#64748b',
                fontWeight: activeLotsTab === 'eligible' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeLotsTab === 'eligible' ? '0 1px 3px rgba(217,119,6,0.15)' : 'none'
              }}
            >
              ⭐ Matched for Repair ({eligibleLots.length})
            </button>
          </div>

          {/* Displayed Lots based on active tab */}
          {(() => {
            const displayedLots = activeLotsTab === 'eligible' ? eligibleLots : allLots;

            if (displayedLots.length === 0) {
              return (
                <Card style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Package size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {activeLotsTab === 'eligible' 
                      ? 'No eligible scrap lots currently matched for repair reuse.' 
                      : 'No collector scrap lots recorded on the platform yet.'}
                  </p>
                  <span style={{ fontSize: '0.78rem' }}>
                    {activeLotsTab === 'eligible'
                      ? 'Switch to "All Live Collector Lots" above to see raw materials or recycler-bound lots.'
                      : 'When local collectors aggregate scrap lots, they will appear here in real time.'}
                  </span>
                </Card>
              );
            }

            return (
              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                {displayedLots.map((lot) => {
                  const isMatched = eligibleLots.some((el) => el.id === lot.id);
                  const matchedLot = eligibleLots.find((el) => el.id === lot.id) || lot;
                  const displayLocation = typeof lot.location === 'string'
                    ? lot.location
                    : (lot.location?.area || lot.location?.city || 'Local Pickup');

                  const isDamagedBattery = (lot.materialType || lot.materialCategory || '').toLowerCase().includes('battery') && lot.condition === 'damaged';

                  return (
                    <Card key={lot.id} style={{ padding: '1.2rem', border: isMatched ? '1.5px solid #fef3c7' : '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: isMatched ? '#fef3c7' : '#f1f5f9', color: isMatched ? '#b45309' : '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                            {lot.id}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '3px 0 1px 0' }}>
                            {lot.materialType || lot.materialCategory}
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                            Weight: <strong style={{ color: '#15803d' }}>{lot.weight} {lot.weightUnit}</strong> • Condition: <strong>{lot.condition}</strong>
                          </div>
                        </div>

                        {isMatched ? (
                          <Badge variant="warning">
                            Reuse / Salvage
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            ♻ Recycler Pathway
                          </Badge>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.65rem' }}>
                        📍 {displayLocation}
                      </div>

                      {/* Platform Estimated Range */}
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <span style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IndianRupee size={13} color="#d97706" />
                          <span>{t('platformEstimate')}:</span>
                        </span>
                        <strong style={{ fontSize: '0.86rem', color: '#d97706' }}>
                          {matchedLot.priceEstimate?.priceRangeFormatted || (lot.estimatedPrice ? `₹${lot.estimatedPrice}/kg` : 'Estimate pending')}
                        </strong>
                      </div>

                      {/* Why can I offer checklist / routing notice */}
                      {isMatched && matchedLot.reasons && matchedLot.reasons.length > 0 ? (
                        <div style={{ background: '#fffbeb', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fde68a', marginBottom: '0.85rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                            ✓ {t('whyEligible')}
                          </span>
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.74rem', color: '#b45309' }}>
                            {matchedLot.reasons.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ) : !isMatched ? (
                        <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                            {isDamagedBattery ? '⚠️ Hazardous material: routed to authorized recyclers for chemical neutralization' : 'ℹ️ Bulk/Recycling stream: routed to authorized recyclers for industrial recovery'}
                          </span>
                        </div>
                      ) : null}

                      <Button
                        id={`btn-repair-offer-${lot.id}`}
                        variant={isMatched ? 'accent' : 'outline'}
                        size="sm"
                        fullWidth
                        onClick={() => setSelectedLotForModal(matchedLot)}
                      >
                        💰 {t('makeOffer')}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Matching Components from Collectors */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Available Salvage Components from Local Collectors</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Items collected locally that pass initial visual inspection:
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/repair-shop/components')}>
              View All Components ({MOCK_REPAIR_SHOP_COMPONENTS.length}) →
            </Button>
          </div>

          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            {MOCK_REPAIR_SHOP_COMPONENTS.slice(0, 2).map((item) => (
              <Card key={item.id} style={{ padding: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>{item.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Collector: <strong>{item.collector}</strong> ({item.location})
                    </p>
                  </div>
                  <Badge variant="success">Uncracked</Badge>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Est. Price: {item.estimatedPrice}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="accent"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/repair-shop/components')}
                  >
                    💰 Make Offer to Collector
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Purchases & Salvage Log */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Purchases & Salvage Yield</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Parts harvested and kept in circulation:
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/repair-shop/purchases')}>
              View Purchase Log →
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_REPAIR_SHOP_PURCHASES.map((p) => (
              <Card key={p.id} style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {p.id}
                      </span>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{p.component}</h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                      Collector: {p.collector} • Date: {p.date} • Yield: <strong style={{ color: '#15803d' }}>{p.salvageYield}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{p.amount}</strong>
                    <Badge variant="success" style={{ display: 'block', marginTop: '2px' }}>{p.status}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal: Post New Wanted Item */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Post Wanted Component (पार्ट्स की मांग)"
        >
          <form onSubmit={handleAddWanted}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Broadcast required parts to local collectors. Example wanted items: Laptop RAM, Laptop Display, SMPS, Motor, Mobile Components.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Material Category (सामग्री श्रेणी)
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none'
                }}
              >
                <option value="Laptop / Computer">Laptop / Computer</option>
                <option value="Mobile Phone">Mobile Phone</option>
                <option value="LCD / Display">LCD / Display</option>
                <option value="PCB">Printed Circuit Board (PCB)</option>
                <option value="Motor">Electric Motor / Transformer</option>
                <option value="Cable">Wires & Cables</option>
                <option value="Other E-waste">Other E-waste</option>
              </select>
            </div>

            <Input
              label="Component Name (घटक का नाम)"
              placeholder="e.g. Laptop RAM / Laptop Display / SMPS / Mobile Screen"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <Input
              label="Specification or Model Details (विशिष्टता)"
              placeholder="e.g. Dell Inspiron 15 / DDR4 8GB / 15.6 LED 30-Pin"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Preferred Condition
                </label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                >
                  <option value="Good">Good (Intact / Working)</option>
                  <option value="Fair">Fair (Salvageable / Tested)</option>
                  <option value="Any">Any Condition (Parts Extraction)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Quantity Needed
                </label>
                <input
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <Input
              label="Offering Price or Budget (प्रस्तावित दर)"
              placeholder="e.g. ₹400 – ₹800 / piece"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Broadcast to Collectors (मांग पोस्ट करें)
              </Button>
            </div>
          </form>
        </Modal>

        {/* Module 8: Make Offer Modal */}
        <MakeOfferModal
          isOpen={!!selectedLotForModal}
          onClose={() => setSelectedLotForModal(null)}
          lot={selectedLotForModal}
          buyerRole="repair"
          buyerId={activeShopId}
          buyerName={shopName}
          onOfferSubmitted={refreshOffersAndLots}
        />

        {/* LOWER-LEFT: Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>
    </div>
  );
};

export default RepairShopDashboard;
