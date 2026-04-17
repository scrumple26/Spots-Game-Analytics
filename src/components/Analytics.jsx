import { useState, useMemo, Fragment } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
      oreb_pct: g.oreb_pct, dreb_pct: g.dreb_pct,
      ts_pct: g.ts_pct, efg_pct: g.efg_pct, tov_pct: g.tov_pct, ast_to: g.ast_to, ft_rate: g.ft_rate,
    };
  }
  return {
    pts: g.opp_pts, fgm: g.opp_fgm, fga: g.opp_fga, tpm: g.opp_tpm, tpa: g.opp_tpa,
    ftm: g.opp_ftm, fta: g.opp_fta, oreb: g.opp_oreb, dreb: g.opp_dreb,
    ast: g.opp_ast, stl: g.opp_stl, blk: g.opp_blk, to: g.opp_to, pf: g.opp_pf,
    pitp: g.opp_pitp, fbp: g.opp_fbp, scp: g.opp_scp, bp: g.opp_bp,
    largest_lead: g.opp_largest_lead,
    fg_pct: g.opp_fg_pct, tp_pct: g.opp_tp_pct, ft_pct: g.opp_ft_pct, reb: g.opp_reb,
    oreb_pct: g.opp_oreb_pct, dreb_pct: g.opp_dreb_pct,
    ts_pct: g.opp_ts_pct, efg_pct: g.opp_efg_pct, tov_pct: g.opp_tov_pct, ast_to: g.opp_ast_to, ft_rate: g.opp_ft_rate,
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
          <div className="ct-row">W avg: {d.payload.wAvg}{d.payload.isPct ? '%' : ''}</div>
          <div className="ct-row">L avg: {d.payload.lAvg}{d.payload.isPct ? '%' : ''}</div>
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

    const complete = g => g.completed !== false && g.completed !== 'false';

    return IMPACT_STATS
      .map(stat => {
        // Pct stats: use all games. Quantity stats: complete games only.
        const filter = g => stat.isPct ? g[stat.key] !== 'na' : complete(g) && g[stat.key] !== 'na';
        const allG   = all.filter(filter);
        const wG     = wins.filter(filter);
        const lG     = losses.filter(filter);
        if (!wG.length || !lG.length || !allG.length) return null;

        const allVals = allG.map(g => parseFloat(g[stat.key]) || 0);
        const wVals   = wG.map(g   => parseFloat(g[stat.key]) || 0);
        const lVals   = lG.map(g   => parseFloat(g[stat.key]) || 0);

        const allMean  = allVals.reduce((a, b) => a + b, 0) / allVals.length;
        const variance = allVals.reduce((s, v) => s + (v - allMean) ** 2, 0) / allVals.length;
        const sd       = Math.sqrt(variance);
        if (!sd) return null;

        const wMean = wVals.reduce((a, b) => a + b, 0) / wVals.length;
        const lMean = lVals.reduce((a, b) => a + b, 0) / lVals.length;
        const cohen = (wMean - lMean) / sd;
        const impact = stat.lowerIsBetter ? -cohen : cohen;

        // For pct stats, display aggregate (sum makes / sum attempts) rather than avg of per-game pcts
        const wDisplay = stat.isPct ? avgStat(wins,   stat.key) : wMean;
        const lDisplay = stat.isPct ? avgStat(losses, stat.key) : lMean;

        return {
          key:       stat.key,
          label:     stat.label,
          fullLabel: stat.fullLabel,
          impact:    parseFloat(impact.toFixed(3)),
          wAvg:      (isNaN(wDisplay) ? wMean : wDisplay).toFixed(stat.isPct ? 1 : 1),
          lAvg:      (isNaN(lDisplay) ? lMean : lDisplay).toFixed(stat.isPct ? 1 : 1),
          isPct:     stat.isPct,
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
                <span className="win-text">{d.wAvg}{d.isPct ? '%' : ''}</span> W &nbsp;/&nbsp;
                <span className="loss-text">{d.lAvg}{d.isPct ? '%' : ''}</span> L
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

// ─── Shot Value Card ──────────────────────────────────────────────────────────

function ShotValueCard({ games }) {
  const stats = useMemo(() => {
    // 3P: any game with tpm/tpa both present (not na, not empty)
    const threeGames = games.filter(g =>
      g.tpm !== 'na' && g.tpa !== 'na' &&
      g.tpm !== '' && g.tpm !== undefined &&
      g.tpa !== '' && g.tpa !== undefined
    );
    const tot3PM = threeGames.reduce((s, g) => s + (parseFloat(g.tpm) || 0), 0);
    const tot3PA = threeGames.reduce((s, g) => s + (parseFloat(g.tpa) || 0), 0);
    const pct3   = tot3PA > 0 ? tot3PM / tot3PA : NaN;
    const val3   = isNaN(pct3) ? NaN : pct3 * 3;

    // 2P: needs fgm, fga, tpm, tpa all present (not na, not empty) to isolate 2PA = FGA − 3PA
    const twoGames = games.filter(g =>
      g.fgm !== 'na' && g.fga !== 'na' &&
      g.tpm !== 'na' && g.tpa !== 'na' &&
      g.fgm !== '' && g.fgm !== undefined &&
      g.fga !== '' && g.fga !== undefined &&
      g.tpm !== '' && g.tpm !== undefined &&
      g.tpa !== '' && g.tpa !== undefined
    );
    const tot2PM = twoGames.reduce((s, g) => s + Math.max(0, (parseFloat(g.fgm) || 0) - (parseFloat(g.tpm) || 0)), 0);
    const tot2PA = twoGames.reduce((s, g) => s + Math.max(0, (parseFloat(g.fga) || 0) - (parseFloat(g.tpa) || 0)), 0);
    const pct2   = tot2PA > 0 ? tot2PM / tot2PA : NaN;
    const val2   = isNaN(pct2) ? NaN : pct2 * 2;

    return { val2, val3, pct2, pct3, games2: twoGames.length, games3: threeGames.length, tot2PA, tot3PA };
  }, [games]);

  const { val2, val3, pct2, pct3, games2, games3, tot2PA, tot3PA } = stats;
  const bothKnown = !isNaN(val2) && !isNaN(val3);
  const diff      = bothKnown ? val3 - val2 : NaN;

  if (isNaN(val2) && isNaN(val3)) {
    return (
      <div className="card">
        <div className="card-title">Shot Value</div>
        <p className="text-dim" style={{ fontSize: 13 }}>Not enough shooting data to calculate shot values.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">Shot Value — Expected Points Per Attempt</div>
      <p className="text-dim" style={{ fontSize: 13, marginBottom: 20 }}>
        How many points each shot type is worth to you on average, derived from your aggregated shooting percentages across all games with available data.
      </p>
      <div className="shot-value-grid">
        <div className={`shot-value-card${bothKnown && val2 >= val3 ? ' sv-better' : ''}`}>
          <div className="sv-label">2-POINTER</div>
          <div className="sv-value">{isNaN(val2) ? '—' : val2.toFixed(3)}</div>
          <div className="sv-sub">pts per attempt</div>
          <div className="sv-pct">{isNaN(pct2) ? '—' : (pct2 * 100).toFixed(1) + '% 2P%'}</div>
          <div className="sv-games">{games2}g · {tot2PA} att</div>
        </div>
        <div className="sv-vs">VS</div>
        <div className={`shot-value-card${bothKnown && val3 >= val2 ? ' sv-better' : ''}`}>
          <div className="sv-label">3-POINTER</div>
          <div className="sv-value">{isNaN(val3) ? '—' : val3.toFixed(3)}</div>
          <div className="sv-sub">pts per attempt</div>
          <div className="sv-pct">{isNaN(pct3) ? '—' : (pct3 * 100).toFixed(1) + '% 3P%'}</div>
          <div className="sv-games">{games3}g · {tot3PA} att</div>
        </div>
      </div>
      {bothKnown && (
        <div className="sv-conclusion">
          Your <strong>{diff >= 0 ? '3-pointer' : '2-pointer'}</strong> generates{' '}
          <strong>{Math.abs(diff).toFixed(3)}</strong> more expected points per attempt.
          {(tot2PA < 20 || tot3PA < 20) && (
            <span className="text-dim"> Small sample — results may shift as you log more games.</span>
          )}
        </div>
      )}
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

const OPP_KEY_CHART_STATS = [
  { key: 'opp_pts',    label: 'PTS'  },
  { key: 'opp_fg_pct', label: 'FG%'  },
  { key: 'opp_tp_pct', label: '3P%'  },
  { key: 'opp_reb',    label: 'REB'  },
  { key: 'opp_ast',    label: 'AST'  },
  { key: 'opp_stl',    label: 'STL'  },
  { key: 'opp_to',     label: 'TO'   },
  { key: 'opp_pitp',   label: 'PITP' },
];

function KeyStatsChart({ wins, losses, winLabel, lossLabel, title, stats }) {
  const chartStats = stats ?? KEY_CHART_STATS;
  const data = useMemo(() => {
    return chartStats.map(s => ({
      name: s.label,
      W: parseFloat(avgStat(wins,   s.key).toFixed(1)),
      L: parseFloat(avgStat(losses, s.key).toFixed(1)),
    })).filter(d => !isNaN(d.W) && !isNaN(d.L));
  }, [wins, losses, chartStats]);

  if (!data.length) return null;

  return (
    <div className="card">
      <div className="card-title">{title ?? 'Key Stats — Win vs Loss'}</div>
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

// ─── Four Factors Card ────────────────────────────────────────────────────────

const FOUR_FACTORS = [
  { key: 'efg_pct',  oppKey: 'opp_efg_pct',  label: 'eFG%',    desc: 'Effective FG%',      note: '(FGM + 0.5×3PM) / FGA', weight: 40, lowerIsBetter: false },
  { key: 'tov_pct',  oppKey: 'opp_tov_pct',  label: 'TOV%',    desc: 'Turnover %',          note: 'TO / (FGA + 0.44×FTA + TO)', weight: 25, lowerIsBetter: true  },
  { key: 'oreb_pct', oppKey: 'opp_oreb_pct', label: 'OREB%',   desc: 'Off. Reb. %',         note: 'OREB / Missed FGA',     weight: 20, lowerIsBetter: false },
  { key: 'ft_rate',  oppKey: 'opp_ft_rate',  label: 'FT Rate', desc: 'Free Throw Rate',     note: 'FTA / FGA',             weight: 15, lowerIsBetter: false },
];

function FourFactorsCard({ enriched, wins, losses }) {
  const rows = useMemo(() => FOUR_FACTORS.map(f => {
    const myOverall  = avgStat(enriched, f.key);
    const oppOverall = avgStat(enriched, f.oppKey);
    const myWin      = avgStat(wins,     f.key);
    const myLoss     = avgStat(losses,   f.key);
    const myWon = !isNaN(myOverall) && !isNaN(oppOverall) &&
      (f.lowerIsBetter ? myOverall < oppOverall : myOverall > oppOverall);
    return { ...f, myOverall, oppOverall, myWin, myLoss, myWon };
  }), [enriched, wins, losses]);

  const valid       = rows.filter(r => !isNaN(r.myOverall) && !isNaN(r.oppOverall));
  const myFactors   = valid.filter(r => r.myWon).length;
  const oppFactors  = valid.length - myFactors;

  return (
    <div className="card">
      <div className="card-title-row">
        <div className="card-title">Four Factors</div>
        <div className="card-subtitle">Dean Oliver's framework for winning</div>
      </div>
      <p className="text-dim" style={{ fontSize: 12, marginBottom: 16 }}>
        The four most predictive stats for team success — weighted by their correlation with winning.
      </p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 160 }}>Factor</th>
              <th style={{ fontSize: 10, color: 'var(--text-muted)' }}>Weight</th>
              <th className="my-header">My Team</th>
              <th className="opp-header">Opponent</th>
              <th>Edge</th>
              <th className="win-header">In Wins</th>
              <th className="loss-header">In Losses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const hasData = !isNaN(r.myOverall) && !isNaN(r.oppOverall);
              return (
                <tr key={r.key}>
                  <td style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>{r.desc}</span>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{r.note}</div>
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>{r.weight}%</td>
                  <td className={`num-cell ${hasData ? (r.myWon ? 'win-text' : 'loss-text') : ''}`} style={{ fontWeight: 600 }}>
                    {fmt(r.myOverall, true)}
                  </td>
                  <td className={`num-cell ${hasData ? (r.myWon ? 'loss-text' : 'win-text') : ''}`} style={{ fontWeight: 600 }}>
                    {fmt(r.oppOverall, true)}
                  </td>
                  <td>
                    {!hasData
                      ? <span className="text-dim" style={{ fontSize: 12 }}>—</span>
                      : <span className={`badge badge-${r.myWon ? 'win' : 'loss'}`}>{r.myWon ? 'Me' : 'Opp'}</span>
                    }
                  </td>
                  <td className="num-cell win-avg">{fmt(r.myWin, true)}</td>
                  <td className="num-cell loss-avg">{fmt(r.myLoss, true)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {valid.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-dim)' }}>
          Overall factor edge:{' '}
          <strong style={{ color: myFactors >= oppFactors ? 'var(--win)' : 'var(--loss)' }}>
            {myFactors}–{oppFactors}
          </strong>{' '}in your favor
        </div>
      )}
    </div>
  );
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────

const TREND_STATS = [
  { key: 'pts',     label: 'PTS',      isPct: false },
  { key: 'ts_pct',  label: 'TS%',      isPct: true  },
  { key: 'efg_pct', label: 'eFG%',     isPct: true  },
  { key: 'fg_pct',  label: 'FG%',      isPct: true  },
  { key: 'tp_pct',  label: '3P%',      isPct: true  },
  { key: 'tov_pct', label: 'TOV%',     isPct: true  },
  { key: 'ast_to',  label: 'AST/TO',   isPct: false, decimals: 2 },
  { key: 'oreb_pct',label: 'OREB%',    isPct: true  },
  { key: 'dreb_pct',label: 'DREB%',    isPct: true  },
  { key: 'reb',     label: 'REB',      isPct: false },
  { key: 'ast',     label: 'AST',      isPct: false },
  { key: 'to',      label: 'TO',       isPct: false },
  { key: 'ft_rate', label: 'FT Rate',  isPct: true  },
];

const TREND_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <div className="ct-label">{d?.date || label}</div>
      {d?.result && (
        <div className="ct-row" style={{ color: d.result === 'W' ? CHART_COLORS.win : CHART_COLORS.loss }}>
          Result: <strong>{d.result}</strong>
        </div>
      )}
      {payload.map(p => (
        <div key={p.name} className="ct-row" style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(p.name === 'AST/TO' ? 2 : 1) : p.value}</strong>
          {p.payload?.isPct ? '%' : ''}
        </div>
      ))}
    </div>
  );
};

function TrendChart({ enriched }) {
  const [trendStat,   setTrendStat]   = useState('ts_pct');
  const [trendWindow, setTrendWindow] = useState('all');

  const statDef = TREND_STATS.find(s => s.key === trendStat) || TREND_STATS[0];

  const chartData = useMemo(() => {
    const sorted = [...enriched]
      .filter(g => g[trendStat] !== 'na' && g[trendStat] !== '' && g[trendStat] != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const windowed = trendWindow === 'all' ? sorted : sorted.slice(-parseInt(trendWindow));
    const vals = windowed.map(g => parseFloat(g[trendStat]));

    return windowed.map((g, i) => {
      const slice  = vals.slice(Math.max(0, i - 2), i + 1);
      const rolAvg = parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2));
      return {
        name:    `G${i + 1}`,
        date:    g.date,
        result:  g.result,
        isPct:   statDef.isPct,
        value:   parseFloat(vals[i].toFixed(2)),
        rolling: rolAvg,
      };
    });
  }, [enriched, trendStat, trendWindow, statDef.isPct]);

  const CustomDot = ({ cx, cy, payload }) => {
    const color = payload?.result === 'W' ? CHART_COLORS.win : CHART_COLORS.loss;
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke={CHART_COLORS.bg} strokeWidth={1} />;
  };

  if (enriched.length < 2) return null;

  return (
    <div className="card">
      <div className="card-title-row">
        <div className="card-title">Performance Trend</div>
        <div className="card-subtitle">Individual games + 3-game rolling average</div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="filter-select" value={trendStat} onChange={e => setTrendStat(e.target.value)}>
          {TREND_STATS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="filter-op" value={trendWindow} onChange={e => setTrendWindow(e.target.value)}>
          <option value="all">All games</option>
          <option value="10">Last 10</option>
          <option value="5">Last 5</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS.win, marginRight: 4 }} />W
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS.loss, margin: '0 4px 0 10px' }} />L
          <span style={{ display: 'inline-block', width: 20, height: 2, background: CHART_COLORS.accent, marginRight: 4, verticalAlign: 'middle' }} />3-game avg
        </span>
      </div>
      {chartData.length < 2
        ? <p className="text-dim" style={{ fontSize: 13 }}>Not enough data for this stat.</p>
        : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={{ stroke: CHART_COLORS.border }} tickLine={false} />
              <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
              <Tooltip content={<TREND_TOOLTIP />} cursor={{ stroke: CHART_COLORS.muted, strokeWidth: 1 }} />
              <Line type="monotone" dataKey="value" name={statDef.label} stroke={CHART_COLORS.muted} strokeWidth={1} dot={<CustomDot />} connectNulls />
              <Line type="monotone" dataKey="rolling" name="3-game avg" stroke={CHART_COLORS.accent} strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )
      }
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

  const streakInfo = useMemo(() => {
    if (!enriched.length) return null;
    const sorted = [...enriched].sort((a, b) => new Date(a.date) - new Date(b.date));
    const currResult = sorted[sorted.length - 1].result;
    let currLen = 0;
    for (let i = sorted.length - 1; i >= 0 && sorted[i].result === currResult; i--) currLen++;
    let longestW = 0, longestL = 0, runW = 0, runL = 0;
    for (const g of sorted) {
      if (g.result === 'W') { runW++; runL = 0; longestW = Math.max(longestW, runW); }
      else                  { runL++; runW = 0; longestL = Math.max(longestL, runL); }
    }
    return { currResult, currLen, longestW, longestL };
  }, [enriched]);

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
        {streakInfo && (
          <div className={`overview-card ${streakInfo.currResult === 'W' ? 'win-card' : 'loss-card'}`}>
            <div className={`overview-val ${streakInfo.currResult === 'W' ? 'win-text' : 'loss-text'}`}>
              {streakInfo.currResult}{streakInfo.currLen}
            </div>
            <div className="overview-lbl">Current Streak</div>
          </div>
        )}
        {streakInfo && (
          <div className="overview-card win-card">
            <div className="overview-val win-text">{streakInfo.longestW}</div>
            <div className="overview-lbl">Best Win Streak</div>
          </div>
        )}
      </div>

      {/* Shot Value */}
      <ShotValueCard games={games} />

      {/* Four Factors */}
      <FourFactorsCard enriched={enriched} wins={myWins} losses={myLosses} />

      {/* Win Impact */}
      <WinImpactSection
        all={activeAll}
        wins={activeWins}
        losses={activeLosses}
        subtitle={impactSubtitle}
      />

      {/* Key Stats Chart — My Team */}
      {activeWins.length > 0 && activeLosses.length > 0 && (
        <KeyStatsChart
          wins={activeWins}
          losses={activeLosses}
          winLabel={wLabel}
          lossLabel={lLabel}
          title="My Team — Key Stats Win vs Loss"
        />
      )}

      {/* Key Stats Chart — Opponent (My W/L mode only) */}
      {mode === 'my' && activeWins.length > 0 && activeLosses.length > 0 && (
        <KeyStatsChart
          wins={activeWins}
          losses={activeLosses}
          winLabel="In My Wins"
          lossLabel="In My Losses"
          title="Opponent — Key Stats Win vs Loss"
          stats={OPP_KEY_CHART_STATS}
        />
      )}

      {/* Performance Trend */}
      <TrendChart enriched={enriched} />

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
