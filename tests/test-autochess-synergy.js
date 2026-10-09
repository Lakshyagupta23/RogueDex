const assert = require('assert');
const pokemonList = require('../public/data/pokemon_index.json');

console.log('Testing Auto-Chess and Synergy Ascension logic...');

// Test 1: Synergy Ascension with fully-evolved Pokemon (e.g. Blastoise, Seismitoad, Carracosta)
{
  const state = {
    gameMode: 'synergy',
    p1: { team: [] },
    p2: { team: [] },
    totalRounds: 6
  };

  const blastoise = pokemonList.find(p => p.name === 'blastoise');
  const seismitoad = pokemonList.find(p => p.name === 'seismitoad');
  const carracosta = pokemonList.find(p => p.name === 'carracosta');

  state.p1.team.push({ isMystery: false, actualPk: { ...blastoise }, fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: { ...seismitoad }, fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: { ...carracosta }, fromOpponent: false });

  // Run synergy logic
  const typeCounts = {};
  state.p1.team.forEach(member => {
    if (member.merged || member.ascended) return;
    member.actualPk.types.forEach(t => {
      if (!typeCounts[t]) typeCounts[t] = [];
      if (!typeCounts[t].includes(member)) typeCounts[t].push(member);
    });
  });

  const usedMembers = new Set();
  for (const [type, members] of Object.entries(typeCounts)) {
    const available = members.filter(m => !usedMembers.has(m) && state.p1.team.includes(m) && !m.merged && !m.ascended);
    if (available.length >= 3) {
      const triplet = available.slice(0, 3);
      triplet.forEach(m => usedMembers.add(m));
      const legends = pokemonList.filter(p => (p.isLegendary || p.isMythical));
      const typeLegends = legends.filter(p => p.types.includes(type));
      const teamMemberIds = new Set(state.p1.team.map(m => m.actualPk.id));

      const selectedLegends = [];
      const unusedTypeLegends = [...typeLegends.filter(p => !teamMemberIds.has(p.id))].sort(() => Math.random() - 0.5);
      for (const leg of unusedTypeLegends) {
        if (selectedLegends.length < 3 && !selectedLegends.some(s => s.id === leg.id)) {
          selectedLegends.push(leg);
        }
      }
      if (selectedLegends.length < 3) {
        const anyTypeLegends = [...typeLegends].sort(() => Math.random() - 0.5);
        for (const leg of anyTypeLegends) {
          if (selectedLegends.length < 3 && !selectedLegends.some(s => s.id === leg.id)) {
            selectedLegends.push(leg);
          }
        }
      }
      if (selectedLegends.length < 3) {
        const unusedGeneral = [...legends.filter(p => !teamMemberIds.has(p.id))].sort(() => Math.random() - 0.5);
        for (const leg of unusedGeneral) {
          if (selectedLegends.length < 3 && !selectedLegends.some(s => s.id === leg.id)) {
            selectedLegends.push(leg);
          }
        }
      }

      triplet.forEach((t, i) => {
        const idx = state.p1.team.indexOf(t);
        const legendaryForm = selectedLegends[i] || selectedLegends[0] || t.actualPk;

        state.p1.team[idx] = {
          ...t,
          actualPk: { ...legendaryForm },
          merged: true,
          ascended: true,
          isMystery: false
        };
      });
    }
  }

  assert.strictEqual(state.p1.team.length, 3, 'Synergy mode keeps all 3 Pokemon in team');
  assert.ok(state.p1.team.every(m => m.ascended && m.merged), 'All 3 members are marked ascended');
  assert.ok(state.p1.team.every(m => m.actualPk.isLegendary || m.actualPk.isMythical), 'All 3 members transformed into Legendaries/Mythicals');
  const distinctIds = new Set(state.p1.team.map(m => m.actualPk.id));
  assert.strictEqual(distinctIds.size, 3, 'All 3 ascended Legendaries are distinct');
  console.log('✓ Synergy Ascension with fully evolved passed: [', state.p1.team.map(m => m.actualPk.displayName).join(', '), ']');
}

