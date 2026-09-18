import React, { useState } from 'react';
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
  Edit,
  Search,
  Download
} from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { 
  CORE_MATERIAL_GROUPS, 
  MOCK_ADMIN_METRICS, 
  MOCK_VERIFICATION_QUEUE 
} from '../../data/mockData';

export const AdminDashboard = () => {
  const [materials, setMaterials] = useState(CORE_MATERIAL_GROUPS);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.vernacularName.includes(searchTerm)
  );

  const handleUpdatePrice = (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setMaterials(materials.map((m) => (m.id === editingMaterial.id ? editingMaterial : m)));
    setEditingMaterial(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>
      <PageContainer maxWidth="1280px">
        {/* Admin Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                ScrapSetu Platform Governance
              </h1>
              <Badge variant="neutral">Admin Portal</Badge>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              SIH26229 Administration • CPCB E-Waste Compliance • Traceability Ledger
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" icon={Download}>
              Export CPCB Report
            </Button>
            <Button variant="primary" size="sm" icon={ShieldCheck}>
              Compliance Audit
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Grid */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Collectors
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

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Authorized Recyclers
              </span>
              <Recycle size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_ADMIN_METRICS.totalRecyclers}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
              100% CPCB verified
            </span>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Repair Shops
              </span>
              <Store size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_ADMIN_METRICS.totalRepairShops}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
              Parts recovery hubs
            </span>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Traceable E-Waste
              </span>
              <Activity size={18} color="#7c3aed" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {MOCK_ADMIN_METRICS.totalVolumeRecycledKg}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              {MOCK_ADMIN_METRICS.totalPayouts} paid to collectors
            </span>
          </Card>
        </div>

        {/* Section 1: Core Material & Fair Price Dataset Management */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Material & Fair Price Benchmark Dataset (8 Categories)
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Admin-governed market price bands that prevent exploitation of informal collectors:
              </p>
            </div>

            <div style={{ width: '260px' }}>
              <Input
                placeholder="Search material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Material Category</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Vernacular Name</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Classification</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Hazard Level</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Benchmark Rate Band</th>
                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((mat) => (
                    <tr key={mat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                        {mat.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#15803d', fontWeight: 600 }}>
                        {mat.vernacularName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {mat.category}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={mat.hazardLevel === 'High' ? 'danger' : mat.hazardLevel === 'Medium' ? 'warning' : 'neutral'}>
                          {mat.hazardLevel}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        {mat.benchmarkPrice} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>{mat.unit}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => setEditingMaterial(mat)}
                        >
                          Edit Rate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: Verification Queue & AI/ML Monitoring Placeholder */}
        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Verification Queue */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Verification Queue (Pending)</h3>
              <Badge variant="warning">5 Pending</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MOCK_VERIFICATION_QUEUE.map((item) => (
                <Card key={item.id} style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{item.name}</h4>
                        <Badge variant={item.type === 'Recycler' ? 'info' : 'warning'}>
                          {item.type}
                        </Badge>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        {item.regDoc}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                      ⏳ {item.status}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="outline" size="sm" onClick={() => alert(`Reviewing docs for ${item.name}`)}>
                        Review
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => alert(`Approved ${item.name}`)}>
                        Approve
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* AI/ML & System Health Placeholder */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI/ML & Traceability Services</h3>
              <Badge variant="neutral">System Status</Badge>
            </div>

            <Card style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <Cpu size={20} color="#7c3aed" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>AI Material Classifier Engine</h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Lightweight transfer learning model for 8 material group classification.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                  Architecture Ready • Activates in Module 5
                </span>
                <Badge variant="neutral">Standby</Badge>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <Activity size={20} color="#16a34a" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Price Estimation & Anomaly Guard</h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Flags suspicious payouts, abnormal lots, and predatory pricing against collectors.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                  Rule Guard: Active (Benchmark tolerance ±15%)
                </span>
                <Badge variant="success">Normal</Badge>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal: Edit Benchmark Price */}
        <Modal
          isOpen={!!editingMaterial}
          onClose={() => setEditingMaterial(null)}
          title={`Edit Rate Band: ${editingMaterial?.name}`}
        >
          {editingMaterial && (
            <form onSubmit={handleUpdatePrice}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Updating base rate for {editingMaterial.vernacularName}. This instantly adjusts fair price estimates for all informal collectors.
              </p>
              <Input
                label="Benchmark Rate Band"
                value={editingMaterial.benchmarkPrice}
                onChange={(e) =>
                  setEditingMaterial({ ...editingMaterial, benchmarkPrice: e.target.value })
                }
                required
              />
              <Button type="submit" variant="primary" fullWidth style={{ marginTop: '1rem' }}>
                Save Updated Benchmark Rate
              </Button>
            </form>
          )}
        </Modal>
      </PageContainer>
    </div>
  );
};

export default AdminDashboard;
