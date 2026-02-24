import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useGame } from './context/GameContext';
import { Login } from './components/Login';
import { GameMenu } from './components/GameMenu';
import { SubjectSelection } from './components/SubjectSelection';
import { ModeSelection } from './components/ModeSelection';
import { SoloGame } from './components/SoloGame';
import { MultiplayerGame } from './components/MultiplayerGame';
import { Stats } from './components/Stats';
import Leaderboard from './components/Leaderboard';

type AppState = 
  | 'login' 
  | 'menu' 
  | 'subject-selection' 
  | 'mode-selection'
  | 'solo' 
  | 'multiplayer' 
  | 'stats'
  | 'leaderboard';

const AppContent: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const { user, token, logout } = useAuth();
  const { subject, resetGameFlow } = useGame();

  useEffect(() => {
    if (token && user) {
      setAppState('menu');
    } else {
      setAppState('login');
    }
  }, [token, user]);

  const handleLogout = () => {
    logout();
    resetGameFlow();
    setAppState('login');
  };

  const handleSelectMode = (mode: string) => {
    if (mode === 'solo') {
      setAppState('subject-selection');
    } else if (mode === 'multiplayer') {
      setAppState('subject-selection');
    } else if (mode === 'stats') {
      setAppState('stats');
    } else if (mode === 'leaderboard') {
      setAppState('leaderboard');
    }
  };

  const handleModeSelected = (mode: 'solo' | 'multiplayer') => {
    if (mode === 'solo') {
      // For logic, skip grade selection; for math, show grade selection
      if (subject === 'logic') {
        setAppState('solo');
      } else {
        setAppState('solo');
      }
    } else {
      // For logic, skip grade selection; for math, show grade selection
      if (subject === 'logic') {
        setAppState('multiplayer');
      } else {
        setAppState('multiplayer');
      }
    }
  };

  const handleBackFromModeSelection = () => {
    setAppState('subject-selection');
  };

  const handleBack = () => {
    resetGameFlow();
    setAppState('menu');
  };

  return (
    <div>
      {appState === 'login' && <Login onLoginSuccess={() => setAppState('menu')} />}
      {appState === 'menu' && (
        <GameMenu onSelectMode={handleSelectMode} onLogout={handleLogout} />
      )}
      {appState === 'subject-selection' && (
        <SubjectSelection 
          onSubjectSelected={() => setAppState('mode-selection')}
          onBack={() => setAppState('menu')}
        />
      )}
      {appState === 'mode-selection' && subject && (
        <ModeSelection 
          onModeSelect={handleModeSelected}
          onBack={handleBackFromModeSelection}
        />
      )}
      {appState === 'solo' && <SoloGame onBack={handleBack} />}
      {appState === 'multiplayer' && <MultiplayerGame onBack={handleBack} />}
      {appState === 'stats' && <Stats onBack={handleBack} />}
      {appState === 'leaderboard' && <Leaderboard onBack={handleBack} />}
    </div>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
