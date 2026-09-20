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
import SafetyPage from './pages/collector/SafetyPage';
import CollectorInsightsPage from './pages/collector/CollectorInsightsPage';
import {
  CollectorBookPickupPage,
  CollectorPickupTrackingPage
} from './pages/collector/CollectorKabadiPages';
import {
  CustomerDashboard,
  CustomerBookPickupPage,
  CustomerBookingsPage
} from './pages/customer/CustomerPages';
import KabadiwalaDashboard from './pages/kabadiwala/KabadiwalaDashboard';
import RecyclerDashboard from './pages/recycler/RecyclerDashboard';
import {
  RecyclerLotsPage,
  RecyclerPickupsPage,
  RecyclerOffersPage,
  RecyclerOrdersPage,
  RecyclerProfilePage,
  RecyclerReceiptsPage
} from './pages/recycler/RecyclerSubpages';
import RepairShopDashboard from './pages/repair-shop/RepairShopDashboard';
import {
  RepairShopComponentsPage,
  RepairShopWantedPage,
  RepairShopOffersPage,
  RepairShopPurchasesPage,
  RepairShopTransactionsPage,
  RepairShopProfilePage,
  RepairShopReceiptsPage
} from './pages/repair-shop/RepairShopSubpages';
import AdminDashboard from './pages/admin/AdminDashboard';
import SyncStatusPage from './pages/shared/SyncStatusPage';

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

          {/* 0. Customer Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer" element={<CustomerDashboard />} />
            <Route path="/customer/book-pickup" element={<CustomerBookPickupPage />} />
            <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
          </Route>

          {/* 0.1. Kabadiwala Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['kabadiwala', 'collector']} />}>
            <Route path="/kabadiwala" element={<KabadiwalaDashboard />} />
            <Route path="/kabadiwala/pickups" element={<KabadiwalaDashboard />} />
          </Route>

          {/* 1. Collector Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['collector']} />}>
            <Route path="/collector" element={<CollectorDashboard />} />
            <Route path="/collector/sell" element={<CollectorSellPage />} />
            <Route path="/collector/lots" element={<CollectorLotsPage />} />
            <Route path="/collector/transactions" element={<CollectorTransactionsPage />} />
            <Route path="/collector/earnings" element={<CollectorEarningsPage />} />
            <Route path="/collector/profile" element={<CollectorProfilePage />} />
            <Route path="/collector/safety" element={<SafetyPage />} />
            <Route path="/collector/insights" element={<CollectorInsightsPage />} />
            <Route path="/collector/book-pickup" element={<CollectorBookPickupPage />} />
            <Route path="/collector/pickups" element={<CollectorPickupTrackingPage />} />
          </Route>

          {/* 2. Recycler Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['recycler']} />}>
            <Route path="/recycler" element={<RecyclerDashboard />} />
            <Route path="/recycler/lots" element={<RecyclerLotsPage />} />
            <Route path="/recycler/pickups" element={<RecyclerPickupsPage />} />
            <Route path="/recycler/offers" element={<RecyclerOffersPage />} />
            <Route path="/recycler/orders" element={<RecyclerOrdersPage />} />
            <Route path="/recycler/profile" element={<RecyclerProfilePage />} />
            <Route path="/recycler/receipts" element={<RecyclerReceiptsPage />} />
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
            <Route path="/repair-shop/receipts" element={<RepairShopReceiptsPage />} />
          </Route>

          {/* 4. Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* 5. Shared: Sync Status — accessible to all authenticated roles */}
          <Route element={<ProtectedRoute allowedRoles={['customer', 'kabadiwala', 'collector', 'recycler', 'repair', 'repair-shop', 'admin']} />}>
            <Route path="/sync-status" element={<SyncStatusPage />} />
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
