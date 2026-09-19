import React, { useState } from 'react';
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
  LogOut
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
  const [components] = useState(MOCK_REPAIR_SHOP_COMPONENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [bidAmount, setBidAmount] = useState('');

  const filtered = components.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.collector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    alert(`Offer of ₹${bidAmount} sent to collector ${selectedComponent.collector} for ${selectedComponent.name}! (Demo)`);
    setSelectedComponent(null);
    setBidAmount('');
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
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🔧 {t('components')}</h1>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
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
                    <span>Available Quantity: <strong>{item.availableQty} units</strong></span>
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
                      setSelectedComponent(item);
                      setBidAmount(item.estimatedPrice.replace(/[^0-9]/g, '') || '500');
                    }}
                  >
                    💰 Make Offer
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Make Offer */}
        <Modal
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
          title={`Make Offer for ${selectedComponent?.name}`}
        >
          {selectedComponent && (
            <form onSubmit={handleOfferSubmit}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Propose a competitive purchase price directly to collector <strong>{selectedComponent.collector}</strong>. When accepted, payment is held in demo escrow until component handover.
              </p>
              <Input
                label="Your Offer Amount (₹)"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
                <Button type="button" variant="outline" onClick={() => setSelectedComponent(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent">
                  Send Offer to Collector
                </Button>
              </div>
            </form>
          )}
        </Modal>

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
  const [wantedItems, setWantedItems] = useState(MOCK_REPAIR_SHOP_WANTED);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle) return;
    const item = {
      id: `WANT-0${wantedItems.length + 1}`,
      name: newTitle,
      category: newCategory || newTitle,
      conditionNeeded: 'Tested / Working',
      offeringPrice: newPrice || 'Market Rate',
      matchesFound: 1,
      urgency: 'Active Demand'
    };
    setWantedItems([item, ...wantedItems]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewCategory('');
    setNewPrice('');
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
            <Card key={item.id} style={{ padding: '1.25rem', border: '1.5px solid #fef3c7', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {item.id}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.name}</h3>
                    <Badge variant="warning">{item.urgency || 'Active Demand'}</Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                    Specification: <strong>{item.category}</strong> • Condition: <strong>{item.conditionNeeded}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Target Budget</span>
                  <strong style={{ fontSize: '1.2rem', color: '#d97706' }}>{item.offeringPrice}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'block' }}>
                    ⚡ {item.matchesFound} Collector Lots Matched
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #fef3c7' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Broadcast active across 10 km radius in Mumbai
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Showing ${item.matchesFound} local collectors matching "${item.name}" (Demo)`)}
                >
                  View Matched Collector Lots ({item.matchesFound})
                </Button>
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
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
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
  const [offers] = useState(MOCK_REPAIR_SHOP_OFFERS);

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
              Track component bids submitted to local scrap collectors
            </p>
          </div>
        </div>

        <RepairShopNavBar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {offers.map((offer) => (
            <Card key={offer.id} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {offer.id}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{offer.componentName}</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Collector: <strong>{offer.collector}</strong> • Submitted: {offer.date}
                  </p>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Fair Market Benchmark: {offer.benchmarkRate}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Your Offer</span>
                  <strong style={{ fontSize: '1.25rem', color: '#d97706' }}>{offer.offeredAmount}</strong>
                  <div style={{ marginTop: '4px' }}>
                    <Badge variant={offer.statusType === 'accepted' ? 'success' : 'warning'}>
                      {offer.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {offer.statusType === 'accepted' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                    ✓ Collector accepted! Ready for physical verification & QR handover.
                  </span>
                  <Button variant="primary" size="sm" onClick={() => navigate('/repair-shop/purchases')}>
                    Proceed to Handover →
                  </Button>
                </div>
              )}
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
 * 5. Transactions Page (/repair-shop/transactions)
 */
export const RepairShopTransactionsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [txns] = useState(MOCK_COLLECTOR_TRANSACTIONS);

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {txns.map((tItem) => (
            <Card key={tItem.id} style={{ padding: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {tItem.id}
                    </span>
                    <Badge variant={tItem.statusType === 'completed' ? 'success' : 'warning'}>
                      {tItem.statusBadge}
                    </Badge>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>
                    {tItem.material}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Weight: <strong>{tItem.weight}</strong> • Buyer: <strong>{tItem.buyerName}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>{tItem.amount}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{tItem.date}</span>
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
