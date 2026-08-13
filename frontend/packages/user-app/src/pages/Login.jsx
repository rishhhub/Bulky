import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@shared/components/auth';

function Login() {
  const navigate = useNavigate();
  return (
    <LoginForm
      title="Login"
      onSuccess={() => navigate('/dashboard')}
      footerLink={{ to: '/register', label: "Don't have an account? Register here" }}
    />
  );
}

export default Login;
