const fs = require('fs');
const { randomUUID } = require('crypto');

const recovered = JSON.parse(fs.readFileSync('./recovered-games.json'));

const seedGames = [
  { date:'2026-04-10', pts:'91', opp_pts:'79', fgm:'32', fga:'56', tpm:'21', tpa:'33', ftm:'6', fta:'8', oreb:'6', dreb:'15', ast:'19', stl:'8', blk:'3', to:'3', pf:'8', pitp:'20', fbp:'24', scp:'3', bp:'28', largest_lead:'14', opp_fgm:'32', opp_fga:'48', opp_tpm:'8', opp_tpa:'12', opp_ftm:'7', opp_fta:'7', opp_oreb:'1', opp_dreb:'21', opp_ast:'18', opp_stl:'3', opp_blk:'0', opp_to:'9', opp_pf:'8', opp_pitp:'44', opp_fbp:'10', opp_scp:'0', opp_bp:'11', opp_largest_lead:'4' },
  { date:'2026-04-10', pts:'65', opp_pts:'74', fgm:'26', fga:'55', tpm:'6', tpa:'20', ftm:'7', fta:'11', oreb:'9', dreb:'20', ast:'13', stl:'6', blk:'2', to:'6', pf:'3', pitp:'28', fbp:'15', scp:'8', bp:'12', largest_lead:'6', opp_fgm:'32', opp_fga:'56', opp_tpm:'5', opp_tpa:'16', opp_ftm:'5', opp_fta:'5', opp_oreb:'4', opp_dreb:'24', opp_ast:'22', opp_stl:'4', opp_blk:'2', opp_to:'6', opp_pf:'6', opp_pitp:'44', opp_fbp:'15', opp_scp:'4', opp_bp:'6', opp_largest_lead:'13' },
  { date:'2026-04-10', pts:'87', opp_pts:'57', fgm:'34', fga:'49', tpm:'17', tpa:'28', ftm:'2', fta:'3', oreb:'5', dreb:'19', ast:'23', stl:'3', blk:'2', to:'2', pf:'4', pitp:'28', fbp:'11', scp:'7', bp:'24', largest_lead:'39', opp_fgm:'24', opp_fga:'44', opp_tpm:'7', opp_tpa:'14', opp_ftm:'2', opp_fta:'3', opp_oreb:'2', opp_dreb:'12', opp_ast:'18', opp_stl:'2', opp_blk:'2', opp_to:'5', opp_pf:'9', opp_pitp:'34', opp_fbp:'11', opp_scp:'2', opp_bp:'12', opp_largest_lead:'9' },
  { date:'2026-04-10', pts:'92', opp_pts:'74', fgm:'37', fga:'53', tpm:'14', tpa:'25', ftm:'4', fta:'4', oreb:'2', dreb:'15', ast:'25', stl:'3', blk:'4', to:'5', pf:'9', pitp:'36', fbp:'10', scp:'3', bp:'33', largest_lead:'18', opp_fgm:'32', opp_fga:'49', opp_tpm:'1', opp_tpa:'1', opp_ftm:'9', opp_fta:'12', opp_oreb:'5', opp_dreb:'14', opp_ast:'20', opp_stl:'3', opp_blk:'0', opp_to:'7', opp_pf:'6', opp_pitp:'56', opp_fbp:'16', opp_scp:'6', opp_bp:'18', opp_largest_lead:'4' },
  { date:'2026-04-10', pts:'73', opp_pts:'54', fgm:'30', fga:'39', tpm:'10', tpa:'12', ftm:'3', fta:'3', oreb:'1', dreb:'10', ast:'23', stl:'2', blk:'3', to:'3', pf:'5', pitp:'38', fbp:'8', scp:'0', bp:'15', largest_lead:'23', opp_fgm:'24', opp_fga:'37', opp_tpm:'2', opp_tpa:'8', opp_ftm:'4', opp_fta:'7', opp_oreb:'6', opp_dreb:'8', opp_ast:'9', opp_stl:'1', opp_blk:'2', opp_to:'4', opp_pf:'2', opp_pitp:'30', opp_fbp:'2', opp_scp:'6', opp_bp:'14', opp_largest_lead:'4' },
].map(g => ({ ...g, id: randomUUID() }));

// Merge: recovered games first, then seed games (skip dupes by id)
const existingIds = new Set(recovered.map(g => g.id));
const toAdd = seedGames.filter(g => !existingIds.has(g.id));
const all = [...recovered, ...toAdd];

fs.writeFileSync('./all-games.json', JSON.stringify(all));
console.log(`Combined: ${recovered.length} recovered + ${toAdd.length} seed = ${all.length} total games`);
console.log('Saved to all-games.json');
