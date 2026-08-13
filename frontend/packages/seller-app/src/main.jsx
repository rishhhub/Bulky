import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastProvider } from '@shared/context';
import { ErrorBoundary } from '@shared/components/ui';
import App from './App';
import '@shared/styles/index.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
