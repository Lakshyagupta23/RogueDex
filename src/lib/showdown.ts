import { PokemonIndexItem } from './pokemon/types';

function formatShowdownName(name: string): string {
  // Megas
  if (name.startsWith('Mega ') && name.endsWith(' X')) return name.slice(5, -2) + '-Mega-X';
  if (name.startsWith('Mega ') && name.endsWith(' Y')) return name.slice(5, -2) + '-Mega-Y';
  if (name.startsWith('Mega ')) return name.slice(5) + '-Mega';
  
  // Regionals
  if (name.startsWith('Alolan ')) return name.slice(7) + '-Alola';
  if (name.startsWith('Galarian ')) return name.slice(9) + '-Galar';
  if (name.startsWith('Hisuian ')) return name.slice(8) + '-Hisui';
  if (name.startsWith('Paldean ')) return name.slice(8) + '-Paldea';
  
  // Other forms
  if (name.startsWith('Primal ')) return name.slice(7) + '-Primal';
  if (name.startsWith('Gigantamax ')) return name.slice(11) + '-Gmax';

  // Specific corrections
  if (name === 'Mr Mime') return 'Mr. Mime';
  if (name === 'Mime Jr') return 'Mime Jr.';
  if (name === 'Mr Rime') return 'Mr. Rime';
  if (name === 'Type Null') return 'Type: Null';
  if (name === 'Farfetchd') return "Farfetch'd";
  if (name === 'Sirfetchd') return "Sirfetch'd";
  if (name === 'Flabebe') return "Flabébé";
  if (name === 'Ho-oh') return "Ho-Oh";
  if (name === 'Porygon-z') return "Porygon-Z";
  if (name === 'Jangmo-o') return "Jangmo-o";

  return name;
}

function calculateSmartEVsAndNature(pk: PokemonIndexItem | string, roleName: string | null): { evs: string, nature: string } {
  if (typeof pk === 'string' || !pk.stats) {
    return { evs: '85 HP / 85 Atk / 85 Def / 85 SpA / 85 SpD / 85 Spe', nature: 'Hardy' };
  }

  let primary: keyof typeof pk.stats | null = null;
  let secondary: keyof typeof pk.stats | null = null;
  
  const isPhysical = pk.stats.atk > pk.stats.spAtk;
  
  if (roleName) {
    const roleLower = roleName.toLowerCase();
    
    if (roleLower.includes('fast attacker') || roleLower.includes('wallbreaker') || roleLower.includes('setup sweeper')) {
      primary = 'spe';
      secondary = isPhysical ? 'atk' : 'spAtk';
    } else if (roleLower.includes('bulky attacker') || roleLower.includes('av pivot')) {
      primary = 'hp';
      secondary = isPhysical ? 'atk' : 'spAtk';
    } else if (roleLower.includes('bulky support') || roleLower.includes('fast support')) {
      primary = 'hp';
      if (roleLower.includes('fast')) {
        secondary = 'spe';
      } else {
        secondary = pk.stats.def > pk.stats.spDef ? 'def' : 'spDef';
      }
    }
  }

  if (!primary || !secondary) {
    const sortedStats = Object.entries(pk.stats)
      .filter(([k]) => k !== 'total')
      .sort((a, b) => (b[1] as number) - (a[1] as number));
    
    primary = sortedStats[0][0] as keyof typeof pk.stats;
    
    if (primary === 'spe') {
      secondary = isPhysical ? 'atk' : 'spAtk';
    } else if (primary === 'atk' || primary === 'spAtk') {
      secondary = 'spe';
    } else {
      secondary = 'hp';
    }
  }

  const evMap: Record<string, number> = { hp: 0, atk: 0, def: 0, spA: 0, spD: 0, spe: 0 };
  
  const mapKeyToEV = (k: string): string => {
    if (k === 'hp') return 'hp';
    if (k === 'atk') return 'atk';
    if (k === 'def') return 'def';
    if (k === 'spAtk') return 'spA';
    if (k === 'spDef') return 'spD';
    if (k === 'spe') return 'spe';
    return 'hp';
  };
  
  evMap[mapKeyToEV(primary)] = 252;
  evMap[mapKeyToEV(secondary)] = 252;
  
  const remaining = Object.entries(pk.stats)
    .filter(([k]) => k !== 'total' && k !== primary && k !== secondary)
    .sort((a, b) => (b[1] as number) - (a[1] as number));
    
  if (remaining.length > 0) {
    evMap[mapKeyToEV(remaining[0][0])] = 4;
  }
  
  const evParts = [];
  if (evMap.hp > 0) evParts.push(`${evMap.hp} HP`);
  if (evMap.atk > 0) evParts.push(`${evMap.atk} Atk`);
  if (evMap.def > 0) evParts.push(`${evMap.def} Def`);
  if (evMap.spA > 0) evParts.push(`${evMap.spA} SpA`);
  if (evMap.spD > 0) evParts.push(`${evMap.spD} SpD`);
  if (evMap.spe > 0) evParts.push(`${evMap.spe} Spe`);
  
  // Deduce Nature
  let boostedStat = primary;
  if (primary === 'hp') {
    boostedStat = secondary || 'def'; // HP cannot be boosted by nature, so boost the secondary stat
  }
  
  // Decreased stat is usually the unused attacking stat
  let decreasedStat: 'atk' | 'spAtk' = isPhysical ? 'spAtk' : 'atk';
  
  // Nature lookup table: [Boosted][Decreased]
  const natureMatrix: Record<string, Record<string, string>> = {
    atk: { spAtk: 'Adamant', atk: 'Hardy' },
    def: { spAtk: 'Impish', atk: 'Bold' },
    spAtk: { atk: 'Modest', spAtk: 'Hardy' },
    spDef: { spAtk: 'Careful', atk: 'Calm' },
    spe: { spAtk: 'Jolly', atk: 'Timid' }
  };
  
  let nature = 'Hardy';
  if (boostedStat && natureMatrix[boostedStat] && natureMatrix[boostedStat][decreasedStat]) {
    nature = natureMatrix[boostedStat][decreasedStat];
  }
  
  return { evs: evParts.join(' / '), nature };
}

