import React, { useState } from 'react';
import { Menu } from './components/Menu';
import { Game } from './components/Game';
import { GameSettings } from './types';

export default function App() {
  const [settings, setSettings] = useState<GameSettings | null>(null);

  const handleStart = (newSettings: GameSettings) => {
    setSettings(newSettings);
  };

  const handleBack = () => {
    setSettings(null);
  };

  return (
    <div className="min-h-screen bg-black">
      {!settings ? (
        <Menu onStart={handleStart} />
      ) : (
        <Game settings={settings} onBack={handleBack} />
      )}
    </div>
  );
}
