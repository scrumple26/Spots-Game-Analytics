export function enrichGame(g) {
  const na = k => g[k] === 'na';
  const n  = k => parseFloat(g[k]) || 0;

  const fga = n('fga'), fgm = n('fgm');
  const tpa = n('tpa'), tpm = n('tpm');
  const fta = n('fta'), ftm = n('ftm');
  const opp_fga = n('opp_fga'), opp_fgm = n('opp_fgm');
  const opp_tpa = n('opp_tpa'), opp_tpm = n('opp_tpm');
  const opp_fta = n('opp_fta'), opp_ftm = n('opp_ftm');

  return {
    ...g,
    result:      n('pts') > n('opp_pts') ? 'W' : 'L',
    fg_pct:      (na('fgm') || na('fga'))           ? 'na' : fga ? (fgm / fga) * 100 : 0,
    tp_pct:      (na('tpm') || na('tpa'))           ? 'na' : tpa ? (tpm / tpa) * 100 : 0,
    ft_pct:      (na('ftm') || na('fta'))           ? 'na' : fta ? (ftm / fta) * 100 : 0,
    reb:         (na('oreb') || na('dreb'))         ? 'na' : n('oreb') + n('dreb'),
    opp_fg_pct:  (na('opp_fgm') || na('opp_fga'))  ? 'na' : opp_fga ? (opp_fgm / opp_fga) * 100 : 0,
    opp_tp_pct:  (na('opp_tpm') || na('opp_tpa'))  ? 'na' : opp_tpa ? (opp_tpm / opp_tpa) * 100 : 0,
    opp_ft_pct:  (na('opp_ftm') || na('opp_fta'))  ? 'na' : opp_fta ? (opp_ftm / opp_fta) * 100 : 0,
    opp_reb:     (na('opp_oreb') || na('opp_dreb')) ? 'na' : n('opp_oreb') + n('opp_dreb'),
  };
}

export function avgStat(games, key) {
  if (!games.length) return NaN;

  // Percentage stats: include games that have the raw components (skip na games for that ratio).
  // Per rule: percentages can be pulled from partial games, quantities cannot.
  const ratioMap = {
    fg_pct:     ['fgm',     'fga'],
    tp_pct:     ['tpm',     'tpa'],
    ft_pct:     ['ftm',     'fta'],
    opp_fg_pct: ['opp_fgm', 'opp_fga'],
    opp_tp_pct: ['opp_tpm', 'opp_tpa'],
    opp_ft_pct: ['opp_ftm', 'opp_fta'],
  };
  if (ratioMap[key]) {
    const [mKey, aKey] = ratioMap[key];
    const valid = games.filter(g => g[mKey] !== 'na' && g[aKey] !== 'na');
    if (!valid.length) return NaN;
    const m = valid.reduce((s, g) => s + (parseFloat(g[mKey]) || 0), 0);
    const a = valid.reduce((s, g) => s + (parseFloat(g[aKey]) || 0), 0);
    return a ? (m / a) * 100 : NaN;
  }

  // Quantity totals (reb, opp_reb): only count games where both components are present.
  const sumKey = { reb: ['oreb', 'dreb'], opp_reb: ['opp_oreb', 'opp_dreb'] };
  if (sumKey[key]) {
    const [a, b] = sumKey[key];
    const valid = games.filter(g => g[a] !== 'na' && g[b] !== 'na');
    if (!valid.length) return NaN;
    return valid.reduce((s, g) => s + (parseFloat(g[a]) || 0) + (parseFloat(g[b]) || 0), 0) / valid.length;
  }

  // Simple quantity stats: skip games where this stat is na.
  const valid = games.filter(g => g[key] !== 'na');
  if (!valid.length) return NaN;
  return valid.reduce((s, g) => s + (parseFloat(g[key]) || 0), 0) / valid.length;
}

export function stdDev(games, key) {
  const valid = games.filter(g => g[key] !== 'na');
  if (valid.length < 2) return 0;
  const vals = valid.map(g => parseFloat(g[key]) || 0);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

export function winPct(games) {
  if (!games.length) return NaN;
  return games.filter(g => g.result === 'W').length / games.length * 100;
}

export function fmt(val, isPct = false) {
  if (isNaN(val) || !isFinite(val)) return '—';
  return isPct ? val.toFixed(1) + '%' : val.toFixed(1);
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h =>
    h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  );
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return row;
  });
}

export function toCSV(games) {
  const headers = [
    'date','pts','opp_pts',
    'fgm','fga','tpm','tpa','ftm','fta',
    'oreb','dreb','ast','stl','blk','to','pf',
    'pitp','fbp','scp','bp','largest_lead',
    'opp_fgm','opp_fga','opp_tpm','opp_tpa','opp_ftm','opp_fta',
    'opp_oreb','opp_dreb','opp_ast','opp_stl','opp_blk','opp_to','opp_pf',
    'opp_pitp','opp_fbp','opp_scp','opp_bp','opp_largest_lead',
    'completed',
  ];
  const rows = games.map(g => headers.map(h => g[h] ?? '').join(','));
  return [headers.join(','), ...rows].join('\n');
}
