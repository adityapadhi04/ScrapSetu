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
  CheckCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { MOCK_REPAIR_SHOP_WANTED } from '../../data/mockData';

export const RepairShopDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [wantedList, setWantedList] = useState(MOCK_REPAIR_SHOP_WANTED);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const handleAddWanted = (e) => {
    e.preventDefault();
    if (!newCategory) return;
    const newItem = {
      id: `WANT-0${wantedList.length + 1}`,
      category: newCategory,
      conditionNeeded: 'Tested / Salvageable',
      offeringPrice: newPrice || 'Market Rate',
      status: 'Active Demand',
      matchCount: 1
    };
    setWantedList([newItem, ...wantedList]);
    setNewCategory('');
    setNewPrice('');
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PageContainer maxWidth="1160px">
        {/* Repair Shop Header & Trade Verification */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {currentUser?.name || 'Electronics Repair Hub'}
              </h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Store size={14} color="#d97706" />
              {currentUser?.location || 'Lamington Road, Mumbai'} • Specialist: {currentUser?.specialty || 'Laptops & Boards'}
            </p>
          </div>

          <Badge variant="warning">
            Licensed Repair Entity ✓
          </Badge>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid-cols-3" style={{ marginBottom: '1.75rem' }}>
          <Card style={{ borderLeft: '4px solid #d97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Wanted Component Listings
              </span>
              <Wrench size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              {wantedList.length} Items
            </div>
            <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>Active broadcast to collectors</span>
          </Card>

          <Card style={{ borderLeft: '4px solid #16a34a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Collector Match Leads
              </span>
              <Sparkles size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>8 Matches</div>
            <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>Motherboards & screens found</span>
          </Card>

          <Card style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Salvage Savings
              </span>
              <IndianRupee size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>₹14,200</div>
            <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600 }}>Saved vs OEM replacement</span>
          </Card>
        </div>

        {/* PROMINENT FEATURE: "WHAT I NEED" (Wanted Components) */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  ⭐ What I Need (पार्ट्स की ज़रूरत)
                </h2>
                <Badge variant="warning">Demand Broadcast</Badge>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Collectors will see your demand and bring salvageable components before selling as scrap.
              </p>
            </div>

            <Button
              variant="accent"
              icon={PlusCircle}
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              Post New Wanted Item
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {wantedList.map((item) => (
              <Card key={item.id} style={{ padding: '1.15rem', border: '1.5px solid #fef3c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {item.id}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.category}</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Condition required: <strong>{item.conditionNeeded}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706' }}>
                      {item.offeringPrice}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', fontWeight: 700 }}>
                      ⚡ {item.matchCount} nearby collector matches
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #fef3c7' }}>
                  <Badge variant="warning">{item.status}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert(`Showing ${item.matchCount} matched collector lots (Demo)`)}
                  >
                    View Matched Collector Lots
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Available Reusable Components Preview */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Available Reusable Lots from Collectors</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Items collected locally that pass initial visual inspection:
              </p>
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>2x HP/Dell 15.6" Slim LED Panels</h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Collector: Ramesh K. (2.1 km away)</p>
                </div>
                <Badge variant="success">Uncracked</Badge>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: 700, marginBottom: '0.75rem' }}>
                Est. Price: ₹450 / panel
              </p>
              <Button variant="accent" size="sm" fullWidth onClick={() => alert('Offer submitted to Ramesh K.')}>
                Make Offer to Collector
              </Button>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Inverter Copper Transformer (800VA)</h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Collector: Anil S. (3.4 km away)</p>
                </div>
                <Badge variant="warning">Untested</Badge>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: 700, marginBottom: '0.75rem' }}>
                Est. Price: ₹380
              </p>
              <Button variant="accent" size="sm" fullWidth onClick={() => alert('Offer submitted to Anil S.')}>
                Make Offer to Collector
              </Button>
            </Card>
          </div>
        </div>

        {/* Modal: Post New Wanted Item */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(null)}
          title="Post Wanted Component (पार्ट्स की मांग)"
        >
          <form onSubmit={handleAddWanted}>
            <Input
              label="Component Name / Part Type"
              placeholder="e.g. Dell Inspiron 15 Motherboard (8th Gen)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
            />
            <Input
              label="Offering Price or Budget"
              placeholder="e.g. ₹600 - ₹1,000 / piece"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
            <Button type="submit" variant="accent" fullWidth style={{ marginTop: '1rem' }}>
              Broadcast to Collectors (मांग पोस्ट करें)
            </Button>
          </form>
        </Modal>
      </PageContainer>
    </div>
  );
};

export default RepairShopDashboard;