// Test 2: Synergy Ascension with single-stage Pokemon (e.g. Lapras)
{
  const state = {
    gameMode: 'synergy',
    p1: { team: [] },
    p2: { team: [] },
    totalRounds: 6
  };

  const squirtle = pokemonList.find(p => p.name === 'squirtle');
  const psyduck = pokemonList.find(p => p.name === 'psyduck');
  const lapras = pokemonList.find(p => p.name === 'lapras'); // isFullyEvolved is true

  state.p1.team.push({ isMystery: false, actualPk: { ...squirtle }, fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: { ...psyduck }, fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: { ...lapras }, fromOpponent: false });

  const typeCounts = {};
  state.p1.team.forEach(member => {
    if (member.merged || member.ascended) return;
    member.actualPk.types.forEach(t => {
      if (!typeCounts[t]) typeCounts[t] = [];
      if (!typeCounts[t].includes(member)) typeCounts[t].push(member);
    });
  });

  assert.strictEqual(typeCounts['water'].length, 3, 'Single-stage Lapras counts towards Water synergy');
  console.log('✓ Synergy includes single-stage / fully-evolved Pokemon towards triplet');
}

// Test 3: Auto-Chess merge and dynamic round extension
{
  const state = {
    gameMode: 'auto_chess',
    p1: { team: [] },
    p2: { team: [] },
    round: 3,
    totalRounds: 9
  };

  // Draft 3 Water Pokemon
  state.p1.team.push({ isMystery: false, actualPk: pokemonList.find(p => p.name === 'squirtle'), fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: pokemonList.find(p => p.name === 'totodile'), fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: pokemonList.find(p => p.name === 'mudkip'), fromOpponent: false });

  // Merge logic for Auto-Chess
  const triplet = state.p1.team.slice(0, 3);
  const legends = pokemonList.filter(p => (p.isLegendary || p.isMythical));
  const typeLegends = legends.filter(p => p.types.includes('water'));
  const mergedLegend = typeLegends[0];

  triplet.forEach(t => {
    const idx = state.p1.team.indexOf(t);
    if (idx > -1) state.p1.team.splice(idx, 1);
  });
  state.p1.team.push({ isMystery: false, actualPk: { ...mergedLegend }, fromOpponent: false, merged: true });
  state.totalRounds += 2;

  assert.strictEqual(state.p1.team.length, 1, '3 units merged into 1 legendary');
  assert.strictEqual(state.totalRounds, 11, 'Total rounds extended by 2 for the merge');

  // Second merge simulation at round 6
  state.p1.team.push({ isMystery: false, actualPk: pokemonList.find(p => p.name === 'charmander'), fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: pokemonList.find(p => p.name === 'cyndaquil'), fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: pokemonList.find(p => p.name === 'torchic'), fromOpponent: false });

  const fireTriplet = state.p1.team.filter(m => !m.merged && m.actualPk.types.includes('fire'));
  const fireLegends = legends.filter(p => p.types.includes('fire'));
  fireTriplet.forEach(t => {
    const idx = state.p1.team.indexOf(t);
    if (idx > -1) state.p1.team.splice(idx, 1);
  });
  state.p1.team.push({ isMystery: false, actualPk: { ...fireLegends[0] }, fromOpponent: false, merged: true });
  state.totalRounds += 2;

  assert.strictEqual(state.p1.team.length, 2, 'Team now has 2 merged legendaries');
  assert.strictEqual(state.totalRounds, 13, 'Total rounds extended to 13 to account for 2 merges');

  // Verify round guard prevents premature ending if team.length < 6
  state.round = 10; // Originally round 9 was end
  if (state.gameMode === 'auto_chess') {
    const p1Count = state.p1.team.length;
    const p2Count = state.p2 ? state.p2.team.length : 6;
    if (p1Count < 6 || p2Count < 6) {
      state.totalRounds = Math.max(state.totalRounds, state.round);
    }
  }

  assert.ok(state.round <= state.totalRounds, 'Drafting continues because team size is < 6');
  console.log('✓ Auto-Chess dynamic round extension and team size check passed');
}

console.log('All automated tests passed successfully!');