export async function generateShowdownExport(pokemonInput: (PokemonIndexItem | string)[]): Promise<string> {
  try {
    const [res9, res8, res7] = await Promise.all([
      fetch('https://pkmn.github.io/randbats/data/gen9randombattle.json'),
      fetch('https://pkmn.github.io/randbats/data/gen8randombattle.json'),
      fetch('https://pkmn.github.io/randbats/data/gen7randombattle.json')
    ]);
    
    const [sets9, sets8, sets7] = await Promise.all([
      res9.json().catch(() => ({})),
      res8.json().catch(() => ({})),
      res7.json().catch(() => ({}))
    ]);
    
    return pokemonInput.map(pk => {
      const rawName = typeof pk === 'string' ? pk : pk.displayName;
      const sdName = formatShowdownName(rawName);
      const nameKey = sdName.replace(/[^a-zA-Z0-9]/g, '');
      
      // Look through generations for a valid set
      let pSet = sets9[nameKey] || sets9[sdName] || sets9[rawName] ||
                 sets8[nameKey] || sets8[sdName] || sets8[rawName] ||
                 sets7[nameKey] || sets7[sdName] || sets7[rawName];
      
      // Special fallback for Megas in gen7 (they are stored under base name)
      if (!pSet && sdName.includes('-Mega')) {
        const baseKey = sdName.split('-')[0].replace(/[^a-zA-Z0-9]/g, '');
        pSet = sets7[baseKey] || sets8[baseKey];
      }
      
      if (!pSet) {
         const { evs, nature } = calculateSmartEVsAndNature(pk, null);
         return `${sdName}\nAbility: Unknown\nEVs: ${evs}\n${nature} Nature\n`;
      }
      
      const roles = Object.keys(pSet.roles || {});
      const roleName = roles.length > 0 ? roles[Math.floor(Math.random() * roles.length)] : null;
      const role = roleName ? pSet.roles[roleName] : pSet;
      
      const ability = (role.abilities && role.abilities.length > 0) ? role.abilities[Math.floor(Math.random() * role.abilities.length)] : (pSet.abilities ? pSet.abilities[0] : null);
      
      let item = (role.items && role.items.length > 0) ? role.items[Math.floor(Math.random() * role.items.length)] : (pSet.items ? pSet.items[0] : 'Leftovers');
      
      // Force mega stone if mega
      if (sdName.includes('-Mega')) {
        const baseName = sdName.split('-')[0];
        if (sdName.includes('-Mega-X')) item = `${baseName}ite X`;
        else if (sdName.includes('-Mega-Y')) item = `${baseName}ite Y`;
        else item = `${baseName}ite`;
      }

      const teraType = (role.teraTypes && role.teraTypes.length > 0) ? role.teraTypes[Math.floor(Math.random() * role.teraTypes.length)] : 'Normal';
      
      let moves = [...(role.moves || pSet.moves || [])];
      moves = moves.sort(() => 0.5 - Math.random()).slice(0, 4);
      
      const abilityLine = ability && ability !== 'Unknown' ? `\nAbility: ${ability}` : '';
      const { evs, nature } = calculateSmartEVsAndNature(pk, roleName);
      
      return `${sdName} @ ${item}${abilityLine}\nLevel: ${pSet.level || 80}\nTera Type: ${teraType}\nEVs: ${evs}\n${nature} Nature\n${moves.map((mv: string) => '- ' + mv).join('\n')}\n`;
    }).join('\n');
  } catch (err) {
    console.error('Failed to generate showdown sets:', err);
    throw err;
  }
}
