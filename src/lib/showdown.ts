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

export async function generateShowdownExport(pokemonNames: string[]): Promise<string> {
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
    
    return pokemonNames.map(rawName => {
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
         return `${sdName}\nEVs: 85 HP / 85 Atk / 85 Def / 85 SpA / 85 SpD / 85 Spe\n`;
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
      
      return `${sdName} @ ${item}${abilityLine}\nLevel: ${pSet.level || 80}\nTera Type: ${teraType}\nEVs: 85 HP / 85 Atk / 85 Def / 85 SpA / 85 SpD / 85 Spe\n${moves.map((mv: string) => '- ' + mv).join('\n')}\n`;
    }).join('\n');
  } catch (err) {
    console.error('Failed to generate showdown sets:', err);
    throw err;
  }
}
