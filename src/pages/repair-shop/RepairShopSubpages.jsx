import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  Wrench, 
  PlusCircle, 
  ArrowLeft, 
  Package, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText, 
  Store, 
  Search, 
  Filter, 
  Check, 
  Sparkles, 
  MapPin,
  Phone,
  ShieldCheck,
  User,
  ShoppingBag,
  LogOut,
  RefreshCw
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState, StatusIndicator } from '../../components/common/FeedbackStates';
import { 
  MOCK_REPAIR_SHOP_DATA,
  MOCK_REPAIR_SHOP_WANTED, 
  MOCK_REPAIR_SHOP_COMPONENTS, 
  MOCK_REPAIR_SHOP_OFFERS, 
  MOCK_REPAIR_SHOP_PURCHASES,
  MOCK_COLLECTOR_TRANSACTIONS
} from '../../data/mockData';
import { getWantedItems, createWantedItem, deleteWantedItem } from '../../services/repairShopService';
import { getOffersForBuyer } from '../../services/offerService';
import { getTransactionsByBuyer } from '../../services/transactionService';
import { getAllScrapLots } from '../../services/scrapLotService';
import { subscribeToRealtimeSync } from '../../services/realtimeSync';
import MakeOfferModal from '../../components/marketplace/MakeOfferModal';
import { 
  createHandover,
  confirmBuyerReceipt,
  getHandoversByTransaction 
} from '../../services/handoverService';
import { 
  createPaymentRecord,
  getPaymentsByTransaction,
  VALID_PAYMENT_METHODS 
} from '../../services/paymentService';
import DigitalScrapReceipt from '../../components/transactions/DigitalScrapReceipt';
import {
  getPickupsByBuyer,
  getPickupByTransactionId,
  createPickupRequest,
  schedulePickup,
  completePickup,
  cancelPickup
} from '../../services/pickupService';

/**
 * Reusable Repair Shop Navigation Bar
 */
export const RepairShopNavBar = () => {
  const { t } = useLanguage();
  const navItems = [
    { label: `🏠 ${t('dashboard')}`, path: '/repair-shop', end: true },
    { label: `🔧 ${t('components')}`, path: '/repair-shop/components' },
    { label: `⭐ ${t('wantedItems')}`, path: '/repair-shop/wanted' },
    { label: `💰 ${t('offers')}`, path: '/repair-shop/offers' },
    { label: `📦 ${t('purchases')}`, path: '/repair-shop/purchases' },
    { label: `📄 ${t('transactions')}`, path: '/repair-shop/transactions' },
    { label: `👤 ${t('profile')}`, path: '/repair-shop/profile' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '8px',
      marginBottom: '1.5rem',
      borderBottom: '1px solid #e2e8f0',
      scrollbarWidth: 'none'
    }}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) => `btn ${isActive ? 'btn-accent' : 'btn-outline'}`}
          style={{
            fontSize: '0.82rem',
            padding: '0.45rem 0.85rem',
            minHeight: '36px',
            whiteSpace: 'nowrap',
            borderRadius: '20px'
          }}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
};

/**
 * 1. Available Components Page (/repair-shop/components)
 */
