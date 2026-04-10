import { useState, Fragment } from 'react';
import { FORM_SECTIONS, EMPTY_FORM } from '../constants.js';
import { parseCSV } from '../utils/stats.js';

function calcPct(m, a) {
  const mv = parseFloat(m), av = parseFloat(a);
  if (m === '' || a === '' || !av || isNaN(mv)) return null;
  return (mv / av * 100).toFixed(1) + '%';
}

function calcSum(a, b) {
  if (a === '' && b === '') return null;
  return (parseFloat(a) || 0) + (parseFloat(b) || 0);
}

function NumInput({ value, onChange, highlight }) {
  return (
    <input
      className={`stat-input${highlight ? ' highlight' : ''}`}
      type="number"
      min="0"
      placeholder="0"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function RatioCell({ m, a, onM, onA }) {
  const p = calcPct(m, a);
  return (
    <div className="ratio-cell">
      <NumInput value={m} onChange={onM} />
      <span className="slash">/</span>
      <NumInput value={a} onChange={onA} />
      <span className={`ratio-pct${p ? ' has-val' : ''}`}>{p ?? '—'}</span>
    </div>
  );
}

function PairCell({ a, b, onA, onB, sumLabel }) {
  const s = calcSum(a, b);
  return (
    <div className="ratio-cell">
      <NumInput value={a} onChange={onA} />
      <span className="slash">/</span>
      <NumInput value={b} onChange={onB} />
      <span className={`ratio-pct${s !== null ? ' has-val' : ''}`}>
        {s !== null ? `${sumLabel} ${s}` : '—'}
      </span>
    </div>
  );
}

export default function LogGame({ onAdd, onAddMany }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab]   = useState('manual');
  const [saveMsg, setSaveMsg] = useState(null);
  const [csvMsg,  setCsvMsg]  = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  function flash(setter, text, error = false) {
    setter({ text, error });
    setTimeout(() => setter(null), 3500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.pts || !form.opp_pts) {
      flash(setSaveMsg, 'Points (PTS and OPP PTS) are required.', true);
      return;
    }
    onAdd(form);
    setForm({ ...EMPTY_FORM, date: form.date });
    flash(setSaveMsg, 'Game saved!');
  }

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const rows  = parseCSV(ev.target.result);
        const valid = rows.filter(r => r.pts && r.opp_pts);
        if (!valid.length) {
          flash(setCsvMsg, 'No valid rows found. Need at least pts and opp_pts columns.', true);
          return;
        }
        onAddMany(valid);
        flash(setCsvMsg, `${valid.length} game${valid.length > 1 ? 's' : ''} imported.`);
      } catch {
        flash(setCsvMsg, 'Failed to parse CSV.', true);
      }
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const h = 'date,pts,opp_pts,fgm,fga,tpm,tpa,ftm,fta,oreb,dreb,ast,stl,blk,to,pf,pitp,fbp,scp,bp,largest_lead,opp_fgm,opp_fga,opp_tpm,opp_tpa,opp_ftm,opp_fta,opp_oreb,opp_dreb,opp_ast,opp_stl,opp_blk,opp_to,opp_pf,opp_pitp,opp_fbp,opp_scp,opp_bp,opp_largest_lead,completed';
    const ex = '2024-04-10,108,95,38,82,12,28,20,24,10,32,22,8,4,14,18,44,18,10,28,15,35,80,10,27,18,22,8,30,20,7,5,16,20,40,15,8,25,10,true';
    const blob = new Blob([h + '\n' + ex], { type: 'text/csv' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'sgl_template.csv' }).click();
  }

  function renderRow(row) {
    if (row.type === 'simple') {
      return (
        <tr key={row.label} className="comp-row">
          <td className="row-label">{row.label}</td>
          <td><NumInput value={form[row.my]}  onChange={v => set(row.my,  v)} /></td>
          <td><NumInput value={form[row.opp]} onChange={v => set(row.opp, v)} /></td>
        </tr>
      );
    }
    if (row.type === 'ratio') {
      return (
        <tr key={row.label} className="comp-row">
          <td className="row-label">{row.label}</td>
          <td>
            <RatioCell
              m={form[row.myM]}  a={form[row.myA]}
              onM={v => set(row.myM, v)} onA={v => set(row.myA, v)}
            />
          </td>
          <td>
            <RatioCell
              m={form[row.oppM]} a={form[row.oppA]}
              onM={v => set(row.oppM, v)} onA={v => set(row.oppA, v)}
            />
          </td>
        </tr>
      );
    }
    if (row.type === 'pair') {
      return (
        <tr key={row.label} className="comp-row">
          <td className="row-label">{row.label}</td>
          <td>
            <PairCell
              a={form[row.myA]}  b={form[row.myB]}
              onA={v => set(row.myA, v)} onB={v => set(row.myB, v)}
              sumLabel={row.sumLabel}
            />
          </td>
          <td>
            <PairCell
              a={form[row.oppA]} b={form[row.oppB]}
              onA={v => set(row.oppA, v)} onB={v => set(row.oppB, v)}
              sumLabel={row.sumLabel}
            />
          </td>
        </tr>
      );
    }
    return null;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Log Game</h1>
        <div className="subtabs">
          <button className={`subtab${tab === 'manual' ? ' active' : ''}`} onClick={() => setTab('manual')}>Manual Entry</button>
          <button className={`subtab${tab === 'csv'    ? ' active' : ''}`} onClick={() => setTab('csv')}>CSV Upload</button>
        </div>
      </div>

      {tab === 'manual' && (
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="date-team-row">
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>My Team</label>
                <input type="text" placeholder="e.g. Cavaliers" value={form.team} onChange={e => set('team', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Opponent</label>
                <input type="text" placeholder="e.g. Thunder" value={form.opp_team} onChange={e => set('opp_team', e.target.value)} />
              </div>
              <div className="field" style={{ justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.completed !== false}
                    onChange={e => set('completed', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  Game Complete
                </label>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="comp-table">
              <thead>
                <tr>
                  <th className="row-label-header"></th>
                  <th className="team-header my-header">MY TEAM</th>
                  <th className="team-header opp-header">OPPONENT</th>
                </tr>
              </thead>
              <tbody>
                {FORM_SECTIONS.map(section => (
                  <Fragment key={section.name}>
                    <tr className="group-header-row">
                      <td colSpan={3}>{section.name.toUpperCase()}</td>
                    </tr>
                    {section.rows.map(row => renderRow(row))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            {saveMsg && <span className={`inline-msg${saveMsg.error ? ' error' : ''}`}>{saveMsg.text}</span>}
            <button type="submit" className="btn btn-primary btn-lg">Save Game</button>
          </div>
        </form>
      )}

      {tab === 'csv' && (
        <div className="card">
          <div className="card-title">Upload CSV</div>
          <p className="text-dim" style={{ marginBottom: 16, fontSize: 13 }}>
            Upload a CSV with game stats. Each row is one game. Download the template to see all column names.
          </p>
          <div className="csv-actions">
            <label className="btn btn-primary">
              Choose CSV File
              <input type="file" accept=".csv,text/csv" onChange={handleCSV} hidden />
            </label>
            <button className="btn btn-secondary" onClick={downloadTemplate} type="button">
              Download Template
            </button>
          </div>
          {csvMsg && (
            <div className={`inline-msg${csvMsg.error ? ' error' : ''}`} style={{ marginTop: 16 }}>
              {csvMsg.text}
            </div>
          )}
          <div className="csv-hint" style={{ marginTop: 20 }}>
            <div className="hint-title">Minimum required columns:</div>
            <code>date, pts, opp_pts</code>
            <div className="hint-title" style={{ marginTop: 10 }}>All supported columns:</div>
            <code>date, pts, opp_pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, to, pf, pitp, fbp, scp, bp, largest_lead, opp_fgm, opp_fga, opp_tpm, opp_tpa, opp_ftm, opp_fta, opp_oreb, opp_dreb, opp_ast, opp_stl, opp_blk, opp_to, opp_pf, opp_pitp, opp_fbp, opp_scp, opp_bp, opp_largest_lead, completed</code>
          </div>
        </div>
      )}
    </div>
  );
}
