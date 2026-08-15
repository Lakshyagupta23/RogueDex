import { PokemonIndexItem } from './types';

// Database of premium, hand-crafted competitive sets for popular Pokémon
const ICONIC_SETS: Record<string, {
  item: string;
  ability: string;
  nature: string;
  evs: string;
  moves: string[];
  teraType?: string;
}> = {
  dragonite: {
    item: 'Heavy-Duty Boots',
    ability: 'Multiscale',
    nature: 'Jolly',
    evs: '252 Atk / 4 SpD / 252 Spe',
    moves: ['Dragon Dance', 'Extreme Speed', 'Earthquake', 'Roost'],
    teraType: 'Normal',
  },
  garchomp: {
    item: 'Life Orb',
    ability: 'Rough Skin',
    nature: 'Jolly',
    evs: '252 Atk / 4 SpD / 252 Spe',
    moves: ['Swords Dance', 'Earthquake', 'Outrage', 'Stone Edge'],
    teraType: 'Ground',
  },
  gengar: {
    item: 'Choice Specs',
    ability: 'Cursed Body',
    nature: 'Timid',
    evs: '252 SpA / 4 SpD / 252 Spe',
    moves: ['Shadow Ball', 'Sludge Wave', 'Focus Blast', 'Trick'],
    teraType: 'Ghost',
  },
  tyranitar: {
    item: 'Leftovers',
    ability: 'Sand Stream',
    nature: 'Adamant',
    evs: '252 HP / 252 Atk / 4 SpD',
    moves: ['Stone Edge', 'Crunch', 'Earthquake', 'Stealth Rock'],
    teraType: 'Ghost',
  },
  lucario: {
    item: 'Life Orb',
    ability: 'Inner Focus',
    nature: 'Jolly',
    evs: '252 Atk / 4 SpD / 252 Spe',
    moves: ['Swords Dance', 'Close Combat', 'Extreme Speed', 'Meteor Mash'],
    teraType: 'Normal',
  },
  greninja: {
    item: 'Choice Specs',
    ability: 'Battle Bond',
    nature: 'Timid',
    evs: '252 SpA / 4 SpD / 252 Spe',
    moves: ['Hydro Pump', 'Dark Pulse', 'Water Shuriken', 'Ice Beam'],
    teraType: 'Water',
  },
  charizard: {
    item: 'Heavy-Duty Boots',
    ability: 'Solar Power',
    nature: 'Timid',
    evs: '252 SpA / 4 SpD / 252 Spe',
    moves: ['Flamethrower', 'Air Slash', 'Focus Blast', 'Roost'],
    teraType: 'Fire',
  },
  gyarados: {
    item: 'Leftovers',
    ability: 'Intimidate',
    nature: 'Jolly',
    evs: '252 Atk / 4 SpD / 252 Spe',
    moves: ['Dragon Dance', 'Waterfall', 'Earthquake', 'Power Whip'],
    teraType: 'Water',
  },
  scizor: {
    item: 'Choice Band',
    ability: 'Technician',
    nature: 'Adamant',
    evs: '248 HP / 252 Atk / 8 SpD',
    moves: ['Bullet Punch', 'U-turn', 'Close Combat', 'Dual Wingbeat'],
    teraType: 'Steel',
  },
  rotom_wash: {
    item: 'Leftovers',
    ability: 'Levitate',
    nature: 'Bold',
    evs: '252 HP / 252 Def / 4 SpD',
    moves: ['Volt Switch', 'Hydro Pump', 'Will-O-Wisp', 'Pain Split'],
    teraType: 'Steel',
  },
  great_tusk: {
    item: 'Leftovers',
    ability: 'Protosynthesis',
    nature: 'Jolly',
    evs: '252 Atk / 4 Def / 252 Spe',
    moves: ['Earthquake', 'Close Combat', 'Rapid Spin', 'Stealth Rock'],
    teraType: 'Steel',
  },
  gholdengo: {
    item: 'Air Balloon',
    ability: 'Good as Gold',
    nature: 'Timid',
    evs: '252 SpA / 4 SpD / 252 Spe',
    moves: ['Make It Rain', 'Shadow Ball', 'Nasty Plot', 'Recover'],
    teraType: 'Fighting',
  },
  kingambit: {
    item: 'Black Glasses',
    ability: 'Supreme Overlord',
    nature: 'Adamant',
    evs: '252 HP / 252 Atk / 4 SpD',
    moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance'],
    teraType: 'Fire',
  },
  tatsugiri: {
    item: 'Choice Scarf',
    ability: 'Commander',
    nature: 'Timid',
    evs: '252 SpA / 4 SpD / 252 Spe',
    moves: ['Draco Meteor', 'Muddy Water', 'Ice Beam', 'Rapid Spin'],
    teraType: 'Dragon',
  },
};

