// ─── Form sections (drives LogGame side-by-side MY TEAM | OPPONENT layout) ───
export const FORM_SECTIONS = [
  {
    name: 'Scoring',
    rows: [
      { type: 'simple', label: 'Points', my: 'pts', opp: 'opp_pts' },
    ],
  },
  {
    name: 'Field Goals',
    rows: [
      { type: 'ratio', label: 'FG  (M / A / %)', myM: 'fgm',  myA: 'fga',  oppM: 'opp_fgm',  oppA: 'opp_fga' },
      { type: 'ratio', label: '3P  (M / A / %)', myM: 'tpm',  myA: 'tpa',  oppM: 'opp_tpm',  oppA: 'opp_tpa' },
      { type: 'ratio', label: 'FT  (M / A / %)', myM: 'ftm',  myA: 'fta',  oppM: 'opp_ftm',  oppA: 'opp_fta' },
    ],
  },
  {
    name: 'Rebounds',
    rows: [
      { type: 'pair', label: 'OREB / DREB', myA: 'oreb', myB: 'dreb', oppA: 'opp_oreb', oppB: 'opp_dreb', sumLabel: 'REB' },
    ],
  },
  {
    name: 'Defense / Other',
    rows: [
      { type: 'simple', label: 'AST', my: 'ast', opp: 'opp_ast' },
      { type: 'simple', label: 'STL', my: 'stl', opp: 'opp_stl' },
      { type: 'simple', label: 'BLK', my: 'blk', opp: 'opp_blk' },
      { type: 'simple', label: 'TO',  my: 'to',  opp: 'opp_to'  },
      { type: 'simple', label: 'PF',  my: 'pf',  opp: 'opp_pf'  },
    ],
  },
  {
    name: 'Special Points',
    rows: [
      { type: 'simple', label: 'PITP', my: 'pitp',         opp: 'opp_pitp' },
      { type: 'simple', label: 'FBP',  my: 'fbp',          opp: 'opp_fbp'  },
      { type: 'simple', label: 'SCP',  my: 'scp',          opp: 'opp_scp'  },
      { type: 'simple', label: 'BP',   my: 'bp',            opp: 'opp_bp'   },
      { type: 'simple', label: 'LEAD', my: 'largest_lead', opp: 'opp_largest_lead' },
    ],
  },
];

