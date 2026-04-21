import { useState } from 'react';
import { useGames } from './hooks/useGames.js';
import LogGame from './components/LogGame.jsx';
import GameHistory from './components/GameHistory.jsx';
import Analytics from './components/Analytics.jsx';
import ImportGuide from './components/ImportGuide.jsx';

const KEY = 'spots_games_v1';

const TABS = [
  { id: 'log',       label: 'Log Game' },
  { id: 'history',   label: 'Game History' },
  { id: 'analytics', label: 'Analytics' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('log');
  const { games, addGame, addGames, deleteGame, updateGame, clearAll } = useGames();

  function handleExport() {
    const data = localStorage.getItem(KEY) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sports-game-lab-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="brand-dot" />
            SPORTS GAME LAB
          </div>
          <div className="nav-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {t.id === 'history' && games.length > 0 && (
                  <span className="tab-count">{games.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="nav-actions">
            <button className="nav-action-btn" onClick={handleExport} title="Export all games">
              Export
            </button>
            <button className="nav-action-btn" onClick={() => setActiveTab('import')} title="Import games">
              Import
            </button>
          </div>
        </div>
      </nav>

      <main className="main">
        {activeTab === 'log' && (
          <LogGame onAdd={addGame} onAddMany={addGames} />
        )}
        {activeTab === 'history' && (
          <GameHistory games={games} onDelete={deleteGame} onUpdate={updateGame} onClearAll={clearAll} />
        )}
        {activeTab === 'analytics' && (
          <Analytics games={games} />
        )}
        {activeTab === 'import' && (
          <ImportGuide onAddMany={addGames} onBack={() => setActiveTab('log')} />
        )}
      </main>
    </div>
  );
}
