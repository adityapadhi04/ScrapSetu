import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Recycle, 
  Store, 
  IndianRupee, 
  ShieldCheck, 
  FileText, 
  Database, 
  Cpu, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  Search,
  Download,
  LayoutDashboard,
  Layers,
  Sliders,
  DollarSign,
  Package,
  FileCheck,
  BarChart3,
  Settings,
  ArrowRight,
  Menu,
  X,
  MapPin,
  Phone,
  QrCode,
  LogOut
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import AccountSwitcher from '../../components/common/AccountSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState, StatusIndicator } from '../../components/common/FeedbackStates';
import { 
  CORE_MATERIAL_GROUPS, 
  MOCK_ADMIN_METRICS, 
  MOCK_ADMIN_COLLECTORS,
  MOCK_ADMIN_REPAIR_SHOPS,
  MOCK_ADMIN_RECYCLERS,
  MOCK_ADMIN_LOTS,
  MOCK_ADMIN_TRACEABILITY_LOGS,
  MOCK_RECENT_TRANSACTIONS, 
  MOCK_VERIFICATION_QUEUE 
} from '../../data/mockData';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();
  // Sidebar navigation sections:
  // 'dashboard', 'collectors', 'repair-shops', 'recyclers', 'materials', 'prices', 'lots', 'transactions', 'traceability', 'analytics', 'settings'
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Materials & Price Editing State
  const [materials, setMaterials] = useState(CORE_MATERIAL_GROUPS);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Verification queue state
  const [verificationQueue, setVerificationQueue] = useState(MOCK_VERIFICATION_QUEUE);

  const sidebarItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'collectors', label: t('collectors'), icon: Users, count: MOCK_ADMIN_COLLECTORS.length },
    { id: 'repair-shops', label: t('repairShops'), icon: Store, count: MOCK_ADMIN_REPAIR_SHOPS.length },
    { id: 'recyclers', label: t('recyclers'), icon: Recycle, count: MOCK_ADMIN_RECYCLERS.length },
    { id: 'materials', label: t('materials'), icon: Layers, count: materials.length },
    { id: 'prices', label: t('prices'), icon: DollarSign },
    { id: 'lots', label: t('lots'), icon: Package, count: MOCK_ADMIN_LOTS.length },
    { id: 'transactions', label: t('transactions'), icon: FileText, count: MOCK_RECENT_TRANSACTIONS.length },
    { id: 'traceability', label: t('traceability'), icon: QrCode },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleUpdatePrice = (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setMaterials(materials.map((m) => (m.id === editingMaterial.id ? editingMaterial : m)));
    setEditingMaterial(null);
  };

  const handleApproveVerification = (id, name) => {
    setVerificationQueue(verificationQueue.filter((v) => v.id !== id));
    alert(`Entity "${name}" has been verified and granted CPCB platform access. (Demo)`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Top Header */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0.85rem 1.5rem', position: 'sticky', top: 0, zIndex: 90 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile/Tablet Sidebar Toggle Button */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="btn btn-outline"
              style={{ padding: '6px 10px', minHeight: '36px', display: 'inline-flex' }}
              aria-label="Toggle navigation menu"
            >
              {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
              <span style={{ fontSize: '0.78rem', marginLeft: '4px', display: 'none' }}>Menu</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  ScrapSetu Platform Governance
                </h1>
                <Badge variant="neutral">Admin Portal</Badge>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                SIH26229 • CPCB E-Waste Compliance Oversight • Traceability Ledger
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={() => alert('CPCB EPR Compliance Ledger exported (Demo CSV)')}
            >
              Export CPCB Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ShieldCheck}
              onClick={() => alert('Platform audit check: All benchmark rates within ±15% tolerance. (Demo)')}
            >
              Compliance Audit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Admin Body with Desktop Sidebar */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Desktop Sidebar */}
        <aside
          className={`app-sidebar ${mobileSidebarOpen ? 'open' : ''}`}
          style={{
            width: '240px',
            flexShrink: 0,
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '1.25rem 0.75rem',
            display: mobileSidebarOpen ? 'flex' : undefined
          }}
          aria-label="Admin Navigation"
        >
          <div style={{ padding: '0 0.5rem 0.75rem 0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Governance Menu
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#f0fdf4' : 'transparent',
                    color: isActive ? '#15803d' : '#475569',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={18} color={isActive ? '#15803d' : '#64748b'} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '99px',
                        background: isActive ? '#dcfce7' : '#f1f5f9',
                        color: isActive ? '#166534' : '#64748b'
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* LOWER-LEFT: Account Switcher section */}
          <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', paddingLeft: '4px' }}>
              {t('currentAccount')}
            </div>
            <AccountSwitcher dropup={true} />
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '1.5rem', overflowX: 'hidden' }}>
          {/* =========================================================================
              VIEW 1: DASHBOARD
              ========================================================================= */}
          {activeSection === 'dashboard' && (
            <div>
              {/* Summary Cards */}
              <div className="grid-cols-4" style={{ marginBottom: '1.75rem', gap: '1rem' }}>
                <Card interactive onClick={() => setActiveSection('collectors')} style={{ borderLeft: '4px solid #15803d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Collectors
                    </span>
                    <Users size={18} color="#15803d" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
                    {MOCK_ADMIN_METRICS.totalCollectors}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                    ↑ 18 registered this week
                  </span>
                </Card>

                <Card interactive onClick={() => setActiveSection('repair-shops')} style={{ borderLeft: '4px solid #d97706' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Repair Shops
                    </span>
                    <Store size={18} color="#d97706" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
                    {MOCK_ADMIN_METRICS.totalRepairShops}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                    Circular reuse partners
                  </span>
                </Card>

                <Card interactive onClick={() => setActiveSection('recyclers')} style={{ borderLeft: '4px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Recyclers
                    </span>
                    <Recycle size={18} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
                    {MOCK_ADMIN_METRICS.totalRecyclers}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                    Authorized Facilities
                  </span>
                </Card>

                <Card interactive onClick={() => setActiveSection('transactions')} style={{ borderLeft: '4px solid #7c3aed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Transactions
                    </span>
                    <IndianRupee size={18} color="#7c3aed" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
                    {MOCK_ADMIN_METRICS.totalTransactions}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
                    {MOCK_ADMIN_METRICS.totalPayouts} total payouts
                  </span>
                </Card>
              </div>

              {/* Section: Recent Transactions */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Transactions</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveSection('transactions')}>
                    View All Transactions →
                  </Button>
                </div>

                <Card style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Txn ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Collector</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Buyer Entity</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Material & Weight</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_RECENT_TRANSACTIONS.map((t) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>{t.id}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t.collector}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{t.buyer}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{t.material}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>{t.amount}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <Badge variant={t.status.includes('Completed') ? 'success' : 'warning'}>
                                {t.status}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>{t.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Sections: Recycler & Repair Shop Verification Queue */}
              <div className="grid-cols-2" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
                {/* Recycler Verification */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recycler Verification</h2>
                    <Badge variant="info">CPCB Queue</Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {verificationQueue.filter((v) => v.type === 'Recycler').map((item) => (
                      <Card key={item.id} style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{item.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{item.regDoc}</p>
                            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                              ⏳ {item.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                          <Button variant="outline" size="sm" onClick={() => alert(`Reviewing documents for ${item.name}`)}>
                            Review Docs
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => handleApproveVerification(item.id, item.name)}>
                            Approve Facility
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Repair Shop Verification */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Repair Shop Verification</h2>
                    <Badge variant="warning">Trade License</Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {verificationQueue.filter((v) => v.type === 'Repair Shop').map((item) => (
                      <Card key={item.id} style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{item.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{item.regDoc}</p>
                            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                              ⏳ {item.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                          <Button variant="outline" size="sm" onClick={() => alert(`Inspecting trade permit for ${item.name}`)}>
                            Verify Permit
                          </Button>
                          <Button variant="accent" size="sm" onClick={() => handleApproveVerification(item.id, item.name)}>
                            Enroll Shop
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Overview & Material Overview */}
              <div className="grid-cols-2" style={{ gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Price Overview (Benchmark Bands)</h2>
                    <Button variant="ghost" size="sm" onClick={() => setActiveSection('prices')}>
                      Edit Prices →
                    </Button>
                  </div>
                  <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {materials.slice(0, 4).map((m) => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                          <div>
                            <strong style={{ fontSize: '0.88rem', display: 'block' }}>{m.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#15803d' }}>{m.vernacularName}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{m.benchmarkPrice}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>{m.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Material Overview (Hazard Tiers)</h2>
                    <Button variant="ghost" size="sm" onClick={() => setActiveSection('materials')}>
                      Full Catalog →
                    </Button>
                  </div>
                  <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {materials.slice(0, 4).map((m) => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                          <div>
                            <strong style={{ fontSize: '0.88rem', display: 'block' }}>{m.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.category}</span>
                          </div>
                          <Badge variant={m.hazardLevel === 'High' ? 'danger' : m.hazardLevel === 'Medium' ? 'warning' : 'neutral'}>
                            {m.hazardLevel} Hazard
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: COLLECTORS
              ========================================================================= */}
          {activeSection === 'collectors' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📱 Registered Informal Collectors</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Grassroot waste aggregators onboarded onto the ScrapSetu formal value chain
                  </p>
                </div>
                <Badge variant="success">1,248 Active in Mumbai Region</Badge>
              </div>

              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Collector Name</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Operating Area</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Phone</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Lots Submitted</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Rating</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Total Payout</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_ADMIN_COLLECTORS.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>{c.id}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{c.area}</td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>{c.phone}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{c.lotsSubmitted} lots</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#d97706', fontWeight: 700 }}>{c.rating}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#15803d' }}>{c.payoutTotal}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <Badge variant="success">{c.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: REPAIR SHOPS
              ========================================================================= */}
          {activeSection === 'repair-shops' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🔧 Enrolled Repair Shops (Parts Salvage Hubs)</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Repair enterprises prioritizing salvageable chips, RAM, and displays over raw destruction
                  </p>
                </div>
                <Badge variant="warning">86 Enrolled Shops</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {MOCK_ADMIN_REPAIR_SHOPS.map((shop) => (
                  <Card key={shop.id} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {shop.id}
                          </span>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{shop.shopName}</h3>
                          <Badge variant={shop.status.includes('Verified') ? 'success' : 'warning'}>
                            {shop.status}
                          </Badge>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                          Owner: <strong>{shop.owner}</strong> • Location: <strong>{shop.location}</strong> • License: {shop.licenseNo}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Active Wanted: <strong>{shop.activeWantedItems}</strong> • Salvage Purchases: <strong>{shop.salvagePurchases}</strong>
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: RECYCLERS
              ========================================================================= */}
          {activeSection === 'recyclers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>♻️ Authorized E-Waste Recyclers</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    CPCB and State Pollution Control Board authorized formal high-grade processing plants
                  </p>
                </div>
                <Badge variant="info">42 Facilities Authorized</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {MOCK_ADMIN_RECYCLERS.map((r) => (
                  <Card key={r.id} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {r.id}
                          </span>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{r.name}</h3>
                          <Badge variant={r.status.includes('Authorized') ? 'success' : 'warning'}>
                            {r.status}
                          </Badge>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                          CPCB Reg No: <strong>{r.cpcbNumber}</strong> • Location: <strong>{r.location}</strong>
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                          Capacity: {r.processingCapacity} • Active Dispatch Pickups: {r.activePickups}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 5: MATERIALS
              ========================================================================= */}
          {activeSection === 'materials' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📦 Material Catalog (8 Core E-Waste Groups)</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Standardized scrap classifications for AI computer vision identification and fair pricing
                  </p>
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                {materials.map((m) => (
                  <Card key={m.id} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{m.name}</h3>
                        <span style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 700 }}>
                          {m.vernacularName}
                        </span>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                          Category: <strong>{m.category}</strong>
                        </p>
                      </div>
                      <Badge variant={m.hazardLevel === 'High' ? 'danger' : m.hazardLevel === 'Medium' ? 'warning' : 'neutral'}>
                        {m.hazardLevel} Hazard
                      </Badge>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.5rem', lineHeight: 1.4 }}>
                      {m.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Benchmark Price Band:</span>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                        {m.benchmarkPrice} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.unit}</span>
                      </strong>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 6: PRICES
              ========================================================================= */}
          {activeSection === 'prices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>💰 Price Governance & Benchmark Rate Bands</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Regulated price boundaries that protect informal collectors from intermediary exploitation
                  </p>
                </div>

                <div style={{ width: '260px' }}>
                  <Input
                    placeholder="Search material rate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '0.85rem 1.25rem' }}>Material Category</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Vernacular Name</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Hazard Level</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Benchmark Rate Band</th>
                        <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map((mat) => (
                        <tr key={mat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>{mat.name}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#15803d', fontWeight: 600 }}>{mat.vernacularName}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <Badge variant={mat.hazardLevel === 'High' ? 'danger' : mat.hazardLevel === 'Medium' ? 'warning' : 'neutral'}>
                              {mat.hazardLevel}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                            {mat.benchmarkPrice} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{mat.unit}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <Button variant="outline" size="sm" icon={Edit} onClick={() => setEditingMaterial(mat)}>
                              Edit Rate
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              VIEW 7: LOTS
              ========================================================================= */}
          {activeSection === 'lots' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📑 Aggregated Collector Scrap Lots</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Real-time oversight of lots aggregated across Mumbai urban clusters
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {MOCK_ADMIN_LOTS.map((lot) => (
                  <Card key={lot.id} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {lot.id}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{lot.material}</h3>
                          <Badge variant={lot.status.includes('Completed') ? 'success' : lot.status.includes('Hazardous') ? 'danger' : 'warning'}>
                            {lot.status}
                          </Badge>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                          Collector: <strong>{lot.collector}</strong> • Weight: <strong>{lot.weight}</strong>
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Matched Buyer: <strong>{lot.buyer}</strong>
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Benchmark Range</span>
                        <span style={{ fontSize: '0.9rem', color: '#475569' }}>{lot.benchmarkRange}</span>
                        <strong style={{ fontSize: '1.2rem', color: '#15803d', display: 'block' }}>{lot.finalAmount}</strong>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 8: TRANSACTIONS
              ========================================================================= */}
          {activeSection === 'transactions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📄 Financial Settlement & Payout Ledger</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Immutable digital records of payments disbursed to informal collectors
                  </p>
                </div>
              </div>

              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Txn ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Lot Ref</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Collector (Beneficiary)</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Buyer Entity</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Material & Weight</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_RECENT_TRANSACTIONS.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>{t.id}</td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#64748b' }}>{t.lotId}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{t.collector}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{t.buyer}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>{t.material}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>{t.amount}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <Badge variant={t.status.includes('Completed') ? 'success' : 'warning'}>
                              {t.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>{t.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              VIEW 9: TRACEABILITY
              ========================================================================= */}
          {activeSection === 'traceability' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🔗 Chain-of-Custody & CPCB Traceability Trail</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Verifiable digital manifests tracking scrap from street collector to authorized recycling/reuse
                  </p>
                </div>
                <Badge variant="info">EPR Compliant Hash Trail</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {MOCK_ADMIN_TRACEABILITY_LOGS.map((log) => (
                  <Card key={log.traceId} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {log.traceId}
                          </span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{log.material} ({log.weight})</h3>
                          <Badge variant="success">{log.complianceStatus}</Badge>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
                          <div>Origin: <strong>{log.originCollector}</strong></div>
                          <div>Destination: <strong>{log.destinationFacility}</strong></div>
                          <div style={{ fontFamily: 'monospace', color: '#0284c7' }}>QR Hash: {log.qrHash}</div>
                          <div>EPR Credit Generated: <strong style={{ color: '#15803d' }}>{log.eprCreditGenerated}</strong></div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Logged Timestamp</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{log.timestamp}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 10: ANALYTICS (CLEAN PROTOTYPE PLACEHOLDER)
              ========================================================================= */}
          {activeSection === 'analytics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📈 Regional E-Waste Flow & Impact Analytics</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Aggregated circular metrics and formalization impact (Planned for Module 10)
                  </p>
                </div>
                <Badge variant="neutral">Prototype Preview</Badge>
              </div>

              <div className="grid-cols-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <Card>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Diverted from Landfill
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                    48.6 Metric Tons
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Across Mumbai metropolitan area</span>
                </Card>

                <Card>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Circular Reuse Rate
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                    28.4%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Diverted to repair shops before smelting</span>
                </Card>

                <Card>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Average Collector Income Increase
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                    +34%
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>vs informal middleman rates</span>
                </Card>
              </div>

              <Card style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', border: '2px dashed #cbd5e1' }}>
                <BarChart3 size={44} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>Deep Analytics Engine Coming in Future Module</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '520px', margin: '0 auto' }}>
                  Full multi-dimensional time-series graphs, geospatial aggregation maps, and carbon offset calculations will be integrated during Module 10.
                </p>
              </Card>
            </div>
          )}

          {/* =========================================================================
              VIEW 11: SETTINGS
              ========================================================================= */}
          {activeSection === 'settings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>⚙️ Platform Governance Settings</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    CPCB compliance thresholds, algorithmic fair price guards, and system parameters
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '780px' }}>
                <Card style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Fair Price Tolerance Guard</h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Bids below the lower benchmark bound by more than 15% are flagged for predatory pricing against collectors.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge variant="success">Active (Tolerance ±15%)</Badge>
                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>Rule enforces automatic fair compensation.</span>
                  </div>
                </Card>

                <Card style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Vernacular SMS & Voice Guide Gateway</h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Sends instant vernacular SMS and automated audio payment confirmations to informal collectors.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge variant="info">Languages: Hindi, Marathi, English</Badge>
                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>Connected via mock gateway</span>
                  </div>
                </Card>

                <Card style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>CPCB EPR Registration Linkage</h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Validates recycler EPR registration credentials against Central Pollution Control Board registry.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge variant="success">CPCB API Interface Ready</Badge>
                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>Auth Protocol: SIH26229 Demo Portal</span>
                  </div>
                </Card>

                {/* Session & Logout Control Card */}
                <Card style={{ padding: '1.25rem', border: '1px solid #fecaca', background: '#fff5f5' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', color: '#b91c1c' }}>
                    Session & Account Control
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#7f1d1d', marginBottom: '0.85rem' }}>
                    Sign out of the Administrator governance dashboard and return to the login screen.
                  </p>
                  <button
                    id="admin-logout-button"
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
                  >
                    <LogOut size={16} />
                    <span>{t('logout')}</span>
                  </button>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Edit Benchmark Rate */}
      <Modal
        isOpen={!!editingMaterial}
        onClose={() => setEditingMaterial(null)}
        title={`Edit Benchmark Rate: ${editingMaterial?.name}`}
      >
        {editingMaterial && (
          <form onSubmit={handleUpdatePrice}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Updating baseline rate for <strong>{editingMaterial.vernacularName}</strong>. This adjusts real-time fair price estimates across all informal collector dashboards.
            </p>
            <Input
              label="Benchmark Rate Band"
              value={editingMaterial.benchmarkPrice}
              onChange={(e) =>
                setEditingMaterial({ ...editingMaterial, benchmarkPrice: e.target.value })
              }
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.25rem' }}>
              <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Benchmark Rate
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