// ─── Analytics table rows ─────────────────────────────────────────────────────
export const ANALYTICS_STATS = [
  // MY TEAM
  { key: 'pts',          label: 'PTS',     fullLabel: 'Points' },
  { key: 'fg_pct',       label: 'FG%',     fullLabel: 'Field Goal %',    isPct: true },
  { key: 'fgm',          label: 'FGM',     fullLabel: 'FG Made' },
  { key: 'fga',          label: 'FGA',     fullLabel: 'FG Attempted' },
  { key: 'tp_pct',       label: '3P%',     fullLabel: '3-Point %',       isPct: true },
  { key: 'tpm',          label: '3PM',     fullLabel: '3P Made' },
  { key: 'tpa',          label: '3PA',     fullLabel: '3P Attempted' },
  { key: 'ft_pct',       label: 'FT%',     fullLabel: 'Free Throw %',    isPct: true },
  { key: 'ts_pct',       label: 'TS%',     fullLabel: 'True Shooting %', isPct: true },
  { key: 'efg_pct',      label: 'eFG%',    fullLabel: 'Eff. Field Goal %',isPct: true },
  { key: 'ftm',          label: 'FTM',     fullLabel: 'FT Made' },
  { key: 'fta',          label: 'FTA',     fullLabel: 'FT Attempted' },
  { key: 'ft_rate',      label: 'FT Rate', fullLabel: 'FT Rate (FTA/FGA)', isPct: true },
  { key: 'reb',          label: 'REB',     fullLabel: 'Total Rebounds' },
  { key: 'oreb',         label: 'OREB',    fullLabel: 'Off Rebounds' },
  { key: 'oreb_pct',    label: 'OREB%',   fullLabel: 'Off Reb %',          isPct: true },
  { key: 'dreb',         label: 'DREB',    fullLabel: 'Def Rebounds' },
  { key: 'dreb_pct',    label: 'DREB%',   fullLabel: 'Def Reb %',          isPct: true },
  { key: 'ast',          label: 'AST',     fullLabel: 'Assists' },
  { key: 'stl',          label: 'STL',     fullLabel: 'Steals' },
  { key: 'blk',          label: 'BLK',     fullLabel: 'Blocks' },
  { key: 'to',           label: 'TO',      fullLabel: 'Turnovers',       lowerIsBetter: true },
  { key: 'tov_pct',      label: 'TOV%',    fullLabel: 'Turnover %',      isPct: true, lowerIsBetter: true },
  { key: 'ast_to',       label: 'AST/TO',  fullLabel: 'Assist/TO Ratio' },
  { key: 'pf',           label: 'PF',      fullLabel: 'Personal Fouls',  lowerIsBetter: true },
  { key: 'pitp',         label: 'PITP',    fullLabel: 'Pts in the Paint' },
  { key: 'fbp',          label: 'FBP',     fullLabel: 'Fast Break Pts' },
  { key: 'scp',          label: 'SCP',     fullLabel: '2nd Chance Pts' },
  { key: 'bp',           label: 'BP',      fullLabel: 'Bench Points' },
  { key: 'largest_lead', label: 'LEAD',    fullLabel: 'Largest Lead' },
  // OPPONENT
  { key: 'opp_pts',          label: 'OPP PTS',  fullLabel: 'Opp Points',         lowerIsBetter: true, isOpp: true },
  { key: 'opp_fg_pct',       label: 'OPP FG%',  fullLabel: 'Opp FG %',           isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_tp_pct',       label: 'OPP 3P%',  fullLabel: 'Opp 3P %',           isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_ft_pct',       label: 'OPP FT%',  fullLabel: 'Opp FT %',           isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_ts_pct',       label: 'OPP TS%',  fullLabel: 'Opp True Shooting %', isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_efg_pct',      label: 'OPP eFG%', fullLabel: 'Opp Eff. FG %',       isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_ft_rate',      label: 'OPP FT Rate',fullLabel: 'Opp FT Rate',        isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_reb',          label: 'OPP REB',  fullLabel: 'Opp Rebounds',        lowerIsBetter: true, isOpp: true },
  { key: 'opp_oreb_pct',    label: 'OPP OREB%',fullLabel: 'Opp Off Reb %',       isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_dreb_pct',    label: 'OPP DREB%',fullLabel: 'Opp Def Reb %',       isPct: true, lowerIsBetter: true, isOpp: true },
  { key: 'opp_ast',          label: 'OPP AST',  fullLabel: 'Opp Assists',         lowerIsBetter: true, isOpp: true },
  { key: 'opp_to',           label: 'OPP TO',   fullLabel: 'Opp Turnovers',       isOpp: true },
  { key: 'opp_tov_pct',      label: 'OPP TOV%', fullLabel: 'Opp Turnover %',      isPct: true, isOpp: true },
  { key: 'opp_ast_to',       label: 'OPP AST/TO',fullLabel: 'Opp Assist/TO Ratio', isOpp: true },
  { key: 'opp_pitp',         label: 'OPP PITP', fullLabel: 'Opp Pts in the Paint',lowerIsBetter: true, isOpp: true },
];

// Stats used for Win Impact chart (my team stats only, excluding raw made/att)
export const IMPACT_STATS = [
  { key: 'pts',          label: 'PTS',  fullLabel: 'Points' },
  { key: 'fg_pct',       label: 'FG%',  fullLabel: 'Field Goal %',   isPct: true },
  { key: 'tp_pct',       label: '3P%',  fullLabel: '3-Point %',      isPct: true },
  { key: 'ft_pct',       label: 'FT%',   fullLabel: 'Free Throw %',     isPct: true },
  { key: 'ts_pct',       label: 'TS%',   fullLabel: 'True Shooting %',  isPct: true },
  { key: 'efg_pct',      label: 'eFG%',  fullLabel: 'Eff. Field Goal %',isPct: true },
  { key: 'ft_rate',      label: 'FT Rate',fullLabel: 'FT Rate (FTA/FGA)',isPct: true },
  { key: 'reb',          label: 'REB',   fullLabel: 'Total Rebounds' },
  { key: 'oreb',         label: 'OREB',  fullLabel: 'Off Rebounds' },
  { key: 'oreb_pct',    label: 'OREB%', fullLabel: 'Off Reb %',    isPct: true },
  { key: 'dreb',         label: 'DREB',  fullLabel: 'Def Rebounds' },
  { key: 'dreb_pct',    label: 'DREB%', fullLabel: 'Def Reb %',    isPct: true },
  { key: 'ast',          label: 'AST',  fullLabel: 'Assists' },
  { key: 'stl',          label: 'STL',  fullLabel: 'Steals' },
  { key: 'blk',          label: 'BLK',  fullLabel: 'Blocks' },
  { key: 'to',           label: 'TO',      fullLabel: 'Turnovers',      lowerIsBetter: true },
  { key: 'tov_pct',      label: 'TOV%',    fullLabel: 'Turnover %',     isPct: true, lowerIsBetter: true },
  { key: 'ast_to',       label: 'AST/TO',  fullLabel: 'Assist/TO Ratio' },
  { key: 'pf',           label: 'PF',      fullLabel: 'Personal Fouls', lowerIsBetter: true },
  { key: 'pitp',         label: 'PITP', fullLabel: 'Pts in the Paint' },
  { key: 'fbp',          label: 'FBP',  fullLabel: 'Fast Break Pts' },
  { key: 'scp',          label: 'SCP',  fullLabel: '2nd Chance Pts' },
  { key: 'largest_lead', label: 'LEAD', fullLabel: 'Largest Lead' },
];

// ─── Default empty form ───────────────────────────────────────────────────────
export const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  team: '', opp_team: '',
  completed: true,
  // My team
  pts: '', fgm: '', fga: '', tpm: '', tpa: '', ftm: '', fta: '',
  oreb: '', dreb: '', ast: '', stl: '', blk: '', to: '', pf: '',
  pitp: '', fbp: '', scp: '', bp: '', largest_lead: '',
  // Opponent
  opp_pts: '', opp_fgm: '', opp_fga: '', opp_tpm: '', opp_tpa: '', opp_ftm: '', opp_fta: '',
  opp_oreb: '', opp_dreb: '', opp_ast: '', opp_stl: '', opp_blk: '', opp_to: '', opp_pf: '',
  opp_pitp: '', opp_fbp: '', opp_scp: '', opp_bp: '', opp_largest_lead: '',
};
