import { useState, useMemo, Fragment } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend,
} from 'recharts';
import { enrichGame, avgStat, winPct, fmt } from '../utils/stats.js';
import { ANALYTICS_STATS, IMPACT_STATS } from '../constants.js';

// ─── Normalize one side of a game to my-team-key schema ───────────────────────

function normalizeTeamStats(g, side) {
  if (side === 'my') {
    return {
      pts: g.pts, fgm: g.fgm, fga: g.fga, tpm: g.tpm, tpa: g.tpa,
      ftm: g.ftm, fta: g.fta, oreb: g.oreb, dreb: g.dreb,
      ast: g.ast, stl: g.stl, blk: g.blk, to: g.to, pf: g.pf,
      pitp: g.pitp, fbp: g.fbp, scp: g.scp, bp: g.bp, largest_lead: g.largest_lead,
      fg_pct: g.fg_pct, tp_pct: g.tp_pct, ft_pct: g.ft_pct, reb: g.reb,
    };
  }
  return {
    pts: g.opp_pts, fgm: g.opp_fgm, fga: g.opp_fga, tpm: g.opp_tpm, tpa: g.opp_tpa,
    ftm: g.opp_ftm, fta: g.opp_fta, oreb: g.opp_oreb, dreb: g.opp_dreb,
    ast: g.opp_ast, stl: g.opp_stl, blk: g.opp_blk, to: g.opp_to, pf: g.opp_pf,
    pitp: g.opp_pitp, fbp: g.opp_fbp, scp: g.opp_scp, bp: g.opp_bp,
    largest_lead: g.opp_largest_lead,
    fg_pct: g.opp_fg_pct, tp_pct: g.opp_tp_pct, ft_pct: g.opp_ft_pct, reb: g.opp_reb,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatVal({ val, isPct }) {
  return <span>{fmt(val, isPct)}</span>;
}

function DiffCell({ wVal, lVal, lowerIsBetter }) {
  if (isNaN(wVal) || isNaN(lVal)) return <td className="diff-cell neutral">—</td>;
  const diff = wVal - lVal;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  const cls  = Math.abs(diff) < 0.05 ? 'neutral' : good ? 'positive' : 'negative';
  return (
    <td className={`diff-cell ${cls}`}>
      {diff > 0 ? '+' : ''}{fmt(diff, false)}
    </td>
  );
}

const CHART_COLORS = {
  win:    '#22c55e',
  loss:   '#ef4444',
  accent: '#3b82f6',
  muted:  '#475569',
  bg:     '#161e32',
  border: '#1e2a45',
  text:   '#94a3b8',
};

const WL_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="ct-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="ct-row" style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const IMPACT_TOOLTIP = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const positive = d.value >= 0;
  return (
    <div className="chart-tooltip">
      <div className="ct-label">{d.payload.fullLabel}</div>
      <div className="ct-row" style={{ color: positive ? CHART_COLORS.win : CHART_COLORS.loss }}>
        Impact: <strong>{d.value.toFixed(2)}</strong>
      </div>
      <div className="ct-sub">{positive ? 'Higher in wins' : 'Lower in wins'}</div>
      {d.payload.wAvg !== undefined && (
        <>
          <div className="ct-row">W avg: {d.payload.wAvg}</div>
          <div className="ct-row">L avg: {d.payload.lAvg}</div>
        </>
      )}
    </div>
  );
};

// ─── Win Impact Section ───────────────────────────────────────────────────────

function WinImpactSection({ all, wins, losses, subtitle }) {
  const [showAll, setShowAll] = useState(false);

  const impactData = useMemo(() => {
    if (!wins.length || !losses.length) return [];

    return IMPACT_STATS
      .map(stat => {
        const allVals  = all.map(g    => parseFloat(g[stat.key]) || 0);
        const wVals    = wins.map(g   => parseFloat(g[stat.key]) || 0);
        const lVals    = losses.map(g => parseFloat(g[stat.key]) || 0);

        const allMean  = allVals.reduce((a, b) => a + b, 0) / allVals.length;
        const variance = allVals.reduce((s, v) => s + (v - allMean) ** 2, 0) / allVals.length;
        const sd       = Math.sqrt(variance);
        if (!sd) return null;

        const wMean = wVals.reduce((a, b) => a + b, 0) / wVals.length;
        const lMean = lVals.reduce((a, b) => a + b, 0) / lVals.length;
        const cohen = (wMean - lMean) / sd;
        const impact = stat.lowerIsBetter ? -cohen : cohen;

        return {
          key:       stat.key,
          label:     stat.label,
          fullLabel: stat.fullLabel,
          impact:    parseFloat(impact.toFixed(3)),
          wAvg:      wMean.toFixed(1),
          lAvg:      lMean.toFixed(1),
          lowerIsBetter: stat.lowerIsBetter,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }, [all, wins, losses]);

  if (!impactData.length) {
    return (
      <div className="card">
        <div className="card-title">Win Impact</div>
        <p className="text-dim" style={{ fontSize: 13 }}>Need at least one win and one loss to calculate impact.</p>
      </div>
    );
  }

  const displayData = showAll ? impactData : impactData.slice(0, 12);
  const maxAbs = Math.max(...impactData.map(d => Math.abs(d.impact)));

  return (
    <div className="card">
      <div className="card-title-row">
        <div className="card-title">Win Impact Ranking</div>
        <div className="card-subtitle">{subtitle}</div>
      </div>

      <div className="impact-legend">
        <span className="legend-dot win" />
        <span>Positive = more of this stat in wins (good)</span>
        <span className="legend-dot loss" style={{ marginLeft: 16 }} />
        <span>Negative = less of this stat in wins (or: <em>fewer is better</em>)</span>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="impact-podium">
          {impactData.slice(0, 3).map((d, i) => (
            <div key={d.key} className={`podium-card rank-${i + 1}`}>
              <div className="podium-rank">#{i + 1}</div>
              <div className="podium-stat">{d.label}</div>
              <div className="podium-full">{d.fullLabel}</div>
              <div className={`podium-score ${d.impact >= 0 ? 'positive' : 'negative'}`}>
                {d.impact >= 0 ? '+' : ''}{d.impact.toFixed(2)}
              </div>
              <div className="podium-avgs">
                <span className="win-text">{d.wAvg}</span> W &nbsp;/&nbsp;
                <span className="loss-text">{d.lAvg}</span> L
              </div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={Math.max(300, displayData.length * 32 + 40)}>
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 8, right: 60, bottom: 8, left: 8 }}
            barSize={18}
          >
            <CartesianGrid horizontal={false} stroke={CHART_COLORS.border} strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[-maxAbs * 1.1, maxAbs * 1.1]}
              tickFormatter={v => v.toFixed(1)}
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
              axisLine={{ stroke: CHART_COLORS.border }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={42}
              tick={{ fill: CHART_COLORS.text, fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke={CHART_COLORS.muted} strokeWidth={1} />
            <Tooltip content={<IMPACT_TOOLTIP />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
              {displayData.map(entry => (
                <Cell
                  key={entry.key}
                  fill={entry.impact >= 0 ? CHART_COLORS.win : CHART_COLORS.loss}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {impactData.length > 12 && (
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => setShowAll(s => !s)}
          >
            {showAll ? 'Show fewer' : `Show all ${impactData.length} stats`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Key Stats Comparison Chart ───────────────────────────────────────────────

const KEY_CHART_STATS = [
  { key: 'pts',    label: 'PTS'  },
  { key: 'fg_pct', label: 'FG%'  },
  { key: 'tp_pct', label: '3P%'  },
  { key: 'reb',    label: 'REB'  },
  { key: 'ast',    label: 'AST'  },
  { key: 'stl',    label: 'STL'  },
  { key: 'to',     label: 'TO'   },
  { key: 'pitp',   label: 'PITP' },
];

function KeyStatsChart({ wins, losses, winLabel, lossLabel }) {
  const data = useMemo(() => {
    return KEY_CHART_STATS.map(s => ({
      name: s.label,
      W: parseFloat(avgStat(wins,   s.key).toFixed(1)),
      L: parseFloat(avgStat(losses, s.key).toFixed(1)),
    })).filter(d => !isNaN(d.W) && !isNaN(d.L));
  }, [wins, losses]);

  if (!data.length) return null;

  return (
    <div className="card">
      <div className="card-title">Key Stats — Win vs Loss</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.border} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fill: CHART_COLORS.text, fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: CHART_COLORS.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip content={<WL_TOOLTIP />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend
            formatter={v => <span style={{ color: CHART_COLORS.text, fontSize: 12 }}>{v}</span>}
          />
          <Bar dataKey="W" name={winLabel}  fill={CHART_COLORS.win}  radius={[4,4,0,0]} fillOpacity={0.85} />
          <Bar dataKey="L" name={lossLabel} fill={CHART_COLORS.loss} radius={[4,4,0,0]} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Analytics Component ─────────────────────────────────────────────────

export default function Analytics({ games }) {
  const [mode,       setMode]       = useState('my');   // 'my' | 'general'
  const [filterStat, setFilterStat] = useState('pts');
  const [filterOp,   setFilterOp]   = useState('>');
  const [filterVal,  setFilterVal]  = useState('');
  const [applied,    setApplied]    = useState(false);

  const enriched = useMemo(() => games.map(enrichGame), [games]);

  // My W/L — split by my result
  const myWins   = useMemo(() => enriched.filter(g => g.result === 'W'), [enriched]);
  const myLosses = useMemo(() => enriched.filter(g => g.result === 'L'), [enriched]);

  // General W/L — normalize each game into winner stats / loser stats
  const generalWins = useMemo(() =>
    enriched.map(g => normalizeTeamStats(g, g.result === 'W' ? 'my' : 'opp')),
  [enriched]);
  const generalLosses = useMemo(() =>
    enriched.map(g => normalizeTeamStats(g, g.result === 'W' ? 'opp' : 'my')),
  [enriched]);

  const activeWins   = mode === 'my' ? myWins   : generalWins;
  const activeLosses = mode === 'my' ? myLosses : generalLosses;
  // For Cohen's d baseline: my-mode uses enriched; general uses all team performances
  const activeAll    = mode === 'my' ? enriched : [...generalWins, ...generalLosses];

  // In general mode, opp_ stats don't apply — hide that section
  const tableStats   = mode === 'my' ? ANALYTICS_STATS : ANALYTICS_STATS.filter(s => !s.isOpp);

  const filtered = useMemo(() => {
    if (!applied || filterVal === '') return null;
    const threshold = parseFloat(filterVal);
    if (isNaN(threshold)) return null;
    return enriched.filter(g => {
      const v = parseFloat(g[filterStat]) || 0;
      return filterOp === '>' ? v > threshold : v < threshold;
    });
  }, [enriched, filterStat, filterOp, filterVal, applied]);

  const filteredWins   = filtered ? filtered.filter(g => g.result === 'W').length : 0;
  const overallWinPct  = winPct(enriched);

  const wLabel = mode === 'my' ? 'My Wins'   : 'Winner';
  const lLabel = mode === 'my' ? 'My Losses' : 'Loser';
  const impactSubtitle = mode === 'my'
    ? "Cohen's d — how much each stat differs between your wins and losses"
    : "Cohen's d — how much each stat differs between the winning and losing team";

  if (games.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-sub">Log some games to see your analytics.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <div className="mode-toggle">
          <button
            className={`mode-btn${mode === 'my' ? ' active' : ''}`}
            onClick={() => setMode('my')}
          >
            My W/L
          </button>
          <button
            className={`mode-btn${mode === 'general' ? ' active' : ''}`}
            onClick={() => setMode('general')}
          >
            General W/L
          </button>
        </div>
      </div>

      {mode === 'general' && (
        <div className="mode-info-banner">
          Comparing the <strong>winning team's stats</strong> vs the <strong>losing team's stats</strong> across all {enriched.length} games, regardless of which side you were on.
        </div>
      )}

      {/* Overview */}
      <div className="overview-grid">
        <div className="overview-card">
          <div className="overview-val">{enriched.length}</div>
          <div className="overview-lbl">Games</div>
        </div>
        <div className="overview-card win-card">
          <div className="overview-val win-text">{myWins.length}</div>
          <div className="overview-lbl">My Wins</div>
        </div>
        <div className="overview-card loss-card">
          <div className="overview-val loss-text">{myLosses.length}</div>
          <div className="overview-lbl">My Losses</div>
        </div>
        <div className="overview-card">
          <div className="overview-val">{fmt(overallWinPct, true)}</div>
          <div className="overview-lbl">My Win %</div>
        </div>
      </div>

      {/* Win Impact */}
      <WinImpactSection
        all={activeAll}
        wins={activeWins}
        losses={activeLosses}
        subtitle={impactSubtitle}
      />

      {/* Key Stats Chart */}
      {activeWins.length > 0 && activeLosses.length > 0 && (
        <KeyStatsChart
          wins={activeWins}
          losses={activeLosses}
          winLabel={wLabel}
          lossLabel={lLabel}
        />
      )}

      {/* Win vs Loss Averages Table */}
      <div className="card">
        <div className="card-title">
          {mode === 'my' ? 'Win vs Loss Averages — Full Table' : 'Winner vs Loser Averages — Full Table'}
        </div>
        {(activeWins.length === 0 || activeLosses.length === 0) && (
          <p className="text-dim" style={{ marginBottom: 12, fontSize: 13 }}>
            {activeWins.length === 0 ? 'No wins logged yet.' : 'No losses logged yet.'} Log more games to compare.
          </p>
        )}
        <div className="table-scroll">
          <table className="data-table analytics-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: 160 }}>Stat</th>
                <th className="win-header">{wLabel} Avg ({activeWins.length}g)</th>
                <th className="loss-header">{lLabel} Avg ({activeLosses.length}g)</th>
                <th>Diff (W−L)</th>
              </tr>
            </thead>
            <tbody>
              {tableStats.map((stat, i) => {
                const isOppDivider = stat.isOpp && !tableStats[i - 1]?.isOpp;
                const wAvg = avgStat(activeWins,   stat.key);
                const lAvg = avgStat(activeLosses, stat.key);
                return (
                  <Fragment key={stat.key}>
                    {isOppDivider && (
                      <tr className="section-divider-row">
                        <td colSpan={4}>OPPONENT STATS</td>
                      </tr>
                    )}
                    <tr>
                      <td className="stat-name-cell">
                        <span className="stat-label">{stat.label}</span>
                        <span className="stat-full">{stat.fullLabel}</span>
                      </td>
                      <td className="num-cell win-avg"><StatVal val={wAvg} isPct={stat.isPct} /></td>
                      <td className="num-cell loss-avg"><StatVal val={lAvg} isPct={stat.isPct} /></td>
                      <DiffCell wVal={wAvg} lVal={lAvg} lowerIsBetter={stat.lowerIsBetter} />
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stat Filter */}
      <div className="card">
        <div className="card-title">Stat Filter</div>
        <p className="text-dim" style={{ marginBottom: 16, fontSize: 13 }}>
          Filter games by a threshold and see how your win % and other stats change.
        </p>
        <div className="filter-controls">
          <span className="filter-label">Show games where</span>
          <select className="filter-select" value={filterStat}
            onChange={e => { setFilterStat(e.target.value); setApplied(false); }}>
            {ANALYTICS_STATS.map(s => (
              <option key={s.key} value={s.key}>{s.label} — {s.fullLabel}</option>
            ))}
          </select>
          <select className="filter-op" value={filterOp}
            onChange={e => { setFilterOp(e.target.value); setApplied(false); }}>
            <option value=">">&gt; greater than</option>
            <option value="<">&lt; less than</option>
          </select>
          <input className="filter-input" type="number" placeholder="value"
            value={filterVal}
            onChange={e => { setFilterVal(e.target.value); setApplied(false); }} />
          <button className="btn btn-primary" onClick={() => setApplied(true)} disabled={filterVal === ''}>
            Apply
          </button>
          {applied && (
            <button className="btn btn-secondary" onClick={() => { setApplied(false); setFilterVal(''); }}>
              Clear
            </button>
          )}
        </div>

        {applied && filtered !== null && (
          <>
            <div className="filter-summary">
              <span>{filtered.length} of {enriched.length} games match</span>
              &nbsp;•&nbsp;
              <span className="win-text">{filteredWins}W</span>
              &nbsp;/&nbsp;
              <span className="loss-text">{filtered.length - filteredWins}L</span>
              &nbsp;•&nbsp;
              Win%:&nbsp;
              <strong className={winPct(filtered) >= 50 ? 'win-text' : 'loss-text'}>
                {fmt(winPct(filtered), true)}
              </strong>
              &nbsp;vs overall&nbsp;
              <strong>{fmt(overallWinPct, true)}</strong>
            </div>

            {filtered.length === 0 ? (
              <p className="text-dim" style={{ margin: '12px 0', fontSize: 13 }}>No games match this filter.</p>
            ) : (
              <div className="table-scroll" style={{ marginTop: 16 }}>
                <table className="data-table analytics-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', minWidth: 160 }}>Stat</th>
                      <th>Filtered Avg ({filtered.length}g)</th>
                      <th>Overall Avg ({enriched.length}g)</th>
                      <th>Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ANALYTICS_STATS.map((stat, i) => {
                      const fAvg = avgStat(filtered, stat.key);
                      const oAvg = avgStat(enriched,  stat.key);
                      const diff = fAvg - oAvg;
                      const good = stat.lowerIsBetter ? diff < 0 : diff > 0;
                      const cls  = isNaN(diff) || Math.abs(diff) < 0.05 ? 'neutral' : good ? 'positive' : 'negative';
                      const isOppDivider = stat.isOpp && !ANALYTICS_STATS[i - 1]?.isOpp;
                      return (
                        <Fragment key={stat.key}>
                          {isOppDivider && (
                            <tr className="section-divider-row">
                              <td colSpan={4}>OPPONENT STATS</td>
                            </tr>
                          )}
                          <tr>
                            <td className="stat-name-cell">
                              <span className="stat-label">{stat.label}</span>
                              <span className="stat-full">{stat.fullLabel}</span>
                            </td>
                            <td className="num-cell"><StatVal val={fAvg} isPct={stat.isPct} /></td>
                            <td className="num-cell"><StatVal val={oAvg} isPct={stat.isPct} /></td>
                            <td className={`diff-cell ${cls}`}>
                              {isNaN(diff) ? '—' : `${diff > 0 ? '+' : ''}${fmt(diff, false)}`}
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
