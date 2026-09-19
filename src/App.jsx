import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/landing/LandingPage';
import Login from './pages/auth/Login';
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
  RecyclerOrdersPage,
  RecyclerProfilePage
} from './pages/recycler/RecyclerSubpages';
import RepairShopDashboard from './pages/repair-shop/RepairShopDashboard';
import {
  RepairShopComponentsPage,
  RepairShopWantedPage,
  RepairShopOffersPage,
  RepairShopPurchasesPage,
  RepairShopTransactionsPage,
  RepairShopProfilePage
} from './pages/repair-shop/RepairShopSubpages';
import AdminDashboard from './pages/admin/AdminDashboard';

import { OfflineBanner } from './components/common/OfflineState';

function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Clean Global Header */}
      <Header />

      {/* Offline Status Warning Banner (Shown only when offline) */}
      <OfflineBanner />

      {/* Role & Feature Routes */}
      <div style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* 1. Collector Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['collector']} />}>
            <Route path="/collector" element={<CollectorDashboard />} />
            <Route path="/collector/sell" element={<CollectorSellPage />} />
            <Route path="/collector/lots" element={<CollectorLotsPage />} />
            <Route path="/collector/transactions" element={<CollectorTransactionsPage />} />
            <Route path="/collector/earnings" element={<CollectorEarningsPage />} />
            <Route path="/collector/profile" element={<CollectorProfilePage />} />
          </Route>

          {/* 2. Recycler Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['recycler']} />}>
            <Route path="/recycler" element={<RecyclerDashboard />} />
            <Route path="/recycler/lots" element={<RecyclerLotsPage />} />
            <Route path="/recycler/pickups" element={<RecyclerPickupsPage />} />
            <Route path="/recycler/offers" element={<RecyclerOffersPage />} />
            <Route path="/recycler/orders" element={<RecyclerOrdersPage />} />
            <Route path="/recycler/profile" element={<RecyclerProfilePage />} />
          </Route>

          {/* 3. Repair Shop Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['repair', 'repair-shop']} />}>
            <Route path="/repair-shop" element={<RepairShopDashboard />} />
            <Route path="/repair-shop/components" element={<RepairShopComponentsPage />} />
            <Route path="/repair-shop/wanted" element={<RepairShopWantedPage />} />
            <Route path="/repair-shop/offers" element={<RepairShopOffersPage />} />
            <Route path="/repair-shop/purchases" element={<RepairShopPurchasesPage />} />
            <Route path="/repair-shop/transactions" element={<RepairShopTransactionsPage />} />
            <Route path="/repair-shop/profile" element={<RepairShopProfilePage />} />
          </Route>

          {/* 4. Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