// Generates list of moves based on type and style
function getProceduralMoves(types: string[], isPhysical: boolean): string[] {
  const moves: string[] = [];
  
  // Attacking STAB moves
  for (const type of types) {
    if (isPhysical) {
      if (type === 'normal') moves.push('Double-Edge');
      else if (type === 'fire') moves.push('Flare Blitz');
      else if (type === 'water') moves.push('Liquidation');
      else if (type === 'grass') moves.push('Power Whip');
      else if (type === 'electric') moves.push('Wild Charge');
      else if (type === 'ice') moves.push('Icicle Crash');
      else if (type === 'fighting') moves.push('Close Combat');
      else if (type === 'poison') moves.push('Poison Jab');
      else if (type === 'ground') moves.push('Earthquake');
      else if (type === 'flying') moves.push('Brave Bird');
      else if (type === 'psychic') moves.push('Zen Headbutt');
      else if (type === 'bug') moves.push('Lunge');
      else if (type === 'rock') moves.push('Stone Edge');
      else if (type === 'ghost') moves.push('Poltergeist');
      else if (type === 'dragon') moves.push('Outrage');
      else if (type === 'dark') moves.push('Knock Off');
      else if (type === 'steel') moves.push('Iron Head');
      else if (type === 'fairy') moves.push('Play Rough');
    } else {
      if (type === 'normal') moves.push('Hyper Voice');
      else if (type === 'fire') moves.push('Fire Blast');
      else if (type === 'water') moves.push('Hydro Pump');
      else if (type === 'grass') moves.push('Leaf Storm');
      else if (type === 'electric') moves.push('Thunderbolt');
      else if (type === 'ice') moves.push('Ice Beam');
      else if (type === 'fighting') moves.push('Focus Blast');
      else if (type === 'poison') moves.push('Sludge Bomb');
      else if (type === 'ground') moves.push('Earth Power');
      else if (type === 'flying') moves.push('Hurricane');
      else if (type === 'psychic') moves.push('Psychic');
      else if (type === 'bug') moves.push('Bug Buzz');
      else if (type === 'rock') moves.push('Power Gem');
      else if (type === 'ghost') moves.push('Shadow Ball');
      else if (type === 'dragon') moves.push('Draco Meteor');
      else if (type === 'dark') moves.push('Dark Pulse');
      else if (type === 'steel') moves.push('Flash Cannon');
      else if (type === 'fairy') moves.push('Moonblast');
    }
  }

  // Add Setup Move
  if (isPhysical) {
    moves.push('Swords Dance');
  } else {
    moves.push('Nasty Plot');
  }

  // Add Coverage / Utility
  if (isPhysical) {
    if (!types.includes('ground')) moves.push('Earthquake'); // Universal physical coverage
    else moves.push('U-turn');
  } else {
    if (!types.includes('ice')) moves.push('Ice Beam'); // Universal special coverage
    else moves.push('Volt Switch');
  }

  // Ensure exactly 4 moves
  const finalMoves = Array.from(new Set(moves)).slice(0, 4);
  while (finalMoves.length < 4) {
    finalMoves.push('Protect');
  }
  return finalMoves;
}

// Generate Showdown export text for a single Pokémon
export function generateShowdownSet(pk: PokemonIndexItem): string {
  // Check if we have a hand-crafted set for this species or variety
  const cleanName = pk.name.replace('-', '_');
  const customSet = ICONIC_SETS[cleanName] || ICONIC_SETS[pk.name];

  if (customSet) {
    const lines = [
      `${pk.displayName} @ ${customSet.item}`,
      `Ability: ${customSet.ability}`,
    ];
    if (customSet.teraType) {
      lines.push(`Tera Type: ${customSet.teraType}`);
    }
    lines.push(`EVs: ${customSet.evs}`);
    lines.push(`${customSet.nature} Nature`);
    for (const move of customSet.moves) {
      lines.push(`- ${move}`);
    }
    return lines.join('\n');
  }

  // Procedural Generator
  const isPhysical = pk.stats.atk >= pk.stats.spAtk;
  const isBulk = pk.stats.hp + pk.stats.def + pk.stats.spDef > 240 && pk.stats.spe < 70;
  
  let item = 'Life Orb';
  let ability = 'Inner Focus'; // Fallback ability
  let nature = 'Jolly';
  let evs = '252 Atk / 4 SpD / 252 Spe';
  let moves: string[] = [];

  // Customize based on stats
  if (isBulk) {
    item = 'Leftovers';
    ability = 'Sturdy';
    nature = isPhysical ? 'Impish' : 'Bold';
    evs = '252 HP / 252 Def / 4 SpD';
    moves = isPhysical 
      ? [getProceduralMoves(pk.types, true)[0], 'Earthquake', 'Stealth Rock', 'Recover']
      : [getProceduralMoves(pk.types, false)[0], 'Earth Power', 'Toxic', 'Recover'];
  } else if (isPhysical) {
    item = pk.stats.spe > 100 ? 'Choice Band' : 'Life Orb';
    nature = pk.stats.spe > pk.stats.atk ? 'Jolly' : 'Adamant';
    evs = '252 Atk / 4 SpD / 252 Spe';
    moves = getProceduralMoves(pk.types, true);
  } else {
    item = pk.stats.spe > 100 ? 'Choice Specs' : 'Life Orb';
    nature = pk.stats.spe > pk.stats.spAtk ? 'Timid' : 'Modest';
    evs = '252 SpA / 4 SpD / 252 Spe';
    moves = getProceduralMoves(pk.types, false);
  }

  // Basic common ability overrides
  if (pk.types.includes('ghost') && pk.name !== 'gengar') ability = 'Cursed Body';
  else if (pk.types.includes('fire')) ability = 'Flash Fire';
  else if (pk.types.includes('water')) ability = 'Torrent';
  else if (pk.types.includes('grass')) ability = 'Overgrow';
  else if (pk.types.includes('electric')) ability = 'Static';
  else if (pk.types.includes('dragon')) ability = 'Intimidate';
  else if (pk.isMega) ability = 'Technician';

  const teraType = pk.types[0].charAt(0).toUpperCase() + pk.types[0].slice(1);

  const lines = [
    `${pk.displayName} @ ${item}`,
    `Ability: ${ability}`,
    `Tera Type: ${teraType}`,
    `EVs: ${evs}`,
    `${nature} Nature`,
  ];
  for (const move of moves) {
    lines.push(`- ${move}`);
  }

  return lines.join('\n');
}

// Generate Showdown export text for a team
export function generateShowdownTeam(team: PokemonIndexItem[]): string {
  return team.map(pk => generateShowdownSet(pk)).join('\n\n');
}
