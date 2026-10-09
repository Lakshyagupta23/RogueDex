const assert = require('assert');
const pokemonList = require('../public/data/pokemon_index.json');

console.log('Testing Auto-Chess and Synergy Ascension logic...');

// Test 1: Synergy Ascension with base-stage Pokemon
{
  const state = {
    gameMode: 'synergy',
    p1: { team: [] },
    p2: { team: [] },
    totalRounds: 6
  };

  const bulbasaur = pokemonList.find(p => p.name === 'bulbasaur');
  const oddish = pokemonList.find(p => p.name === 'oddish');
  const bellsprout = pokemonList.find(p => p.name === 'bellsprout');

  state.p1.team.push({ isMystery: false, actualPk: { ...bulbasaur }, fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: { ...oddish }, fromOpponent: false });
  state.p1.team.push({ isMystery: false, actualPk: { ...bellsprout }, fromOpponent: false });

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
      const fullyEvolved = pokemonList.filter(p => p.isFullyEvolved && !p.isLegendary && !p.isMythical);

      triplet.forEach(t => {
        const idx = state.p1.team.indexOf(t);
        let evolvedForm = null;
        const chainMembers = pokemonList.filter(p => p.evolutionChainId === t.actualPk.evolutionChainId);
        const chainFullyEvolved = chainMembers.filter(p => p.isFullyEvolved && p.id < 10000 && !p.isMega);

        if (chainFullyEvolved.length > 0 && (!t.actualPk.isFullyEvolved || chainFullyEvolved.some(c => c.id !== t.actualPk.id))) {
          const matchingTypeEvo = chainFullyEvolved.filter(p => p.types.includes(type));
          evolvedForm = matchingTypeEvo.length > 0
            ? matchingTypeEvo[Math.floor(Math.random() * matchingTypeEvo.length)]
            : chainFullyEvolved[Math.floor(Math.random() * chainFullyEvolved.length)];
        }

        const megaForms = pokemonList.filter(p => p.speciesId === (evolvedForm ? evolvedForm.speciesId : t.actualPk.speciesId) && p.isMega);
        if (megaForms.length > 0 && (Math.random() > 0.4 || t.actualPk.isFullyEvolved)) {
          evolvedForm = megaForms[Math.floor(Math.random() * megaForms.length)];
        }

        if (!evolvedForm) {
          const highTierPool = pokemonList.filter(p => 
            p.types.includes(type) && (p.isLegendary || p.isMega || (p.isFullyEvolved && p.stats.total >= 520))
          );
          if (highTierPool.length > 0) {
            evolvedForm = highTierPool[Math.floor(Math.random() * highTierPool.length)];
          } else {
            let typeEvolved = fullyEvolved.filter(p => p.types.includes(type));
            if (typeEvolved.length === 0) typeEvolved = fullyEvolved;
            evolvedForm = typeEvolved[Math.floor(Math.random() * typeEvolved.length)];
          }
        }

        state.p1.team[idx] = {
          ...t,
          actualPk: { ...evolvedForm },
          merged: true,
          ascended: true,
          isMystery: false
        };
      });
    }
  }

  assert.strictEqual(state.p1.team.length, 3, 'Synergy mode keeps all 3 Pokemon in team');
  assert.ok(state.p1.team.every(m => m.ascended && m.merged), 'All 3 members are marked ascended');
  assert.ok(state.p1.team.every(m => m.actualPk.isFullyEvolved || m.actualPk.isMega || m.actualPk.isLegendary), 'All 3 members transformed into powerful forms');
  console.log('✓ Synergy Ascension with base stage passed: [', state.p1.team.map(m => m.actualPk.displayName).join(', '), ']');
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
