export function enrichGame(g) {
  const n = k => parseFloat(g[k]) || 0;

  const fga = n('fga'), fgm = n('fgm');
  const tpa = n('tpa'), tpm = n('tpm');
  const fta = n('fta'), ftm = n('ftm');
  const opp_fga = n('opp_fga'), opp_fgm = n('opp_fgm');
  const opp_tpa = n('opp_tpa'), opp_tpm = n('opp_tpm');
  const opp_fta = n('opp_fta'), opp_ftm = n('opp_ftm');

  return {
    ...g,
    result:      n('pts') > n('opp_pts') ? 'W' : 'L',
    fg_pct:      fga      ? (fgm / fga)      * 100 : 0,
    tp_pct:      tpa      ? (tpm / tpa)      * 100 : 0,
    ft_pct:      fta      ? (ftm / fta)      * 100 : 0,
    reb:         n('oreb') + n('dreb'),
    opp_fg_pct:  opp_fga  ? (opp_fgm / opp_fga) * 100 : 0,
    opp_tp_pct:  opp_tpa  ? (opp_tpm / opp_tpa) * 100 : 0,
    opp_ft_pct:  opp_fta  ? (opp_ftm / opp_fta) * 100 : 0,
    opp_reb:     n('opp_oreb') + n('opp_dreb'),
  };
}

export function avgStat(games, key) {
  if (!games.length) return NaN;

  // Percentage stats: compute from totals (not average of averages)
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
    const m = games.reduce((s, g) => s + (parseFloat(g[mKey]) || 0), 0);
    const a = games.reduce((s, g) => s + (parseFloat(g[aKey]) || 0), 0);
    return a ? (m / a) * 100 : NaN;
  }

  const sumKey = { reb: ['oreb', 'dreb'], opp_reb: ['opp_oreb', 'opp_dreb'] };
  if (sumKey[key]) {
    const [a, b] = sumKey[key];
    return games.reduce((s, g) => s + (parseFloat(g[a]) || 0) + (parseFloat(g[b]) || 0), 0) / games.length;
  }

  return games.reduce((s, g) => s + (parseFloat(g[key]) || 0), 0) / games.length;
}

export function stdDev(games, key) {
  if (games.length < 2) return 0;
  const vals = games.map(g => parseFloat(g[key]) || 0);
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
