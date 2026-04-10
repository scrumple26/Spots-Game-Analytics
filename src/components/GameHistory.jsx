import { useState, useMemo } from 'react';
import { enrichGame, toCSV, fmt } from '../utils/stats.js';
import EditGameModal from './EditGameModal.jsx';

const MY_COLS = [
  { key: 'date',         label: 'Date',     sticky: true },
  { key: 'team',         label: 'My Team',  sticky: true },
  { key: 'result',       label: 'W/L',      sticky: true, badge: true },
  { key: 'completed',   label: 'COMP',     sticky: true, isComp: true },
  { key: 'opp_team',     label: 'Opponent' },
  { key: 'pts',          label: 'PTS' },
  { key: 'fg_pct',       label: 'FG%',  isPct: true },
  { key: 'fgm',          label: 'FGM' },
  { key: 'fga',          label: 'FGA' },
  { key: 'tp_pct',       label: '3P%',  isPct: true },
  { key: 'tpm',          label: '3PM' },
  { key: 'tpa',          label: '3PA' },
  { key: 'ft_pct',       label: 'FT%',  isPct: true },
  { key: 'ftm',          label: 'FTM' },
  { key: 'fta',          label: 'FTA' },
  { key: 'reb',          label: 'REB' },
  { key: 'oreb',         label: 'OREB' },
  { key: 'dreb',         label: 'DREB' },
  { key: 'ast',          label: 'AST' },
  { key: 'stl',          label: 'STL' },
  { key: 'blk',          label: 'BLK' },
  { key: 'to',           label: 'TO' },
  { key: 'pf',           label: 'PF' },
  { key: 'pitp',         label: 'PITP' },
  { key: 'fbp',          label: 'FBP' },
  { key: 'scp',          label: 'SCP' },
  { key: 'bp',           label: 'BP' },
  { key: 'largest_lead', label: 'LEAD' },
];

const OPP_COLS = [
  { key: 'opp_pts',     label: 'OPP PTS' },
  { key: 'opp_fg_pct',  label: 'FG%',    isPct: true },
  { key: 'opp_fgm',     label: 'FGM' },
  { key: 'opp_fga',     label: 'FGA' },
  { key: 'opp_tp_pct',  label: '3P%',    isPct: true },
  { key: 'opp_tpm',     label: '3PM' },
  { key: 'opp_tpa',     label: '3PA' },
  { key: 'opp_ft_pct',  label: 'FT%',    isPct: true },
  { key: 'opp_ftm',     label: 'FTM' },
  { key: 'opp_fta',     label: 'FTA' },
  { key: 'opp_reb',     label: 'REB' },
  { key: 'opp_oreb',    label: 'OREB' },
  { key: 'opp_dreb',    label: 'DREB' },
  { key: 'opp_ast',     label: 'AST' },
  { key: 'opp_stl',     label: 'STL' },
  { key: 'opp_blk',     label: 'BLK' },
  { key: 'opp_to',      label: 'TO' },
  { key: 'opp_pf',      label: 'PF' },
  { key: 'opp_pitp',    label: 'PITP' },
  { key: 'opp_fbp',     label: 'FBP' },
  { key: 'opp_scp',     label: 'SCP' },
  { key: 'opp_bp',      label: 'BP' },
  { key: 'opp_largest_lead', label: 'LEAD' },
];

export default function GameHistory({ games, onDelete, onUpdate, onClearAll }) {
  const [sortKey, setSortKey]     = useState('date');
  const [sortDir, setSortDir]     = useState('desc');
  const [showOpp, setShowOpp]     = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editGame, setEditGame]   = useState(null);

  const enriched = useMemo(() => games.map(enrichGame), [games]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'date') { av = av || ''; bv = bv || ''; }
      else { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [enriched, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function handleExport() {
    const csv  = toCSV(games);
    const blob = new Blob([csv], { type: 'text/csv' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'sgl_games.csv' }).click();
  }

  const wins = enriched.filter(g => g.result === 'W').length;
  const COLS = showOpp ? [...MY_COLS, ...OPP_COLS] : MY_COLS;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Game History</h1>
          {games.length > 0 && (
            <span className="text-dim" style={{ fontSize: 14 }}>
              {games.length} games &nbsp;•&nbsp;
              <span className="win-text">{wins}W</span>&nbsp;/&nbsp;
              <span className="loss-text">{games.length - wins}L</span>
            </span>
          )}
        </div>
        {games.length > 0 && (
          <div className="header-actions">
            <button
              className={`btn btn-sm ${showOpp ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowOpp(s => !s)}
            >
              {showOpp ? 'Hide Opp Stats' : 'Show Opp Stats'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>Export CSV</button>
            {confirmClear
              ? <>
                  <span className="text-dim" style={{ fontSize: 13 }}>Delete all games?</span>
                  <button className="btn btn-danger btn-sm" onClick={() => { onClearAll(); setConfirmClear(false); }}>Yes, Delete All</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClear(false)}>Cancel</button>
                </>
              : <button className="btn btn-danger btn-sm" onClick={() => setConfirmClear(true)}>Clear All</button>
            }
          </div>
        )}
      </div>

      {games.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No games logged yet</div>
          <div className="empty-sub">Use Log Game to add your first game.</div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {/* My team group header */}
                <th colSpan={MY_COLS.length} className="group-col-header my-group-header">MY TEAM</th>
                {showOpp && <th colSpan={OPP_COLS.length} className="group-col-header opp-group-header">OPPONENT</th>}
                <th className="sticky-col-right"></th>
              </tr>
              <tr>
                {COLS.map(col => (
                  <th
                    key={col.key}
                    className={`${col.sticky ? 'sticky-col' : ''}${sortKey === col.key ? ' sort-active' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && <span className="sort-arrow">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
                  </th>
                ))}
                <th className="sticky-col-right"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(game => (
                <tr key={game.id}>
                  {COLS.map(col => (
                    <td key={col.key} className={col.sticky ? 'sticky-col' : ''}>
                      {col.badge
                        ? <span className={`badge badge-${game.result === 'W' ? 'win' : 'loss'}`}>{game.result}</span>
                        : col.isComp
                          ? <span className={`badge badge-${game.completed !== false && game.completed !== 'false' ? 'win' : 'loss'}`}>
                              {game.completed !== false && game.completed !== 'false' ? 'Yes' : 'No'}
                            </span>
                          : col.isPct
                            ? fmt(parseFloat(game[col.key]) || 0, true)
                            : game[col.key] !== undefined && game[col.key] !== '' ? game[col.key] : '—'
                      }
                    </td>
                  ))}
                  <td className="sticky-col-right" style={{ display: 'flex', gap: 4, padding: '6px 10px' }}>
                    <button className="btn-icon-edit" onClick={() => setEditGame(games.find(g => g.id === game.id))} title="Edit">✎</button>
                    <button className="btn-icon-del" onClick={() => onDelete(game.id)} title="Delete">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editGame && (
        <EditGameModal
          game={editGame}
          onSave={onUpdate}
          onClose={() => setEditGame(null)}
        />
      )}
    </div>
  );
}
