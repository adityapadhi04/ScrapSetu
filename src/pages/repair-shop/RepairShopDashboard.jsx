import React, { useState } from 'react';
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
  MapPin
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

export const RepairShopDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [wantedList, setWantedList] = useState(MOCK_REPAIR_SHOP_WANTED);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const handleAddWanted = (e) => {
    e.preventDefault();
    if (!newTitle) return;
    const newItem = {
      id: `WANT-0${wantedList.length + 1}`,
      name: newTitle,
      category: newCategory || newTitle,
      conditionNeeded: 'Tested / Salvageable',
      offeringPrice: newPrice || 'Market Rate',
      matchesFound: 1,
      urgency: 'Active Demand'
    };
    setWantedList([newItem, ...wantedList]);
    setNewTitle('');
    setNewCategory('');
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
              {MOCK_REPAIR_SHOP_OFFERS.length} Active
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
            <Input
              label="Component Name"
              placeholder="e.g. Laptop RAM / Laptop Display / SMPS / Motor / Mobile Components"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <Input
              label="Specification or Model Details"
              placeholder="e.g. Dell Inspiron 15 Motherboard / DDR4 8GB / 500W SMPS"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Input
              label="Offering Price or Budget"
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
