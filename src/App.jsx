import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import RoleSwitcherBar from './components/role-switch/RoleSwitcherBar';
import LandingPage from './pages/landing/LandingPage';
import CollectorDashboard from './pages/collector/CollectorDashboard';
import {
  CollectorSellPage,
  CollectorLotsPage,
  CollectorTransactionsPage,
  CollectorEarningsPage,
  CollectorProfilePage
} from './pages/collector/CollectorSubpages';
import RecyclerDashboard from './pages/recycler/RecyclerDashboard';
import {
  RecyclerLotsPage,
  RecyclerPickupsPage,
  RecyclerOffersPage,
  RecyclerOrdersPage
} from './pages/recycler/RecyclerSubpages';
import RepairShopDashboard from './pages/repair-shop/RepairShopDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* SIH Evaluation Prototype Role Switcher */}
      <RoleSwitcherBar />

      {/* Main Header (shown on all role dashboards; landing has its own hero) */}
      {!isLanding && <Header />}

      {/* Role & Feature Routes */}
      <div style={{ flex: 1 }}>
        <Routes>
          {/* Landing / Role Entry */}
          <Route path="/" element={<LandingPage />} />

          {/* 1. Collector Routes */}
          <Route path="/collector" element={<CollectorDashboard />} />
          <Route path="/collector/sell" element={<CollectorSellPage />} />
          <Route path="/collector/lots" element={<CollectorLotsPage />} />
          <Route path="/collector/transactions" element={<CollectorTransactionsPage />} />
          <Route path="/collector/earnings" element={<CollectorEarningsPage />} />
          <Route path="/collector/profile" element={<CollectorProfilePage />} />

          {/* 2. Recycler Routes */}
          <Route path="/recycler" element={<RecyclerDashboard />} />
          <Route path="/recycler/lots" element={<RecyclerLotsPage />} />
          <Route path="/recycler/pickups" element={<RecyclerPickupsPage />} />
          <Route path="/recycler/offers" element={<RecyclerOffersPage />} />
          <Route path="/recycler/orders" element={<RecyclerOrdersPage />} />

          {/* 3. Repair Shop Routes */}
          <Route path="/repair-shop" element={<RepairShopDashboard />} />

          {/* 4. Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
