export async function generateShowdownExport(pokemonNames: string[]): Promise<string> {
  try {
    const res = await fetch('https://pkmn.github.io/randbats/data/gen9randombattle.json');
    const randomSets = await res.json();
    
    return pokemonNames.map(name => {
      // Normalize name for dataset
      let nameKey = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      if (nameKey === 'Ho-oh') nameKey = 'Ho-Oh';
      if (nameKey === 'Porygon-z') nameKey = 'Porygon-Z';
      if (nameKey === 'Jangmo-o') nameKey = 'Jangmo-o';
      
      let pSet = randomSets[nameKey] || randomSets[name] || randomSets[name.charAt(0).toUpperCase() + name.slice(1)];
      
      if (!pSet) {
         // Fallback if not found in dataset
         return `${name}\nAbility: Unknown\nEVs: 85 HP / 85 Atk / 85 Def / 85 SpA / 85 SpD / 85 Spe\n`;
      }
      
      const roles = Object.keys(pSet.roles || {});
      const roleName = roles.length > 0 ? roles[Math.floor(Math.random() * roles.length)] : null;
      const role = roleName ? pSet.roles[roleName] : pSet;
      
      const ability = (role.abilities && role.abilities.length > 0) ? role.abilities[Math.floor(Math.random() * role.abilities.length)] : (pSet.abilities ? pSet.abilities[0] : 'Unknown');
      const item = (role.items && role.items.length > 0) ? role.items[Math.floor(Math.random() * role.items.length)] : (pSet.items ? pSet.items[0] : 'Leftovers');
      const teraType = (role.teraTypes && role.teraTypes.length > 0) ? role.teraTypes[Math.floor(Math.random() * role.teraTypes.length)] : 'Normal';
      
      let moves = [...(role.moves || pSet.moves || [])];
      moves = moves.sort(() => 0.5 - Math.random()).slice(0, 4);
      
      return `${name} @ ${item}\nAbility: ${ability}\nLevel: ${pSet.level || 80}\nTera Type: ${teraType}\nEVs: 85 HP / 85 Atk / 85 Def / 85 SpA / 85 SpD / 85 Spe\n${moves.map(mv => '- ' + mv).join('\n')}\n`;
    }).join('\n');
  } catch (err) {
    console.error('Failed to generate showdown sets:', err);
    throw err;
  }
}
