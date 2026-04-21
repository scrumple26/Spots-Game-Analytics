import { useState } from 'react';
import { parseCSV } from '../utils/stats.js';

const KEY = 'spots_games_v1';

const ALL_COLS = 'date, pts, opp_pts, fgm, fga, tpm, tpa, ftm, fta, oreb, dreb, ast, stl, blk, to, pf, pitp, fbp, scp, bp, largest_lead, opp_fgm, opp_fga, opp_tpm, opp_tpa, opp_ftm, opp_fta, opp_oreb, opp_dreb, opp_ast, opp_stl, opp_blk, opp_to, opp_pf, opp_pitp, opp_fbp, opp_scp, opp_bp, opp_largest_lead, completed';

function flash(setter, text, error = false) {
  setter({ text, error });
  setTimeout(() => setter(null), 3500);
}

export default function ImportGuide({ onAddMany, onBack }) {
  const [jsonMsg, setJsonMsg] = useState(null);
  const [csvMsg,  setCsvMsg]  = useState(null);

  function handleJsonImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) throw new Error();
        localStorage.setItem(KEY, JSON.stringify(parsed));
        window.location.reload();
      } catch {
        flash(setJsonMsg, 'Invalid backup file. Must be a JSON array exported from this app.', true);
      }
    };
    reader.readAsText(file);
  }

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows  = parseCSV(ev.target.result);
        const valid = rows.filter(r => r.pts && r.opp_pts);
        if (!valid.length) {
          flash(setCsvMsg, 'No valid rows found. Rows must have at least pts and opp_pts columns.', true);
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
    const h = ALL_COLS.replace(/,\s*/g, ',');
    const ex = '2024-04-10,108,95,38,82,12,28,20,24,10,32,22,8,4,14,18,44,18,10,28,15,35,80,10,27,18,22,8,30,20,7,5,16,20,40,15,8,25,10,true';
    const blob = new Blob([h + '\n' + ex], { type: 'text/csv' });
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'sgl_template.csv',
    }).click();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Import Games</div>
          <p className="text-dim" style={{ fontSize: 13, marginTop: 4 }}>
            Choose an import method below. Read the format notes before uploading.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        </div>
      </div>

      {/* ── JSON Backup Import ────────────────────────────── */}
      <div className="card">
        <div className="card-title">JSON Backup — Restore All Games</div>
        <p className="text-dim" style={{ fontSize: 13, marginBottom: 12 }}>
          Replaces <strong style={{ color: 'var(--loss)' }}>all</strong> current games with the
          contents of a backup file. Use this to restore a previous export.
        </p>

        <div className="csv-hint">
          <div className="hint-title">Format</div>
          <code>A <code>.json</code> file exported from this app via the Export button. It must be a JSON array of game objects.</code>
        </div>

        <div className="csv-actions" style={{ marginTop: 16, marginBottom: 0 }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            Choose JSON File
            <input type="file" accept=".json" hidden onChange={handleJsonImport} />
          </label>
        </div>

        {jsonMsg && (
          <div className={`inline-msg${jsonMsg.error ? ' error' : ''}`} style={{ marginTop: 12 }}>
            {jsonMsg.text}
          </div>
        )}
      </div>

      {/* ── CSV Import ───────────────────────────────────── */}
      <div className="card">
        <div className="card-title">CSV — Add Games from Spreadsheet</div>
        <p className="text-dim" style={{ fontSize: 13, marginBottom: 12 }}>
          Adds games from a CSV file. Does <strong>not</strong> replace existing data — rows are
          appended. Download the template to see the exact column layout.
        </p>

        <div className="csv-hint">
          <div className="hint-title">Required columns (everything else is optional)</div>
          <code>date, pts, opp_pts</code>
        </div>

        <div className="csv-hint" style={{ marginTop: 10 }}>
          <div className="hint-title">All supported columns</div>
          <code>{ALL_COLS}</code>
        </div>

        <div className="csv-hint" style={{ marginTop: 10 }}>
          <div className="hint-title">Example row</div>
          <code>2024-04-10, 108, 95, 38, 82, 12, 28, 20, 24, ...</code>
          <div className="hint-title" style={{ marginTop: 8 }}>Date format</div>
          <code>YYYY-MM-DD preferred (e.g. 2024-04-10). Other formats may work but are not guaranteed.</code>
          <div className="hint-title" style={{ marginTop: 8 }}>completed column</div>
          <code>true or false. Omit the column and all rows default to completed.</code>
        </div>

        <div className="csv-actions" style={{ marginTop: 16, marginBottom: 0 }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            Choose CSV File
            <input type="file" accept=".csv,text/csv" hidden onChange={handleCSV} />
          </label>
          <button className="btn btn-secondary" type="button" onClick={downloadTemplate}>
            Download Template
          </button>
        </div>

        {csvMsg && (
          <div className={`inline-msg${csvMsg.error ? ' error' : ''}`} style={{ marginTop: 12 }}>
            {csvMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}
