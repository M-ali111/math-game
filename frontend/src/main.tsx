import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { GameProvider } from './context/GameContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('[main.tsx] React app initialization starting...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <GameProvider>
            <App />
          </GameProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

console.log('[main.tsx] React app mounted to DOM');
