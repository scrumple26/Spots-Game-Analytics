const fs = require('fs');
const path = require('path');

const ldbDir = 'C:/Users/nolan/AppData/Local/Google/Chrome/User Data/Default/Local Storage/leveldb/';
const files = fs.readdirSync(ldbDir).map(f => path.join(ldbDir, f));

let allGames = [];

for (const f of files) {
  try {
    const data = fs.readFileSync(f);
    const text = data.toString('latin1');
    let idx = 0;
    while ((idx = text.indexOf('spots_games_v1', idx)) !== -1) {
      const start = text.indexOf('[', idx);
      if (start === -1) { idx++; continue; }
      let depth = 0, end = start;
      for (let i = start; i < Math.min(start + 500000, text.length); i++) {
        if (text[i] === '[' || text[i] === '{') depth++;
        else if (text[i] === ']' || text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
      try {
        const json = text.substring(start, end + 1);
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Found ${parsed.length} game(s) in ${path.basename(f)}`);
          allGames = [...allGames, ...parsed];
        }
      } catch {}
      idx++;
    }
  } catch {}
}

const seen = new Set();
const unique = allGames.filter(g => { if (seen.has(g.id)) return false; seen.add(g.id); return true; });
console.log(`\nTotal unique games found: ${unique.length}`);
if (unique.length > 0) {
  const out = 'C:/Users/nolan/OneDrive/Desktop/Visual Studio/Spots-Game-Analytics/recovered-games.json';
  fs.writeFileSync(out, JSON.stringify(unique, null, 2));
  console.log('Saved to recovered-games.json');
}
