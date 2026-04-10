import { useState, useCallback } from 'react';

const KEY = 'spots_games_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function save(games) {
  localStorage.setItem(KEY, JSON.stringify(games));
}

export function useGames() {
  const [games, setGames] = useState(load);

  const addGame = useCallback((formData) => {
    const game = { ...formData, id: crypto.randomUUID() };
    setGames(prev => {
      const next = [game, ...prev];
      save(next);
      return next;
    });
  }, []);

  const addGames = useCallback((rows) => {
    const newGames = rows.map(r => ({ ...r, id: crypto.randomUUID() }));
    setGames(prev => {
      const next = [...newGames, ...prev];
      save(next);
      return next;
    });
  }, []);

  const deleteGame = useCallback((id) => {
    setGames(prev => {
      const next = prev.filter(g => g.id !== id);
      save(next);
      return next;
    });
  }, []);

  const updateGame = useCallback((id, formData) => {
    setGames(prev => {
      const next = prev.map(g => g.id === id ? { ...formData, id } : g);
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setGames([]);
    save([]);
  }, []);

  return { games, addGame, addGames, deleteGame, updateGame, clearAll };
}
