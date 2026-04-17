import { useMemo } from 'react';
import { enrichGame, avgStat, fmt } from '../utils/stats.js';

const REPORT_STATS = [
  { key: 'fg_pct',  oppKey: 'opp_fg_pct',  label: 'FG%',  fullLabel: 'Field Goal %',   isPct: true,  lowerIsBetter: false },
  { key: 'tp_pct',  oppKey: 'opp_tp_pct',  label: '3P%',  fullLabel: '3-Point %',       isPct: true,  lowerIsBetter: false },
  { key: 'ft_pct',   oppKey: 'opp_ft_pct',   label: 'FT%',    fullLabel: 'Free Throw %',     isPct: true,  lowerIsBetter: false },
  { key: 'ts_pct',   oppKey: 'opp_ts_pct',   label: 'TS%',    fullLabel: 'True Shooting %',  isPct: true,  lowerIsBetter: false },
  { key: 'efg_pct',  oppKey: 'opp_efg_pct',  label: 'eFG%',   fullLabel: 'Eff. Field Goal %', isPct: true,  lowerIsBetter: false },
  { key: 'ft_rate',  oppKey: 'opp_ft_rate',  label: 'FT Rate',fullLabel: 'FT Rate (FTA/FGA)', isPct: true,  lowerIsBetter: false },
  { key: 'oreb',     oppKey: 'opp_oreb',     label: 'OREB',  fullLabel: 'Off Rebounds',     isPct: false, lowerIsBetter: false },
  { key: 'oreb_pct', oppKey: 'opp_oreb_pct', label: 'OREB%', fullLabel: 'Off Reb %',       isPct: true,  lowerIsBetter: false },
  { key: 'dreb',     oppKey: 'opp_dreb',     label: 'DREB',  fullLabel: 'Def Rebounds',     isPct: false, lowerIsBetter: false },
  { key: 'dreb_pct', oppKey: 'opp_dreb_pct', label: 'DREB%',   fullLabel: 'Def Reb %',         isPct: true,  lowerIsBetter: false },
  { key: 'tov_pct', oppKey: 'opp_tov_pct', label: 'TOV%',    fullLabel: 'Turnover %',         isPct: true,  lowerIsBetter: true  },
  { key: 'ast_to',  oppKey: 'opp_ast_to',  label: 'AST/TO',  fullLabel: 'Assist/TO Ratio',    isPct: false, lowerIsBetter: false, decimals: 2 },
  { key: 'ast',     oppKey: 'opp_ast',     label: 'AST',  fullLabel: 'Assists',          isPct: false, lowerIsBetter: false },
  { key: 'stl',     oppKey: 'opp_stl',     label: 'STL',  fullLabel: 'Steals',           isPct: false, lowerIsBetter: false },
  { key: 'blk',     oppKey: 'opp_blk',     label: 'BLK',  fullLabel: 'Blocks',           isPct: false, lowerIsBetter: false },
  { key: 'to',      oppKey: 'opp_to',      label: 'TO',   fullLabel: 'Turnovers',        isPct: false, lowerIsBetter: true  },
  { key: 'pf',      oppKey: 'opp_pf',      label: 'PF',   fullLabel: 'Personal Fouls',   isPct: false, lowerIsBetter: true  },
  { key: 'pitp',    oppKey: 'opp_pitp',    label: 'PITP', fullLabel: 'Pts in the Paint', isPct: false, lowerIsBetter: false },
  { key: 'fbp',     oppKey: 'opp_fbp',     label: 'FBP',  fullLabel: 'Fast Break Pts',   isPct: false, lowerIsBetter: false },
  { key: 'scp',     oppKey: 'opp_scp',     label: 'SCP',  fullLabel: '2nd Chance Pts',   isPct: false, lowerIsBetter: false },
  { key: 'bp',      oppKey: 'opp_bp',      label: 'BP',   fullLabel: 'Bench Points',     isPct: false, lowerIsBetter: false },
];

function fmtVal(val, isPct, decimals = 0) {
  if (val === null || isNaN(val)) return '—';
  if (isPct) return val.toFixed(1) + '%';
  if (decimals > 0) return val.toFixed(decimals);
  return String(Math.round(val));
}

function fmtDiff(diff, isPct, decimals = 0) {
  if (diff === null || diff === undefined || isNaN(diff)) return '—';
  const sign = diff > 0 ? '+' : '';
  if (isPct) return `${sign}${diff.toFixed(1)}pp`;
  if (decimals > 0) return `${sign}${diff.toFixed(decimals)}`;
  return `${sign}${Math.round(diff)}`;
}

