import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, RoleRoute } from '@shared/routing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SellerProfile from './pages/SellerProfile';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import CategoryRequests from './pages/CategoryRequests';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <Dashboard />
              </RoleRoute>
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <SellerProfile />
              </RoleRoute>
            </Layout>
          }
        />
        <Route
          path="/products"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <ProductList />
              </RoleRoute>
            </Layout>
          }
        />
        <Route
          path="/products/new"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <ProductForm />
              </RoleRoute>
            </Layout>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <ProductForm />
              </RoleRoute>
            </Layout>
          }
        />
        <Route
          path="/orders"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <OrderList />
              </RoleRoute>
            </Layout>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <OrderDetail />
              </RoleRoute>
            </Layout>
          }
        />
        <Route
          path="/category-requests"
          element={
            <Layout>
              <RoleRoute role="SELLER">
                <CategoryRequests />
              </RoleRoute>
            </Layout>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
