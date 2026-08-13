import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, RoleRoute } from '@shared/routing';
import { appUrls } from '@shared/config';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleRoute role="ADMIN">
                <div style={{ padding: '50px', textAlign: 'center' }}>
                  <h1>Admin Panel</h1>
                  <p>The admin panel runs on a separate application.</p>
                  <p style={{ marginTop: '20px' }}>
                    <a 
                      href={`${appUrls.adminAppUrl}/admin`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      Open Admin Panel
                    </a>
                  </p>
                  <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
                    Make sure the admin app is running: <code>cd frontend/packages/admin-app && npm run dev</code>
                  </p>
                </div>
              </RoleRoute>
            }
          />
          <Route path="/" element={<Navigate to="/products" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
