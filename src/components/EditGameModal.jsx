import { useState, Fragment } from 'react';
import { FORM_SECTIONS } from '../constants.js';

function calcPct(m, a) {
  const mv = parseFloat(m), av = parseFloat(a);
  if (m === '' || a === '' || !av || isNaN(mv)) return null;
  return (mv / av * 100).toFixed(1) + '%';
}

function calcSum(a, b) {
  if (a === '' && b === '') return null;
  return (parseFloat(a) || 0) + (parseFloat(b) || 0);
}

function NumInput({ value, onChange }) {
  return (
    <input
      className="stat-input"
      type="number"
      min="0"
      placeholder="0"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function NaCell({ isNa, onSetNa, onClearNa, children }) {
  return isNa ? (
    <div className="na-wrap">
      <span className="na-tag">N/A</span>
      <button type="button" className="na-clear-btn" onClick={onClearNa}>✕</button>
    </div>
  ) : (
    <div className="na-wrap">
      {children}
      <button type="button" className="na-set-btn" onClick={onSetNa}>N/A</button>
    </div>
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

export default function EditGameModal({ game, onSave, onClose }) {
  const [form, setForm] = useState({ ...game });
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  function handleSubmit(e) {
    e.preventDefault();
    onSave(game.id, form);
    onClose();
  }

  function renderRow(row) {
    if (row.type === 'simple') {
      return (
        <tr key={row.label} className="comp-row">
          <td className="row-label">{row.label}</td>
          <td>
            <NaCell isNa={form[row.my] === 'na'} onSetNa={() => set(row.my, 'na')} onClearNa={() => set(row.my, '')}>
              <NumInput value={form[row.my] ?? ''} onChange={v => set(row.my, v)} />
            </NaCell>
          </td>
          <td>
            <NaCell isNa={form[row.opp] === 'na'} onSetNa={() => set(row.opp, 'na')} onClearNa={() => set(row.opp, '')}>
              <NumInput value={form[row.opp] ?? ''} onChange={v => set(row.opp, v)} />
            </NaCell>
          </td>
        </tr>
      );
    }
    if (row.type === 'ratio') {
      return (
        <tr key={row.label} className="comp-row">
          <td className="row-label">{row.label}</td>
          <td>
            <NaCell isNa={form[row.myM] === 'na' || form[row.myA] === 'na'} onSetNa={() => { set(row.myM, 'na'); set(row.myA, 'na'); }} onClearNa={() => { set(row.myM, ''); set(row.myA, ''); }}>
              <RatioCell m={form[row.myM] ?? ''} a={form[row.myA] ?? ''} onM={v => set(row.myM, v)} onA={v => set(row.myA, v)} />
            </NaCell>
          </td>
          <td>
            <NaCell isNa={form[row.oppM] === 'na' || form[row.oppA] === 'na'} onSetNa={() => { set(row.oppM, 'na'); set(row.oppA, 'na'); }} onClearNa={() => { set(row.oppM, ''); set(row.oppA, ''); }}>
              <RatioCell m={form[row.oppM] ?? ''} a={form[row.oppA] ?? ''} onM={v => set(row.oppM, v)} onA={v => set(row.oppA, v)} />
            </NaCell>
          </td>
        </tr>
      );
    }
    if (row.type === 'pair') {
      return (
        <tr key={row.label} className="comp-row">
          <td className="row-label">{row.label}</td>
          <td>
            <NaCell isNa={form[row.myA] === 'na' || form[row.myB] === 'na'} onSetNa={() => { set(row.myA, 'na'); set(row.myB, 'na'); }} onClearNa={() => { set(row.myA, ''); set(row.myB, ''); }}>
              <PairCell a={form[row.myA] ?? ''} b={form[row.myB] ?? ''} onA={v => set(row.myA, v)} onB={v => set(row.myB, v)} sumLabel={row.sumLabel} />
            </NaCell>
          </td>
          <td>
            <NaCell isNa={form[row.oppA] === 'na' || form[row.oppB] === 'na'} onSetNa={() => { set(row.oppA, 'na'); set(row.oppB, 'na'); }} onClearNa={() => { set(row.oppA, ''); set(row.oppB, ''); }}>
              <PairCell a={form[row.oppA] ?? ''} b={form[row.oppB] ?? ''} onA={v => set(row.oppA, v)} onB={v => set(row.oppB, v)} sumLabel={row.sumLabel} />
            </NaCell>
          </td>
        </tr>
      );
    }
    return null;
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Game</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="date-team-row">
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={form.date ?? ''} onChange={e => set('date', e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>My Team</label>
                  <input type="text" placeholder="e.g. Cavaliers" value={form.team ?? ''} onChange={e => set('team', e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Opponent</label>
                  <input type="text" placeholder="e.g. Thunder" value={form.opp_team ?? ''} onChange={e => set('opp_team', e.target.value)} />
                </div>
                <div className="field" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.completed !== false && form.completed !== 'false'}
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

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
