export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const TYPE_GLOWS: Record<string, string> = {
  normal: 'shadow-[0_0_20px_rgba(168,168,120,0.15)] border-normal/30',
  fire: 'shadow-[0_0_20px_rgba(240,128,48,0.25)] border-fire/30',
  water: 'shadow-[0_0_20px_rgba(104,144,240,0.25)] border-water/30',
  grass: 'shadow-[0_0_20px_rgba(120,200,80,0.25)] border-grass/30',
  electric: 'shadow-[0_0_20px_rgba(248,208,48,0.25)] border-electric/30',
  ice: 'shadow-[0_0_20px_rgba(152,216,216,0.25)] border-ice/30',
  fighting: 'shadow-[0_0_20px_rgba(192,48,40,0.25)] border-fighting/30',
  poison: 'shadow-[0_0_20px_rgba(160,64,160,0.25)] border-poison/30',
  ground: 'shadow-[0_0_20px_rgba(224,192,104,0.25)] border-ground/30',
  flying: 'shadow-[0_0_20px_rgba(168,144,240,0.25)] border-flying/30',
  psychic: 'shadow-[0_0_20px_rgba(248,88,136,0.25)] border-psychic/30',
  bug: 'shadow-[0_0_20px_rgba(168,184,32,0.25)] border-bug/30',
  rock: 'shadow-[0_0_20px_rgba(184,160,56,0.25)] border-rock/30',
  ghost: 'shadow-[0_0_20px_rgba(112,88,152,0.25)] border-ghost/30',
  dragon: 'shadow-[0_0_20px_rgba(112,56,248,0.25)] border-dragon/30',
  dark: 'shadow-[0_0_20px_rgba(112,88,72,0.25)] border-dark/30',
  steel: 'shadow-[0_0_20px_rgba(184,184,208,0.25)] border-steel/30',
  fairy: 'shadow-[0_0_20px_rgba(238,153,172,0.25)] border-fairy/30',
};

export const TYPE_GRADIENTS: Record<string, string> = {
  normal: 'from-normal/10 to-transparent',
  fire: 'from-fire/15 to-transparent',
  water: 'from-water/15 to-transparent',
  grass: 'from-grass/15 to-transparent',
  electric: 'from-electric/15 to-transparent',
  ice: 'from-ice/15 to-transparent',
  fighting: 'from-fighting/15 to-transparent',
  poison: 'from-poison/15 to-transparent',
  ground: 'from-ground/15 to-transparent',
  flying: 'from-flying/15 to-transparent',
  psychic: 'from-psychic/15 to-transparent',
  bug: 'from-bug/15 to-transparent',
  rock: 'from-rock/15 to-transparent',
  ghost: 'from-ghost/15 to-transparent',
  dragon: 'from-dragon/15 to-transparent',
  dark: 'from-dark/15 to-transparent',
  steel: 'from-steel/15 to-transparent',
  fairy: 'from-fairy/15 to-transparent',
};

export const POKEMON_TYPES = Object.keys(TYPE_COLORS);

export const GENERATIONS = [
  { value: 1, label: 'Gen 1 (Kanto)' },
  { value: 2, label: 'Gen 2 (Johto)' },
  { value: 3, label: 'Gen 3 (Hoenn)' },
  { value: 4, label: 'Gen 4 (Sinnoh)' },
  { value: 5, label: 'Gen 5 (Unova)' },
  { value: 6, label: 'Gen 6 (Kalos)' },
  { value: 7, label: 'Gen 7 (Alola)' },
  { value: 8, label: 'Gen 8 (Galar & Hisui)' },
  { value: 9, label: 'Gen 9 (Paldea)' },
];

export const CATEGORIES = [
  { value: 'starter', label: 'Starter Pokémon' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'mythical', label: 'Mythical' },
  { value: 'pseudo_legendary', label: 'Pseudo-Legendary' },
  { value: 'ultra_beast', label: 'Ultra Beast' },
  { value: 'paradox', label: 'Paradox' },
  { value: 'can_evolve', label: 'Can Evolve' },
  { value: 'fully_evolved', label: 'Fully Evolved' },
];

export const SPECIAL_FORMS = [
  { value: 'all', label: 'Include Special Forms' },
  { value: 'base_only', label: 'Base Forms Only' },
  { value: 'mega_only', label: 'Mega Evolutions Only' },
  { value: 'regional_only', label: 'Regional Forms Only' },
];

// Base stats abbreviations
export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  atk: 'ATK',
  def: 'DEF',
  spAtk: 'SPA',
  spDef: 'SPD',
  spe: 'SPE',
};

export const STAT_COLORS: Record<string, string> = {
  hp: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  atk: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
  def: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
  spAtk: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]',
  spDef: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
  spe: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
};