export default function GameReport({ game, allGames, onClose }) {
  const enriched = useMemo(() => enrichGame(game), [game]);

  const statRows = useMemo(() => {
    return REPORT_STATS.map(stat => {
      const myRaw  = enriched[stat.key];
      const oppRaw = enriched[stat.oppKey];

      const myVal  = (myRaw  === 'na' || myRaw  === '' || myRaw  == null) ? null : parseFloat(myRaw);
      const oppVal = (oppRaw === 'na' || oppRaw === '' || oppRaw == null) ? null : parseFloat(oppRaw);

      if (myVal === null || oppVal === null || isNaN(myVal) || isNaN(oppVal)) return null;

      // myEdge > 0 means my team was better at this stat
      const myEdge = stat.lowerIsBetter ? oppVal - myVal : myVal - oppVal;

      const myAvg = avgStat(allGames, stat.key);
      const vsAvg = !isNaN(myAvg) ? myVal - myAvg : null;
      // vsAvgGood: true if this vsAvg value is favorable for my team
      const vsAvgGood = vsAvg === null ? null : (stat.lowerIsBetter ? vsAvg < 0 : vsAvg > 0);

      return { ...stat, myVal, oppVal, myEdge, myAvg, vsAvg, vsAvgGood };
    }).filter(Boolean);
  }, [enriched, allGames]);

  const sorted       = [...statRows].sort((a, b) => Math.abs(b.myEdge) - Math.abs(a.myEdge));
  const myAdvantages = sorted.filter(r => r.myEdge > 0);
  const oppAdvantages = sorted.filter(r => r.myEdge < 0);

  const myTeam  = game.team     || 'My Team';
  const oppTeam = game.opp_team || 'Opponent';
  const isWin   = enriched.result === 'W';

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Game Report</h2>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
              {game.date && <span style={{ marginRight: 12 }}>{game.date}</span>}
              <strong style={{ color: 'var(--text)' }}>{myTeam}</strong>
              {' '}{game.pts} — {game.opp_pts}{' '}
              <strong style={{ color: 'var(--text)' }}>{oppTeam}</strong>
              <span className={`badge badge-${isWin ? 'win' : 'loss'}`} style={{ marginLeft: 10 }}>{isWin ? 'W' : 'L'}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {statRows.length === 0 ? (
            <p className="text-dim" style={{ fontSize: 13 }}>
              Not enough stat data recorded for this game to generate a report.
            </p>
          ) : (
            <>
              {/* ── Key Edges ── */}
              <div className="rpt-section-label">KEY EDGES</div>
              <div className="rpt-edges-grid">
                <div className="rpt-edge-col">
                  <div className="rpt-edge-header" style={{ color: 'var(--win)' }}>
                    {myTeam} excelled at
                  </div>
                  {myAdvantages.length === 0
                    ? <div className="rpt-edge-none">No clear advantages</div>
                    : myAdvantages.slice(0, 5).map(r => (
                        <div key={r.key} className="rpt-edge-row">
                          <span className="rpt-edge-label">{r.fullLabel}</span>
                          <span className="rpt-edge-vals">
                            <span className="win-text">{fmtVal(r.myVal, r.isPct, r.decimals)}</span>
                            <span className="rpt-vs">vs</span>
                            <span className="loss-text">{fmtVal(r.oppVal, r.isPct, r.decimals)}</span>
                          </span>
                          <span className="rpt-edge-diff win-text">
                            {fmtDiff(r.myEdge, r.isPct, r.decimals)}
                          </span>
                        </div>
                      ))
                  }
                </div>

                <div className="rpt-edge-col">
                  <div className="rpt-edge-header" style={{ color: 'var(--loss)' }}>
                    {oppTeam} excelled at
                  </div>
                  {oppAdvantages.length === 0
                    ? <div className="rpt-edge-none">No clear advantages</div>
                    : oppAdvantages.slice(0, 5).map(r => (
                        <div key={r.key} className="rpt-edge-row">
                          <span className="rpt-edge-label">{r.fullLabel}</span>
                          <span className="rpt-edge-vals">
                            <span className="loss-text">{fmtVal(r.myVal, r.isPct, r.decimals)}</span>
                            <span className="rpt-vs">vs</span>
                            <span className="win-text">{fmtVal(r.oppVal, r.isPct, r.decimals)}</span>
                          </span>
                          <span className="rpt-edge-diff loss-text">
                            {fmtDiff(-r.myEdge, r.isPct, r.decimals)}
                          </span>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* ── Full Breakdown ── */}
              <div className="rpt-section-label" style={{ marginTop: 28 }}>FULL BREAKDOWN — sorted by margin</div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', minWidth: 150 }}>Stat</th>
                      <th className="my-header">{myTeam}</th>
                      <th style={{ color: 'var(--text-muted)', fontSize: 10 }}>My Avg</th>
                      <th style={{ color: 'var(--text-muted)', fontSize: 10 }}>vs Avg</th>
                      <th className="opp-header">{oppTeam}</th>
                      <th>Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(r => {
                      const myWon  = r.myEdge > 0;
                      const oppWon = r.myEdge < 0;
                      const tied   = r.myEdge === 0;
                      const vsAvgCls = r.vsAvgGood === null ? 'neutral' : r.vsAvgGood ? 'positive' : 'negative';
                      return (
                        <tr key={r.key}>
                          <td style={{ textAlign: 'left' }}>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>{r.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>
                              {r.fullLabel}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }} className={myWon ? 'win-text' : oppWon ? 'loss-text' : ''}>
                            {fmtVal(r.myVal, r.isPct, r.decimals)}
                          </td>
                          <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                            {fmt(r.myAvg, r.isPct)}
                          </td>
                          <td className={`diff-cell ${vsAvgCls}`} style={{ fontSize: 12 }}>
                            {fmtDiff(r.vsAvg, r.isPct, r.decimals)}
                          </td>
                          <td style={{ fontWeight: 600 }} className={oppWon ? 'win-text' : myWon ? 'loss-text' : ''}>
                            {fmtVal(r.oppVal, r.isPct, r.decimals)}
                          </td>
                          <td>
                            {tied
                              ? <span className="text-dim" style={{ fontSize: 12 }}>Even</span>
                              : <span className={`badge badge-${myWon ? 'win' : 'loss'}`}>
                                  {myWon ? myTeam : oppTeam}
                                </span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