export const RepairShopComponentsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const activeShopId = user?.repairShopId || ((user?.userId?.startsWith('SHOP')) ? user.userId : 'SHOP-0002');
  const shopName = user?.name || 'Om Electronics & Laptop Care';

  const loadComponentsData = () => {
    const rawLots = getAllScrapLots();
    if (rawLots && rawLots.length > 0) {
      return rawLots.map((lot) => {
        const displayLocation = typeof lot.location === 'string'
          ? lot.location
          : (lot.location?.area || lot.location?.city || 'Local Collector');
        return {
          id: lot.id,
          rawLot: lot,
          name: lot.materialType || lot.materialCategory,
          collector: lot.collectorId || 'Local Collector',
          location: displayLocation,
          condition: lot.condition,
          availableQty: `${lot.weight} ${lot.weightUnit || 'kg'}`,
          estimatedPrice: lot.estimatedPrice ? `₹${lot.estimatedPrice}/kg` : (lot.priceEstimate?.priceRangeFormatted || 'Market Rate')
        };
      });
    }
    return MOCK_REPAIR_SHOP_COMPONENTS;
  };

  const [components, setComponents] = useState(loadComponentsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLotForOffer, setSelectedLotForOffer] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshComponents = () => {
    setIsSyncing(true);
    setComponents(loadComponentsData());
    setTimeout(() => setIsSyncing(false), 300);
  };

  // Real-time synchronization subscription
  useEffect(() => {
    refreshComponents();
    const unsubscribe = subscribeToRealtimeSync(() => {
      refreshComponents();
    });
    return () => unsubscribe();
  }, []);

  const filtered = components.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.collector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1160px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => navigate('/repair-shop')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back to dashboard">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>🔧 {t('components')}</h1>
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
                <button
                  onClick={refreshComponents}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  <RefreshCw size={12} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </button>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Reusable e-waste parts salvaged by local collectors before scrap shredding
              </p>
            </div>
          </div>

          <div style={{ width: '260px' }}>
            <Input
              placeholder="Search components or collectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <RepairShopNavBar />

        {filtered.length === 0 ? (
          <EmptyState
            title="No matching components"
            description="No collector has registered scrap lots matching your search term."
            actionLabel="Clear Search"
            onAction={() => setSearchTerm('')}
          />
        ) : (
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            {filtered.map((item) => (
              <Card key={item.id} style={{ padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {item.id}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>{item.name}</h3>
                  </div>
                  <Badge variant="success">✓ Available</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: '#475569', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#16a34a" />
                    <span>Collector: <strong>{item.collector}</strong> ({item.location})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#0284c7" />
                    <span>Condition: <strong>{item.condition}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={14} color="#d97706" />
                    <span>Available Quantity: <strong>{item.availableQty}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Estimated Value</span>
                    <strong style={{ fontSize: '1.2rem', color: '#d97706' }}>{item.estimatedPrice}</strong>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => {
                      if (item.rawLot) {
                        setSelectedLotForOffer(item.rawLot);
                      } else {
                        setSelectedLotForOffer({
                          id: item.id,
                          materialCategory: item.name,
                          weight: 1,
                          weightUnit: 'units',
                          condition: item.condition,
                          estimatedPrice: parseInt(item.estimatedPrice.replace(/[^0-9]/g, ''), 10) || 500
                        });
                      }
                    }}
                  >
                    💰 Make Offer
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Make Real Marketplace Offer */}
        {selectedLotForOffer && (
          <MakeOfferModal
            isOpen={!!selectedLotForOffer}
            onClose={() => setSelectedLotForOffer(null)}
            lot={selectedLotForOffer}
            buyerRole="repair"
            buyerId={activeShopId}
            buyerName={shopName}
            onOfferSubmitted={() => {
              setSelectedLotForOffer(null);
              refreshComponents();
            }}
          />
        )}

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

/**
 * 2. What I Need Page (/repair-shop/wanted)
 */
export const RepairShopWantedPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [wantedItems, setWantedItems] = useState(() => {
    const items = getWantedItems('SHOP-0002');
    return items.length > 0 ? items : getWantedItems();
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Laptop / Computer');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCondition, setNewCondition] = useState('Good');
  const [newQuantity, setNewQuantity] = useState('5');
  const [newPrice, setNewPrice] = useState('');

  const handleCreate = (e) => {
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
      setWantedItems([created, ...wantedItems]);
    } catch (err) {
      console.error('Failed to create wanted item:', err);
    }
    setIsModalOpen(false);
    setNewTitle('');
    setNewCategory('Laptop / Computer');
    setNewSubcategory('');
    setNewCondition('Good');
    setNewQuantity('5');
    setNewPrice('');
  };

  const handleDelete = (id) => {
    deleteWantedItem(id);
    setWantedItems(wantedItems.filter((i) => i.wantedId !== id && i.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1160px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => navigate('/repair-shop')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back to dashboard">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>⭐ {t('wantedItems')}</h1>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Broadcast required components so local collectors can salvage them before selling as scrap
              </p>
            </div>
          </div>

          <Button variant="accent" icon={PlusCircle} onClick={() => setIsModalOpen(true)}>
            Post New Wanted Item
          </Button>
        </div>

        <RepairShopNavBar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {wantedItems.map((item) => (
            <Card key={item.wantedId || item.id} style={{ padding: '1.25rem', border: '1.5px solid #fef3c7', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {item.wantedId || item.id}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.name || item.materialCategory}</h3>
                    <Badge variant="warning">{item.urgency || 'Active Demand'}</Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                    Category: <strong>{item.materialCategory || item.category}</strong> • Specs: <strong>{item.materialSubcategory || item.category}</strong> • Condition: <strong>{item.preferredCondition || item.conditionNeeded}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Target Budget</span>
                  <strong style={{ fontSize: '1.2rem', color: '#d97706' }}>{item.offeringPrice}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'block' }}>
                    ⚡ {item.matchesFound || 1} Collector Lots Matched
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #fef3c7' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Broadcast active in {item.location || 'Local Area'} ({item.quantityNeeded || 5} units needed)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.wantedId || item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    Delete
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert(`Showing ${item.matchesFound || 1} local collectors matching "${item.name || item.materialCategory}" (Demo)`)}
                  >
                    View Matched Collector Lots ({item.matchesFound || 1})
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal: Post New Wanted Item */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Post Wanted Component (पार्ट्स की मांग जोड़ें)"
        >
          <form onSubmit={handleCreate}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Broadcast specific parts required for your repair shop. Collectors nearby will receive notifications to salvage these items.
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
              label="Component Name (e.g. Laptop Display, Mobile Components, SMPS)"
              placeholder="e.g. Laptop RAM (DDR4)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <Input
              label="Specification / Model Details"
              placeholder="e.g. 8GB 3200MHz SODIMM"
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
              label="Offering Price / Budget"
              placeholder="e.g. ₹500 – ₹800 / piece"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Broadcast Demand
              </Button>
            </div>
          </form>
        </Modal>
      </PageContainer>
    </div>
  );
};

/**
 * 3. My Offers Page (/repair-shop/offers)
 */
export const RepairShopOffersPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const activeShopId = (user?.userId?.startsWith('SHOP')) ? user.userId : 'SHOP-0001';
  const [realOffers, setRealOffers] = useState(() => getOffersForBuyer(activeShopId));

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1160px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/repair-shop')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>💰 {t('offers')}</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Track component and scrap lot offers submitted to local collectors
            </p>
          </div>
        </div>

        <RepairShopNavBar />

        {realOffers.length === 0 ? (
          <Card style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            <Package size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              No repair reuse offers submitted yet
            </h3>
            <p style={{ fontSize: '0.85rem', margin: '0 auto 1.25rem auto', maxWidth: '360px' }}>
              View available collector scrap lots in your dashboard and make offers on salvageable components.
            </p>
            <Button variant="accent" onClick={() => navigate('/repair-shop')}>
              View Available Scrap Lots →
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {realOffers.map((offer) => {
              const isAccepted = offer.status === 'accepted';
              const isRejected = offer.status === 'rejected';
              return (
                <Card key={offer.offerId} style={{ padding: '1.25rem', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, color: '#0f172a' }}>
                          {offer.offerId}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                          {offer.lotId}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {offer.materialCategory}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#475569', margin: '3px 0' }}>
                        Weight: <strong>{offer.weight} {offer.weightUnit}</strong> • Offered: <strong>₹{offer.offeredPrice}/kg</strong>
                      </p>
                      {offer.message && (
                        <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', margin: '3px 0' }}>
                          "{offer.message}"
                        </p>
                      )}
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        📅 {new Date(offer.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Offer Value</span>
                      <strong style={{ fontSize: '1.3rem', color: '#15803d' }}>
                        ₹{offer.totalOfferValue?.toLocaleString('en-IN')}
                      </strong>
                      <div style={{ marginTop: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '99px',
                            background: isAccepted ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                            color: isAccepted ? '#15803d' : isRejected ? '#dc2626' : '#92400e',
                            border: `1px solid ${isAccepted ? '#86efac' : isRejected ? '#fca5a5' : '#fde68a'}`,
                            textTransform: 'uppercase'
                          }}
                        >
                          {offer.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAccepted && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #dcfce7', background: '#f0fdf4', margin: '0.85rem -1.25rem -1.25rem -1.25rem', padding: '0.75rem 1.25rem', borderRadius: '0 0 10px 10px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
                        ✓ Collector selected your offer! Verification and handover proceed in subsequent platform phases.
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

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

/**
 * 4. Purchases Page (/repair-shop/purchases)
 */
export const RepairShopPurchasesPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [purchases] = useState(MOCK_REPAIR_SHOP_PURCHASES);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1160px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/repair-shop')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📦 {t('purchases')}</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Completed acquisitions from informal collectors verified for repair reuse
            </p>
          </div>
        </div>

        <RepairShopNavBar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {purchases.map((item) => (
            <Card key={item.id} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {item.id}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.component}</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Collector: <strong>{item.collector}</strong> • Date: {item.date}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
                    ⚡ Salvage Yield: {item.salvageYield}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Paid Amount</span>
                  <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>{item.amount}</strong>
                  <Badge variant="success" style={{ marginTop: '4px' }}>{item.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

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

/**
 * 5. Transactions Page (/repair-shop/transactions) — Live from transactionService (Module 9)
 */
export const RepairShopTransactionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const activeBuyerId = user?.userId || 'SHOP-0001';
  const [transactions, setTransactions] = useState([]);
  const [receiptData, setReceiptData] = useState(null);

  // Payment modal state
  const [paymentModalTx, setPaymentModalTx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRefNote, setPaymentRefNote] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Module 14 Pickup modal state
  const [pickupModalTx, setPickupModalTx] = useState(null);
  const [pickupMethod, setPickupMethod] = useState('collector_dropoff');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [pickupError, setPickupError] = useState('');

  const refreshList = () => {
    setTransactions(getTransactionsByBuyer(activeBuyerId));
  };

  useEffect(() => {
    refreshList();
  }, [activeBuyerId]);

  const handleViewReceipt = (tx) => {
    const handovers = getHandoversByTransaction(tx.transactionId);
    const payments = getPaymentsByTransaction(tx.transactionId);
    setReceiptData({ transaction: tx, handover: handovers[0] || null, payment: payments[0] || null });
  };

  const handleConfirmReceipt = (tx) => {
    try {
      const existing = getHandoversByTransaction(tx.transactionId);
      let target = existing[0];
      if (!target) {
        target = createHandover({
          transactionId: tx.transactionId,
          lotId: tx.lotId,
          collectorId: tx.collectorId,
          buyerId: activeBuyerId,
          buyerRole: 'repair',
          materialCategory: tx.materialCategory,
          weight: tx.weight,
          weightUnit: tx.weightUnit,
          handoverMethod: 'collector_delivers',
          handoverLocation: { area: 'Repair Shop Facility', city: '', state: '' }
        });
      }
      confirmBuyerReceipt(target.handoverId, activeBuyerId);
      refreshList();
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
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
      setPickupMethod(existing.method || 'collector_dropoff');
      setPickupDate(existing.scheduledDate || '');
      setPickupTime(existing.scheduledTime || '');
      setPickupLocation(existing.location || '');
      setPickupNotes(existing.notes || '');
    } else {
      setPickupMethod('collector_dropoff');
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
          collectorId: pickupModalTx.collectorId,
          buyerId: activeBuyerId,
          buyerRole: 'repair',
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

  const handleCompletePickupAction = (pickupId) => {
    try {
      completePickup(pickupId, { notes: 'Material inspected and received at repair shop.' }, user);
      refreshList();
    } catch (err) {
      alert(err.message || 'Failed to complete pickup');
    }
  };

  const handleSavePaymentSubmit = () => {
    if (!paymentModalTx) return;
    try {
      createPaymentRecord({
        transactionId: paymentModalTx.transactionId,
        collectorId: paymentModalTx.collectorId,
        buyerId: activeBuyerId,
        buyerRole: 'repair',
        amount: paymentModalTx.totalAmount,
        currency: 'INR',
        paymentMethod,
        referenceNote: paymentRefNote.trim(),
        recordedBy: activeBuyerId
      });
      refreshList();
      setPaymentModalTx(null);
    } catch (err) {
      setPaymentError(err.message || 'Payment recording failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1160px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/repair-shop')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📄 {t('transactions')}</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Compliant transaction history recorded on ScrapSetu digital ledger
            </p>
          </div>
        </div>

        <RepairShopNavBar />

        {transactions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('noTransactionsYet')}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>
              Transactions appear here once your offers are accepted by a Collector.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {transactions.map((tx) => {
              const isCompleted = tx.transactionStatus === 'completed';
              const canConfirmReceipt = tx.handoverStatus !== 'confirmed';
              const canRecordPayment = tx.paymentStatus !== 'recorded';

              return (
                <Card key={tx.transactionId} style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {[tx.transactionId, tx.offerId, tx.lotId].map((id) => (
                          <span key={id} style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{id}</span>
                        ))}
                        <Badge variant={isCompleted ? 'success' : 'warning'}>
                          {tx.transactionStatus?.replace(/_/g, ' ')}
                        </Badge>
                        {tx.handoverStatus === 'confirmed' && <Badge variant="success">Handover Confirmed ✓</Badge>}
                        {tx.paymentStatus === 'recorded' && <Badge variant="success">Payment Recorded ✓</Badge>}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>
                        {tx.materialCategory}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {tx.weight} {tx.weightUnit} • Collector: <strong>{tx.collectorName}</strong>
                      </p>
                      {/* Module 14: Coordination Status */}
                      {(() => {
                        const pkp = getPickupByTransactionId(tx.transactionId);
                        return (
                          <div style={{ margin: '0.4rem 0', padding: '0.45rem 0.65rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span>
                                🚚 <strong>{pkp ? (pkp.method === 'buyer_pickup' ? 'Shop Pickup' : 'Collector Drop-off') : 'Coordination'}:</strong>{' '}
                                {pkp ? pkp.status.toUpperCase() : 'NOT SET'}
                                {pkp?.scheduledDate ? ` (📅 ${pkp.scheduledDate} ${pkp.scheduledTime || ''})` : ''}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPickup(tx)}
                                  style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.74rem' }}
                                >
                                  {pkp ? '✏️ Update' : '+ Schedule'}
                                </button>
                                {pkp?.status === 'scheduled' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCompletePickupAction(pkp.pickupId)}
                                    style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.74rem', marginLeft: '6px' }}
                                  >
                                    ✓ Completed
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d', display: 'block' }}>₹{(tx.totalAmount || 0).toLocaleString('en-IN')}</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '6px' }}>
                        {canConfirmReceipt && (
                          <Button
                            variant="primary"
                            size="sm"
                            id={`btn-confirm-receipt-${tx.transactionId}`}
                            onClick={() => handleConfirmReceipt(tx)}
                          >
                            {t('confirmReceipt')}
                          </Button>
                        )}
                        {canRecordPayment && (
                          <Button
                            variant="outline"
                            size="sm"
                            id={`btn-rs-payment-${tx.transactionId}`}
                            onClick={() => handleOpenPayment(tx)}
                          >
                            {t('recordPayment')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          id={`btn-rs-receipt-${tx.transactionId}`}
                          onClick={() => handleViewReceipt(tx)}
                        >
                          {t('viewReceipt')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
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
                <Button variant="primary" id="btn-submit-rs-payment" onClick={handleSavePaymentSubmit}>
                  Save Payment Record
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* LOWER-LEFT: Account Switcher */}
        <div style={{ maxWidth: '280px', marginTop: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {t('currentAccount')}
          </div>
          <AccountSwitcher dropup={true} />
        </div>
      </PageContainer>

      {/* Receipt Modal */}
      {receiptData && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setReceiptData(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <DigitalScrapReceipt transaction={receiptData.transaction} handover={receiptData.handover} payment={receiptData.payment} />
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <Button variant="outline" onClick={() => setReceiptData(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 6. Profile Page (/repair-shop/profile)
 */
export const RepairShopProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="860px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <button onClick={() => navigate('/repair-shop')} className="btn btn-ghost" style={{ padding: '6px' }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>👤 {t('profile')}</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Business credentials & verified trade registration
            </p>
          </div>
        </div>

        <RepairShopNavBar />

        <Card style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={32} color="#d97706" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{MOCK_REPAIR_SHOP_DATA.shopName}</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Owner: <strong>{MOCK_REPAIR_SHOP_DATA.owner}</strong> • {MOCK_REPAIR_SHOP_DATA.location}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <Badge variant="warning">Shop & Establishment Reg ✓</Badge>
                <Badge variant="success">Circular Reuse Partner</Badge>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Primary Specialty</span>
              <strong style={{ fontSize: '0.95rem' }}>Laptop Motherboards & Display Panels</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Registration No.</span>
              <strong style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>SE-84910/MUM</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Operating Since</span>
              <strong style={{ fontSize: '0.95rem' }}>2018 (8 Years in Mumbai)</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>Salvage Reusability Rate</span>
              <strong style={{ fontSize: '0.95rem', color: '#15803d' }}>84% Components Salvaged</strong>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={20} color="#16a34a" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534' }}>CPCB Circular Economy Verification</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#14532d', lineHeight: 1.4 }}>
            Your repair shop is enrolled in the ScrapSetu reuse channel. Salvaging functional chips and display panels extends electronics lifetime, diverting hazardous e-waste from unscientific acid washing and open landfills.
          </p>
        </Card>

        {/* Switch Account Section */}
        <Card style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            🔄 {t('switchAccount')}
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.85rem' }}>
            Switch to a different portal account on this device.
          </p>
          <AccountSwitcher dropup={false} />
        </Card>

        {/* Logout Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <button
            id="repair-logout-button"
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              width: '100%',
              maxWidth: '300px',
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
    </div>
  );
};
