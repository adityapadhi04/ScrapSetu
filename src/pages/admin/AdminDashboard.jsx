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
import { 
  getMaterialRecords, 
  getDatasetStats, 
  getDatasetMetadata 
} from '../../services/materialDatasetService';
import { 
  getPriceRecords, 
  getPriceDatasetStats, 
  getPriceDatasetMetadata 
} from '../../services/priceDatasetService';
import { 
  getRecyclers, 
  getRecyclerDatasetStats 
} from '../../services/recyclerService';
import { 
  getOffers, 
  getOfferStats 
} from '../../services/offerService';
import {
  getTransactions,
  getTransactionStats
} from '../../services/transactionService';
import {
  getHandovers,
  getHandoverStats
} from '../../services/handoverService';
import {
  getPayments,
  getPaymentStats
} from '../../services/paymentService';
import { getScrapLots } from '../../services/scrapLotService';


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

  // Material Dataset State (Module 4)
  const [datasetRecords, setDatasetRecords] = useState(() => getMaterialRecords());
  const [selectedRecordJson, setSelectedRecordJson] = useState(null);
  const [datasetFilterCategory, setDatasetFilterCategory] = useState('ALL');
  const [datasetSearchTerm, setDatasetSearchTerm] = useState('');

  // Price Dataset State (Module 5)
  const [priceRecords, setPriceRecords] = useState(() => getPriceRecords());
  const [selectedPriceJson, setSelectedPriceJson] = useState(null);
  const [priceFilterMaterial, setPriceFilterMaterial] = useState('ALL');
  const [priceFilterSource, setPriceFilterSource] = useState('ALL');
  const [priceFilterLocation, setPriceFilterLocation] = useState('ALL');
  const [priceSearchTerm, setPriceSearchTerm] = useState('');

  // Recycler Dataset State (Module 7)
  const [recyclerRecords, setRecyclerRecords] = useState(() => getRecyclers());
  const [selectedRecyclerJson, setSelectedRecyclerJson] = useState(null);
  const [recyclerFilterMaterial, setRecyclerFilterMaterial] = useState('ALL');
  const [recyclerFilterCity, setRecyclerFilterCity] = useState('ALL');
  const [recyclerFilterStatus, setRecyclerFilterStatus] = useState('ALL');
  const [recyclerSearchTerm, setRecyclerSearchTerm] = useState('');

  // Offer Dataset State (Module 8)
  const [offerRecords, setOfferRecords] = useState(() => getOffers());
  const [selectedOfferJson, setSelectedOfferJson] = useState(null);
  const [offerFilterRole, setOfferFilterRole] = useState('ALL');
  const [offerFilterMaterial, setOfferFilterMaterial] = useState('ALL');
  const [offerFilterStatus, setOfferFilterStatus] = useState('ALL');
  const [offerSearchTerm, setOfferSearchTerm] = useState('');

  // Transaction Dataset State (Module 9)
  const [txnRecords, setTxnRecords] = useState(() => getTransactions());
  const [txnSearchTerm, setTxnSearchTerm] = useState('');
  const [txnFilterStatus, setTxnFilterStatus] = useState('ALL');
  const [txnFilterBuyerRole, setTxnFilterBuyerRole] = useState('ALL');
  const [txnFilterPaymentStatus, setTxnFilterPaymentStatus] = useState('ALL');
  const txnStats = getTransactionStats();
  const handoverStats = getHandoverStats();
  const paymentStats = getPaymentStats();

  const sidebarItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'collectors', label: t('collectors'), icon: Users, count: MOCK_ADMIN_COLLECTORS.length },
    { id: 'repair-shops', label: t('repairShops'), icon: Store, count: MOCK_ADMIN_REPAIR_SHOPS.length },
    { id: 'recyclers', label: t('recyclers'), icon: Recycle, count: MOCK_ADMIN_RECYCLERS.length },
    { id: 'materials', label: t('materials'), icon: Layers, count: materials.length },
    { id: 'prices', label: t('prices'), icon: DollarSign },
    { id: 'lots', label: t('lots'), icon: Package, count: MOCK_ADMIN_LOTS.length },
    { id: 'material-dataset', label: t('materialDataset'), icon: Database, count: datasetRecords.length },
    { id: 'price-dataset', label: t('priceDataset'), icon: IndianRupee, count: priceRecords.length },
    { id: 'recycler-dataset', label: t('recyclerDataset'), icon: Recycle, count: recyclerRecords.length },
    { id: 'offers-dataset', label: t('offersDataset'), icon: DollarSign, count: offerRecords.length },
    { id: 'transactions', label: t('transactions'), icon: FileText, count: txnRecords.length },
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

  const datasetStats = getDatasetStats();
  const datasetMetadata = getDatasetMetadata();

  const filteredDatasetRecords = datasetRecords.filter((r) => {
    const matchesCat = datasetFilterCategory === 'ALL' || r.materialCategory === datasetFilterCategory;
    const matchesSearch = !datasetSearchTerm.trim() || 
      (r.materialId && r.materialId.toLowerCase().includes(datasetSearchTerm.toLowerCase())) ||
      (r.lotId && r.lotId.toLowerCase().includes(datasetSearchTerm.toLowerCase())) ||
      (r.collectorId && r.collectorId.toLowerCase().includes(datasetSearchTerm.toLowerCase())) ||
      (r.materialSubcategory && r.materialSubcategory.toLowerCase().includes(datasetSearchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const priceStats = getPriceDatasetStats();
  const priceMetadata = getPriceDatasetMetadata();

  const filteredPriceRecords = priceRecords.filter((r) => {
    const matchesMat = priceFilterMaterial === 'ALL' || r.materialCategory === priceFilterMaterial;
    const matchesSource = priceFilterSource === 'ALL' || r.sourceType === priceFilterSource;
    const matchesLoc = priceFilterLocation === 'ALL' || 
      (typeof r.location === 'object' && (r.location.area === priceFilterLocation || r.location.city === priceFilterLocation)) ||
      (typeof r.location === 'string' && r.location === priceFilterLocation);
    const matchesSearch = !priceSearchTerm.trim() ||
      (r.priceId && r.priceId.toLowerCase().includes(priceSearchTerm.toLowerCase())) ||
      (r.lotId && r.lotId.toLowerCase().includes(priceSearchTerm.toLowerCase())) ||
      (r.materialId && r.materialId.toLowerCase().includes(priceSearchTerm.toLowerCase())) ||
      (r.materialCategory && r.materialCategory.toLowerCase().includes(priceSearchTerm.toLowerCase())) ||
      (r.materialSubcategory && r.materialSubcategory.toLowerCase().includes(priceSearchTerm.toLowerCase())) ||
      (typeof r.location === 'object' && ((r.location.area && r.location.area.toLowerCase().includes(priceSearchTerm.toLowerCase())) || (r.location.city && r.location.city.toLowerCase().includes(priceSearchTerm.toLowerCase()))));
    return matchesMat && matchesSource && matchesLoc && matchesSearch;
  });

  const recyclerStats = getRecyclerDatasetStats();

  const filteredRecyclerRecords = recyclerRecords.filter((r) => {
    const matchesMat = recyclerFilterMaterial === 'ALL' || (r.acceptedMaterials || []).some((m) =>
      m.toLowerCase().includes(recyclerFilterMaterial.toLowerCase()) || recyclerFilterMaterial.toLowerCase().includes(m.toLowerCase())
    );
    const matchesCity = recyclerFilterCity === 'ALL' ||
      (r.address?.city && r.address.city.toLowerCase() === recyclerFilterCity.toLowerCase()) ||
      (r.operatingAreas || []).some((op) => op.toLowerCase() === recyclerFilterCity.toLowerCase());
    const matchesStatus = recyclerFilterStatus === 'ALL' || r.status === recyclerFilterStatus;
    const matchesSearch = !recyclerSearchTerm.trim() ||
      (r.recyclerId && r.recyclerId.toLowerCase().includes(recyclerSearchTerm.toLowerCase())) ||
      (r.businessName && r.businessName.toLowerCase().includes(recyclerSearchTerm.toLowerCase())) ||
      (r.contactName && r.contactName.toLowerCase().includes(recyclerSearchTerm.toLowerCase())) ||
      (r.authorizationNumber && r.authorizationNumber.toLowerCase().includes(recyclerSearchTerm.toLowerCase())) ||
      (r.address?.city && r.address.city.toLowerCase().includes(recyclerSearchTerm.toLowerCase()));
    return matchesMat && matchesCity && matchesStatus && matchesSearch;
  });

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
              VIEW: MATERIAL DATASET (SIH Foundation - Module 4)
              ========================================================================= */}
          {activeSection === 'material-dataset' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                      📊 {t('materialDataset')}
                    </h2>
                    <Badge variant="success">v{datasetMetadata.datasetVersion}</Badge>
                    <Badge variant="neutral">SIH Structured Dataset</Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', marginBottom: 0 }}>
                    {t('materialDatasetSubtitle')} • {datasetMetadata.source}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datasetRecords, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "scrapsetu_material_dataset.json");
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                  >
                    Export JSON
                  </Button>
                </div>
              </div>

              {/* SIH Limitations & Methodology Disclaimer */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                  fontSize: '0.82rem',
                  color: '#475569',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  <AlertCircle size={15} color="#0284c7" />
                  <span>SIH Dataset Provenance & Limitations Notice:</span>
                </div>
                <div>{t('datasetLimitations')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  <strong>Collection Method:</strong> {datasetMetadata.collectionMethod} | <strong>Price Estimation:</strong> Integrated via Module 5 Price Intelligence layer.
                </div>
              </div>

              {/* Metric KPI Cards */}
              <div className="grid-cols-4" style={{ marginBottom: '1.75rem', gap: '1rem' }}>
                <Card style={{ borderLeft: '4px solid #0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('totalRecords')}
                    </span>
                    <Database size={18} color="#0f172a" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
                    {datasetStats.totalRecords}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Sequential MAT IDs
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #15803d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('aiAssistedRecords')}
                    </span>
                    <Cpu size={18} color="#15803d" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#15803d' }}>
                    {datasetStats.aiAssistedCount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                    {datasetStats.totalRecords > 0 ? Math.round((datasetStats.aiAssistedCount / datasetStats.totalRecords) * 100) : 0}% of submissions
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('manualRecords')}
                    </span>
                    <Users size={18} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7' }}>
                    {datasetStats.manualCount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                    Human overrides / manual
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #7c3aed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('confirmedRecords')}
                    </span>
                    <CheckCircle2 size={18} color="#7c3aed" />
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7c3aed' }}>
                    {datasetStats.confirmedCount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
                    {datasetStats.confirmedRate}% verification rate
                  </span>
                </Card>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by MAT ID, Lot ID, Collector ID..."
                    value={datasetSearchTerm}
                    onChange={(e) => setDatasetSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={datasetFilterCategory}
                  onChange={(e) => setDatasetFilterCategory(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="PCB">PCB</option>
                  <option value="Cable">Cable</option>
                  <option value="Battery">Battery</option>
                  <option value="Motor">Motor</option>
                  <option value="LCD / Display">LCD / Display</option>
                  <option value="Mobile Phone">Mobile Phone</option>
                  <option value="Laptop / Computer">Laptop / Computer</option>
                  <option value="Other E-waste">Other E-waste</option>
                </select>
              </div>

              {/* Table Card */}
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Material ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Lot ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Collector ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Subcategory</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Weight</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Condition</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Method</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Confidence</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Confirmed</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Created At</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDatasetRecords.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No material dataset records match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDatasetRecords.map((r) => (
                          <tr key={r.materialId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7' }}>
                              {r.materialId}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#475569' }}>
                              {r.lotId}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                              {r.collectorId}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                              {r.materialCategory}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                              {r.materialSubcategory || '—'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                              {r.approximateWeight} {r.weightUnit}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize' }}>
                              {r.condition}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: r.identificationMethod === 'demo_ai' ? '#dcfce7' : '#f1f5f9',
                                  color: r.identificationMethod === 'demo_ai' ? '#15803d' : '#475569'
                                }}
                              >
                                {r.identificationMethod === 'demo_ai' ? '🤖 AI-Assisted' : '👤 Manual'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              {r.confidenceScore !== null && r.confidenceScore !== undefined ? `${Math.round(r.confidenceScore * 100)}%` : '—'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: r.collectorConfirmed ? '#dcfce7' : '#fee2e2',
                                  color: r.collectorConfirmed ? '#166534' : '#991b1b'
                                }}
                              >
                                {r.collectorConfirmed ? '✓ Yes' : 'No'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                              {new Date(r.createdAt).toLocaleString()}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedRecordJson(r)}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#0284c7',
                                  cursor: 'pointer'
                                }}
                              >
                                JSON
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Modal to view complete structured JSON record */}
              <Modal
                isOpen={!!selectedRecordJson}
                onClose={() => setSelectedRecordJson(null)}
                title={`SIH Dataset Record: ${selectedRecordJson?.materialId}`}
              >
                {selectedRecordJson && (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      Structured SIH Material Dataset JSON entity generated from collector activity.
                    </p>
                    <pre
                      style={{
                        background: '#0f172a',
                        color: '#38bdf8',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        overflowX: 'auto',
                        maxHeight: '400px'
                      }}
                    >
                      {JSON.stringify(selectedRecordJson, null, 2)}
                    </pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <Button variant="primary" size="sm" onClick={() => setSelectedRecordJson(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </Modal>
            </div>
          )}

          {/* =========================================================================
              VIEW 7B: PRICE DATASET (SIH26229 Price Dataset Governance)
              ========================================================================= */}
          {activeSection === 'price-dataset' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                      📊 {t('priceDataset')} (SIH)
                    </h2>
                    <Badge variant="success">v{priceMetadata.datasetVersion}</Badge>
                    <Badge variant="warning">Historical Benchmark + Estimate</Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', marginBottom: 0 }}>
                    {t('priceDatasetSubtitle')} • {priceMetadata.source}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(priceRecords, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "scrapsetu_price_dataset.json");
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                  >
                    Export Price JSON
                  </Button>
                </div>
              </div>

              {/* SIH Limitations & Methodology Disclaimer */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                  fontSize: '0.82rem',
                  color: '#475569',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  <AlertCircle size={15} color="#d97706" />
                  <span>SIH Price Dataset Methodology & Disclaimer:</span>
                </div>
                <div>{t('priceDatasetLimitations')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  <strong>Source Types:</strong> <code>demo_seed</code> (calibrated regional benchmarks) and <code>platform_estimate</code> (collector lot valuations). | <strong>Price Fields:</strong> Distinct separation between <code>estimatedPrice</code>, <code>buyingPrice</code>, <code>quotedPrice</code>, and <code>sellingPrice</code>.
                </div>
              </div>

              {/* 5 Metric KPI Cards */}
              <div className="grid-cols-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.75rem', gap: '1rem' }}>
                <Card style={{ borderLeft: '4px solid #0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('totalRecords')}
                    </span>
                    <Database size={17} color="#0f172a" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                    {priceStats.totalRecords}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Sequential PRICE IDs
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #6366f1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('sourceTypeDemoSeed')}
                    </span>
                    <Clock size={17} color="#6366f1" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366f1' }}>
                    {priceStats.seedCount}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>
                    Historical baseline records
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #15803d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('sourceTypePlatformEstimate')}
                    </span>
                    <IndianRupee size={17} color="#15803d" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d' }}>
                    {priceStats.platformEstimateCount}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                    Live lot estimations
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('materialsCovered')}
                    </span>
                    <Layers size={17} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>
                    {priceStats.materialsCoveredCount}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                    E-waste material types
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('locationsCovered')}
                    </span>
                    <MapPin size={17} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
                    {priceStats.locationsCoveredCount}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                    Odisha regional centers
                  </span>
                </Card>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search PRICE ID, Lot, Material, City..."
                    value={priceSearchTerm}
                    onChange={(e) => setPriceSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={priceFilterMaterial}
                  onChange={(e) => setPriceFilterMaterial(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Materials</option>
                  <option value="Electronic Components">Electronic Components (PCB)</option>
                  <option value="Cables & Wires">Cables & Wires</option>
                  <option value="Batteries">Batteries</option>
                  <option value="Motors & Compressors">Motors & Compressors</option>
                  <option value="Display Units">Display Units</option>
                  <option value="Telecom & Mobile">Telecom & Mobile</option>
                  <option value="IT Equipment">IT Equipment</option>
                </select>

                <select
                  value={priceFilterSource}
                  onChange={(e) => setPriceFilterSource(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Sources</option>
                  <option value="demo_seed">Demo Seed Data</option>
                  <option value="platform_estimate">Platform Estimate</option>
                </select>

                <select
                  value={priceFilterLocation}
                  onChange={(e) => setPriceFilterLocation(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Locations</option>
                  <option value="Gunupur">Gunupur</option>
                  <option value="Rayagada">Rayagada</option>
                  <option value="Berhampur">Berhampur</option>
                  <option value="Bhubaneswar">Bhubaneswar</option>
                </select>
              </div>

              {/* Table Card */}
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Price ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Lot Ref</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Material ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Subcategory</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Est. Price (₹/kg)</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Buying Price</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Quoted Price</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Selling Price</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Source Type</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Recorded At</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPriceRecords.length === 0 ? (
                        <tr>
                          <td colSpan={13} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No price dataset records match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPriceRecords.map((p) => {
                          const locStr = typeof p.location === 'object'
                            ? (p.location.area ? `${p.location.area}, ${p.location.city || ''}` : p.location.city || 'Odisha')
                            : String(p.location || '—');

                          return (
                            <tr key={p.priceId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#d97706' }}>
                                {p.priceId}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#475569' }}>
                                {p.lotId || '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#0284c7' }}>
                                {p.materialId || '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                                {p.materialCategory}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                                {p.materialSubcategory || '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', color: '#334155', fontSize: '0.82rem' }}>
                                📍 {locStr}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#15803d' }}>
                                {p.estimatedPrice !== null && p.estimatedPrice !== undefined ? `₹${p.estimatedPrice}` : '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                                {p.buyingPrice !== null && p.buyingPrice !== undefined ? `₹${p.buyingPrice}` : '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                                {p.quotedPrice !== null && p.quotedPrice !== undefined ? `₹${p.quotedPrice}` : '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                                {p.sellingPrice !== null && p.sellingPrice !== undefined ? `₹${p.sellingPrice}` : '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: p.sourceType === 'demo_seed' ? '#ede9fe' : '#dcfce7',
                                    color: p.sourceType === 'demo_seed' ? '#6d28d9' : '#15803d'
                                  }}
                                >
                                  {p.sourceType === 'demo_seed' ? 'Demo Seed' : 'Platform Est.'}
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                                {new Date(p.recordedAt).toLocaleString()}
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPriceJson(p)}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#d97706',
                                    cursor: 'pointer'
                                  }}
                                >
                                  JSON
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Modal to view complete structured Price JSON record */}
              <Modal
                isOpen={!!selectedPriceJson}
                onClose={() => setSelectedPriceJson(null)}
                title={`SIH Price Record: ${selectedPriceJson?.priceId}`}
              >
                {selectedPriceJson && (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      Structured SIH Price Dataset JSON entity with provenance and pricing distinctions.
                    </p>
                    <pre
                      style={{
                        background: '#0f172a',
                        color: '#fde047',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        overflowX: 'auto',
                        maxHeight: '400px'
                      }}
                    >
                      {JSON.stringify(selectedPriceJson, null, 2)}
                    </pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <Button variant="primary" size="sm" onClick={() => setSelectedPriceJson(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </Modal>
            </div>
          )}

          {/* =========================================================================
              VIEW 7C: RECYCLER DATASET (SIH26229 Authorized Recycler Dataset Governance)
              ========================================================================= */}
          {activeSection === 'recycler-dataset' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                      ♻️ {t('recyclerDataset')} (SIH)
                    </h2>
                    <Badge variant="success">v1.0</Badge>
                    <Badge variant="warning">DEMO DATA (Prototype Verified)</Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', marginBottom: 0 }}>
                    {t('recyclerDatasetSubtitle')} • {recyclerStats.datasetSource}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recyclerRecords, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "scrapsetu_recycler_dataset.json");
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                  >
                    Export Recycler JSON
                  </Button>
                </div>
              </div>

              {/* SIH Limitations & Methodology Disclaimer */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.5rem',
                  fontSize: '0.82rem',
                  color: '#475569',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  <AlertCircle size={15} color="#0284c7" />
                  <span>SIH Recycler Dataset Methodology & Verification Disclaimer:</span>
                </div>
                <div>{t('recyclerDatasetLimitations')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  <strong>Data Safety Notice:</strong> All records are prototype entries tagged with <code>sourceType: "demo_seed"</code> and <code>authorizationType: "Demo Authorization Record"</code>. Never represents actual government accreditation.
                </div>
              </div>

              {/* 4 Metric KPI Cards */}
              <div className="grid-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.75rem', gap: '1rem' }}>
                <Card style={{ borderLeft: '4px solid #0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('totalRecords')}
                    </span>
                    <Database size={17} color="#0f172a" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                    {recyclerStats.totalRecords}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Sequential REC IDs
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #15803d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Active Facilities
                    </span>
                    <CheckCircle2 size={17} color="#15803d" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d' }}>
                    {recyclerStats.activeRecords}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                    Operational recyclers
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Pickup Fleet
                    </span>
                    <Recycle size={17} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>
                    {recyclerStats.pickupAvailableCount}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                    Facilities offering transport
                  </span>
                </Card>

                <Card style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Regional Hubs
                    </span>
                    <MapPin size={17} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
                    {recyclerStats.citiesCovered}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                    Cities & areas covered
                  </span>
                </Card>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search REC ID, Business Name, City, Auth Number..."
                    value={recyclerSearchTerm}
                    onChange={(e) => setRecyclerSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={recyclerFilterMaterial}
                  onChange={(e) => setRecyclerFilterMaterial(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Materials</option>
                  <option value="PCB">PCB / Circuit Boards</option>
                  <option value="Cable">Cable / Copper Wire</option>
                  <option value="Battery">Battery (Lithium / Lead)</option>
                  <option value="Mobile Phone">Mobile Phone</option>
                  <option value="Laptop / Computer">Laptop / Computer</option>
                  <option value="Motor">Motors</option>
                  <option value="Metal Chassis">Metal Chassis</option>
                </select>

                <select
                  value={recyclerFilterCity}
                  onChange={(e) => setRecyclerFilterCity(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Operating Cities</option>
                  <option value="Gunupur">Gunupur</option>
                  <option value="Rayagada">Rayagada</option>
                  <option value="Bhubaneswar">Bhubaneswar</option>
                  <option value="Cuttack">Cuttack</option>
                  <option value="Berhampur">Berhampur</option>
                  <option value="Navi Mumbai">Navi Mumbai</option>
                  <option value="Mumbai">Mumbai</option>
                </select>

                <select
                  value={recyclerFilterStatus}
                  onChange={(e) => setRecyclerFilterStatus(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Table Card */}
              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '0.85rem 1rem' }}>Recycler ID</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Business Name</th>
                        <th style={{ padding: '0.85rem 1rem' }}>City / Hub</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Accepted Materials</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Pickup</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Min Lot</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Verification Record</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Auth Number</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Source Type</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecyclerRecords.length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No recycler dataset records match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRecyclerRecords.map((r) => (
                          <tr key={r.recyclerId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7' }}>
                              {r.recyclerId}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                              {r.businessName}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                              📍 {r.address?.city}, {r.address?.state}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.8rem' }}>
                              {r.acceptedMaterials?.join(' • ')}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: r.pickupAvailable ? '#15803d' : '#64748b' }}>
                                {r.pickupAvailable ? '🚚 Yes' : '🏢 Drop-off'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                              {r.minimumWeightKg} kg
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px' }}>
                                {r.verificationStatus}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
                              {r.authorizationNumber}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: r.sourceType === 'demo_seed' ? '#ede9fe' : '#dcfce7',
                                  color: r.sourceType === 'demo_seed' ? '#6d28d9' : '#15803d'
                                }}
                              >
                                {r.sourceType === 'demo_seed' ? 'DEMO DATA' : 'Registered'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: r.status === 'active' ? '#15803d' : '#dc2626' }}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedRecyclerJson(r)}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#0284c7',
                                  cursor: 'pointer'
                                }}
                              >
                                JSON
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Modal to view complete structured Recycler JSON record */}
              <Modal
                isOpen={!!selectedRecyclerJson}
                onClose={() => setSelectedRecyclerJson(null)}
                title={`SIH Recycler Record: ${selectedRecyclerJson?.recyclerId}`}
              >
                {selectedRecyclerJson && (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      Structured SIH Recycler Dataset JSON entity with operational parameters and demo verification details.
                    </p>
                    <pre
                      style={{
                        background: '#0f172a',
                        color: '#38bdf8',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        overflowX: 'auto',
                        maxHeight: '400px'
                      }}
                    >
                      {JSON.stringify(selectedRecyclerJson, null, 2)}
                    </pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <Button variant="primary" size="sm" onClick={() => setSelectedRecyclerJson(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </Modal>
            </div>
          )}

          {/* =========================================================================
              VIEW 7D: OFFERS DATASET (Module 8 Offer & Marketplace Governance)
              ========================================================================= */}
          {activeSection === 'offers-dataset' && (() => {
            const offerStats = getOfferStats();
            const filteredOffers = offerRecords.filter((o) => {
              if (offerFilterRole !== 'ALL' && o.buyerRole !== offerFilterRole) return false;
              if (offerFilterMaterial !== 'ALL' && o.materialCategory !== offerFilterMaterial) return false;
              if (offerFilterStatus !== 'ALL' && o.status !== offerFilterStatus) return false;
              if (offerSearchTerm.trim()) {
                const term = offerSearchTerm.toLowerCase().trim();
                const matchId = o.offerId?.toLowerCase().includes(term);
                const matchLot = o.lotId?.toLowerCase().includes(term);
                const matchBuyer = o.buyerName?.toLowerCase().includes(term);
                const matchMat = o.materialCategory?.toLowerCase().includes(term);
                if (!matchId && !matchLot && !matchBuyer && !matchMat) return false;
              }
              return true;
            });

            return (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        💰 {t('offersDataset')}
                      </h2>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px' }}>
                        Module 8 Marketplace Layer
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                      Auditable record of commercial purchase offers submitted by Repair Shops and Authorized Recyclers.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(offerRecords, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", "scrapsetu_offers_dataset.json");
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                    >
                      Export Offers JSON
                    </Button>
                  </div>
                </div>

                {/* Important Platform Governance Disclaimer */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#475569' }}>
                  ℹ️ <strong>Marketplace Governance:</strong> Offers represent expressions of commercial interest. Selecting an offer changes the lot's status to <code>offer_selected</code>. No financial settlements, UPI payments, or physical handovers are finalized in this layer.
                </div>

                {/* Summary Metrics Cards */}
                <div className="grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                  <Card style={{ borderLeft: '4px solid #0284c7' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('allOffersCount')}
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {offerStats.totalOffers}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Across all lots
                    </span>
                  </Card>

                  <Card style={{ borderLeft: '4px solid #16a34a' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('acceptedOffersCount')}
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                      {offerStats.acceptedOffers}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                      Selected by collectors
                    </span>
                  </Card>

                  <Card style={{ borderLeft: '4px solid #d97706' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t('pendingOffersCount')}
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                      {offerStats.submittedOffers}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Awaiting collector review
                    </span>
                  </Card>

                  <Card style={{ borderLeft: '4px solid #7c3aed' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Total Bid Value
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
                      ₹{offerStats.totalValue?.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Repair: {offerStats.repairOffers} • Recycler: {offerStats.recyclerOffers}
                    </span>
                  </Card>
                </div>

                {/* Filters & Search */}
                <Card style={{ padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                        Buyer Role
                      </label>
                      <select
                        value={offerFilterRole}
                        onChange={(e) => setOfferFilterRole(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="ALL">All Buyers (Repair + Recycler)</option>
                        <option value="repair">Repair Shops (Reuse)</option>
                        <option value="recycler">Authorized Recyclers</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                        Status
                      </label>
                      <select
                        value={offerFilterStatus}
                        onChange={(e) => setOfferFilterStatus(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                        Material Category
                      </label>
                      <select
                        value={offerFilterMaterial}
                        onChange={(e) => setOfferFilterMaterial(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="ALL">All Materials</option>
                        <option value="PCB">PCB</option>
                        <option value="Cable">Cable</option>
                        <option value="Battery">Battery</option>
                        <option value="Display / Screen">Display / Screen</option>
                        <option value="Mobile Phone">Mobile Phone</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                        Search Offers
                      </label>
                      <input
                        type="text"
                        placeholder="Search ID, lot, buyer, material..."
                        value={offerSearchTerm}
                        onChange={(e) => setOfferSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </Card>

                {/* Table of Offers */}
                <Card style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Offer ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Lot ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Buyer</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Buyer Role</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Material</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Weight</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Rate (₹/kg)</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Value</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Source</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOffers.length === 0 ? (
                          <tr>
                            <td colSpan="12" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                              No offers match the current filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredOffers.map((o) => {
                            const isAccepted = o.status === 'accepted';
                            const isRejected = o.status === 'rejected';
                            return (
                              <tr key={o.offerId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                                  {o.offerId}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                                  {o.lotId}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                                  {o.buyerName}
                                </td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                  <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: o.buyerRole === 'repair' ? '#fef3c7' : '#e0f2fe', color: o.buyerRole === 'repair' ? '#92400e' : '#0369a1', fontWeight: 700 }}>
                                    {o.buyerRole === 'repair' ? 'Repair' : 'Recycler'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                  {o.materialCategory}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                  {o.weight} {o.weightUnit}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800 }}>
                                  ₹{o.offeredPrice}/kg
                                </td>
                                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900, color: '#15803d' }}>
                                  ₹{o.totalOfferValue?.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '99px',
                                      background: isAccepted ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                                      color: isAccepted ? '#15803d' : isRejected ? '#dc2626' : '#92400e',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    {o.status}
                                  </span>
                                </td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: o.sourceType === 'demo_seed' ? '#6d28d9' : '#15803d' }}>
                                    {o.sourceType === 'demo_seed' ? 'DEMO' : 'User'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                                  {new Date(o.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOfferJson(o)}
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      background: '#ffffff',
                                      color: '#0284c7',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    JSON
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Modal to view complete structured Offer JSON */}
                <Modal
                  isOpen={!!selectedOfferJson}
                  onClose={() => setSelectedOfferJson(null)}
                  title={`Structured Offer Record: ${selectedOfferJson?.offerId || ''}`}
                  maxWidth="640px"
                >
                  {selectedOfferJson && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                            {selectedOfferJson.offerId}
                          </span>
                          <Badge variant={selectedOfferJson.buyerRole === 'repair' ? 'warning' : 'info'}>
                            {selectedOfferJson.buyerRole === 'repair' ? 'Repair Shop Offer' : 'Authorized Recycler Offer'}
                          </Badge>
                          <Badge variant="success">{selectedOfferJson.status}</Badge>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Schema: scrapsetu_offers v1.0.0
                        </span>
                      </div>

                      <pre
                        style={{
                          background: '#0f172a',
                          color: '#e2e8f0',
                          padding: '1rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          maxHeight: '380px',
                          lineHeight: 1.45
                        }}
                      >
                        {JSON.stringify(selectedOfferJson, null, 2)}
                      </pre>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOfferJson(null)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </Modal>
              </div>
            );
          })()}

          {/* =========================================================================
              VIEW 8: TRANSACTIONS
              ========================================================================= */}
          {activeSection === 'transactions' && (() => {
            const filteredTxns = txnRecords.filter((tx) => {
              const matchStatus = txnFilterStatus === 'ALL' || tx.transactionStatus === txnFilterStatus;
              const matchBuyerRole = txnFilterBuyerRole === 'ALL' || tx.buyerRole === txnFilterBuyerRole;
              const matchPaymentStatus = txnFilterPaymentStatus === 'ALL' || tx.paymentStatus === txnFilterPaymentStatus;
              const matchSearch = !txnSearchTerm.trim() ||
                (tx.transactionId && tx.transactionId.toLowerCase().includes(txnSearchTerm.toLowerCase())) ||
                (tx.lotId && tx.lotId.toLowerCase().includes(txnSearchTerm.toLowerCase())) ||
                (tx.offerId && tx.offerId.toLowerCase().includes(txnSearchTerm.toLowerCase())) ||
                (tx.collectorName && tx.collectorName.toLowerCase().includes(txnSearchTerm.toLowerCase())) ||
                (tx.buyerName && tx.buyerName.toLowerCase().includes(txnSearchTerm.toLowerCase())) ||
                (tx.materialCategory && tx.materialCategory.toLowerCase().includes(txnSearchTerm.toLowerCase()));
              return matchStatus && matchBuyerRole && matchPaymentStatus && matchSearch;
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📄 Transaction + Handover + Payment Dataset</h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Module 9 — Live transaction records for CPCB traceability ledger</p>
                  </div>
                  <Badge variant="neutral">{filteredTxns.length} of {txnRecords.length}</Badge>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Total Transactions', value: txnStats.total, color: '#0f172a' },
                    { label: 'Completed', value: txnStats.completed, color: '#15803d' },
                    { label: 'Pending Handovers', value: handoverStats.pending, color: '#d97706' },
                    { label: 'Payments Recorded', value: paymentStats.recorded, color: '#0369a1' },
                    { label: 'Total Recorded Value', value: `₹${(txnStats.totalRecordedValue || 0).toLocaleString('en-IN')}`, color: '#15803d' },
                  ].map(({ label, value, color }) => (
                    <Card key={label} style={{ padding: '0.85rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color }}>{value}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{label}</div>
                    </Card>
                  ))}
                </div>

                {/* Disclaimer */}
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.78rem', color: '#92400e', marginBottom: '1rem', fontWeight: 600 }}>
                  ⚠️ Demo payment records — not real payment processing. No financial settlement has occurred.
                </div>

                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Search TXN ID, LOT, OFR, Collector, Buyer..."
                    value={txnSearchTerm}
                    onChange={(e) => setTxnSearchTerm(e.target.value)}
                    style={{ flex: 1, minWidth: '180px', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  />
                  <select
                    value={txnFilterStatus}
                    onChange={(e) => setTxnFilterStatus(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  >
                    {['ALL','created','handover_pending','payment_pending','completed','cancelled'].map((s) => (
                      <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <select
                    value={txnFilterBuyerRole}
                    onChange={(e) => setTxnFilterBuyerRole(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Buyer Roles</option>
                    <option value="repair">Repair Shop</option>
                    <option value="recycler">Authorized Recycler</option>
                  </select>
                  <select
                    value={txnFilterPaymentStatus}
                    onChange={(e) => setTxnFilterPaymentStatus(e.target.value)}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="recorded">Recorded</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <Card style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                          {['TXN ID', 'LOT / OFR', 'Collector', 'Buyer', 'Material', 'Weight', 'Amount', 'Handover', 'Payment', 'Status'].map((h) => (
                            <th key={h} style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTxns.length === 0 ? (
                          <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No records found</td></tr>
                        ) : filteredTxns.map((tx) => (
                          <tr key={tx.transactionId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.7rem 0.85rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{tx.transactionId}</td>
                            <td style={{ padding: '0.7rem 0.85rem', fontFamily: 'monospace', color: '#64748b', fontSize: '0.76rem' }}>
                              <div>{tx.lotId}</div>
                              <div style={{ color: '#94a3b8' }}>{tx.offerId}</div>
                            </td>
                            <td style={{ padding: '0.7rem 0.85rem', fontWeight: 600 }}>{tx.collectorName || tx.collectorId}</td>
                            <td style={{ padding: '0.7rem 0.85rem' }}>
                              <div>{tx.buyerName}</div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{tx.buyerRole}</div>
                            </td>
                            <td style={{ padding: '0.7rem 0.85rem' }}>{tx.materialCategory}</td>
                            <td style={{ padding: '0.7rem 0.85rem' }}>{tx.weight} {tx.weightUnit}</td>
                            <td style={{ padding: '0.7rem 0.85rem', fontWeight: 800, color: '#0f172a' }}>
                              ₹{(tx.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.7rem 0.85rem' }}>
                              <Badge variant={tx.handoverStatus === 'confirmed' ? 'success' : 'warning'}>
                                {tx.handoverStatus?.replace(/_/g,' ')}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.7rem 0.85rem' }}>
                              <Badge variant={tx.paymentStatus === 'recorded' ? 'success' : 'warning'}>
                                {tx.paymentStatus}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.7rem 0.85rem' }}>
                              <Badge variant={tx.transactionStatus === 'completed' ? 'success' : 'neutral'}>
                                {tx.transactionStatus?.replace(/_/g,' ')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* =========================================================================
              VIEW 9: TRACEABILITY
              ========================================================================= */}
          {activeSection === 'traceability' && (() => {
            const allLots = getScrapLots();
            const materialRecords = getMaterialRecords();
            const allOffers = getOffers();
            const allTxns = getTransactions();
            const allHandovers = getHandovers();
            const allPayments = getPayments();

            // Traceability chains built directly from live lots & transactions
            const chains = allLots.map((lot) => {
              const mat = materialRecords.find((m) => m.lotId === lot.id) || null;
              const acceptedOffer = allOffers.find((o) => o.lotId === lot.id && o.status === 'accepted') ||
                                   allOffers.find((o) => o.lotId === lot.id) || null;
              const txn = allTxns.find((t) => t.lotId === lot.id && t.transactionStatus !== 'cancelled') || null;
              const handover = txn ? (allHandovers.find((h) => h.transactionId === txn.transactionId) || null) : null;
              const payment = txn ? (allPayments.find((p) => p.transactionId === txn.transactionId) || null) : null;

              return {
                lot,
                mat,
                offer: acceptedOffer,
                txn,
                handover,
                payment
              };
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🔗 Chain-of-Custody & CPCB Traceability Trail</h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Complete 6-Stage E-Waste Audit Trail: LOT → MATERIAL → OFFER → TRANSACTION → HANDOVER → PAYMENT
                    </p>
                  </div>
                  <Badge variant="info">CPCB Compliant Audit Trail</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chains.map(({ lot, mat, offer, txn, handover, payment }) => {
                    const isFullyComplete = txn?.transactionStatus === 'completed';

                    return (
                      <Card key={lot.id} style={{ padding: '1.25rem', borderLeft: `4px solid ${isFullyComplete ? '#16a34a' : '#0284c7'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>{lot.id}</span>
                              <Badge variant={isFullyComplete ? 'success' : 'neutral'}>
                                {lot.transactionStatus === 'completed' ? 'Completed Trail ✓' : 'In Progress'}
                              </Badge>
                              <Badge variant="info">{lot.materialCategory || lot.materialType}</Badge>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                              Collector: <strong>{lot.collectorId}</strong> • Weight: <strong>{lot.weight} {lot.weightUnit}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Traceability Stepper */}
                        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Traceability Stages
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {/* LOT */}
                            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>1. LOT</span>
                              <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{lot.id}</strong>
                            </div>

                            <span style={{ color: '#94a3b8' }}>→</span>

                            {/* MATERIAL */}
                            <div style={{ background: mat ? '#ffffff' : '#fef2f2', border: `1px solid ${mat ? '#cbd5e1' : '#fca5a5'}`, borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>2. MATERIAL</span>
                              <strong style={{ fontFamily: 'monospace', color: mat ? '#0f172a' : '#dc2626' }}>
                                {mat ? mat.materialId : 'Not created yet'}
                              </strong>
                            </div>

                            <span style={{ color: '#94a3b8' }}>→</span>

                            {/* OFFER */}
                            <div style={{ background: offer ? '#ffffff' : '#fef2f2', border: `1px solid ${offer ? '#cbd5e1' : '#fca5a5'}`, borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>3. OFFER</span>
                              <strong style={{ fontFamily: 'monospace', color: offer ? '#0f172a' : '#dc2626' }}>
                                {offer ? `${offer.offerId} (${offer.status})` : 'Not created yet'}
                              </strong>
                            </div>

                            <span style={{ color: '#94a3b8' }}>→</span>

                            {/* TRANSACTION */}
                            <div style={{ background: txn ? '#ffffff' : '#fef2f2', border: `1px solid ${txn ? '#cbd5e1' : '#fca5a5'}`, borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>4. TRANSACTION</span>
                              <strong style={{ fontFamily: 'monospace', color: txn ? '#0f172a' : '#dc2626' }}>
                                {txn ? `${txn.transactionId} (${txn.transactionStatus})` : 'Not created yet'}
                              </strong>
                            </div>

                            <span style={{ color: '#94a3b8' }}>→</span>

                            {/* HANDOVER */}
                            <div style={{ background: handover ? '#ffffff' : '#fef2f2', border: `1px solid ${handover ? '#cbd5e1' : '#fca5a5'}`, borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>5. HANDOVER</span>
                              <strong style={{ fontFamily: 'monospace', color: handover ? '#0f172a' : '#dc2626' }}>
                                {handover ? `${handover.handoverId} (${handover.handoverStatus})` : 'Not created yet'}
                              </strong>
                            </div>

                            <span style={{ color: '#94a3b8' }}>→</span>

                            {/* PAYMENT */}
                            <div style={{ background: payment ? '#ffffff' : '#fef2f2', border: `1px solid ${payment ? '#cbd5e1' : '#fca5a5'}`, borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem' }}>
                              <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>6. PAYMENT</span>
                              <strong style={{ fontFamily: 'monospace', color: payment ? '#0f172a' : '#dc2626' }}>
                                {payment ? `${payment.paymentId} (${payment.paymentMethod})` : 'Not created yet'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
