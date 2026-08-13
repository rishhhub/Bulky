import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleRoute } from '@shared/routing';
import { LoadingSpinner } from '@shared/components/ui';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'));
const LocationManagement = lazy(() => import('./pages/LocationManagement'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><LoadingSpinner /></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <Layout>
                <RoleRoute role="ADMIN">
                  <AdminDashboard />
                </RoleRoute>
              </Layout>
            }
          />
          <Route
            path="/admin/order-groups/:id"
            element={
              <Layout>
                <RoleRoute role="ADMIN">
                  <OrderDetail />
                </RoleRoute>
              </Layout>
            }
          />
          <Route
            path="/admin/financial"
            element={
              <Layout>
                <RoleRoute role="ADMIN">
                  <FinancialDashboard />
                </RoleRoute>
              </Layout>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <Layout>
                <RoleRoute role="ADMIN">
                  <LocationManagement />
                </RoleRoute>
              </Layout>
            }
          />
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
