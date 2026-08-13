import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@shared/components/auth';
import { appUrls } from '@shared/config';

function Login() {
  const navigate = useNavigate();
  return (
    <LoginForm
      title="Seller Login"
      requiredRole="SELLER"
      onSuccess={() => navigate('/dashboard')}
      footerLink={{ href: appUrls.userAppUrl, label: 'Not a seller? Go to User App' }}
    />
  );
}

export default Login;
