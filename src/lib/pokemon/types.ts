export interface PokemonIndexItem {
  id: number;
  speciesId: number;
  name: string;
  displayName: string;
  types: string[];
  generation: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spe: number;
    total: number;
  };
  sprite: string;
  shinySprite: string;
  isLegendary: boolean;
  isMythical: boolean;
  isBaby: boolean;
  isStarter: boolean;
  isMega: boolean;
  isRegional: boolean;
  regionalType?: 'alolan' | 'galarian' | 'hisuian' | 'paldean';
  isUltraBeast: boolean;
  isParadox: boolean;
  isPseudoLegendary: boolean;
  isFossil: boolean;
  canEvolve: boolean;
  isFullyEvolved: boolean;
  evolutionChainId?: number;
  isTrap?: boolean;
}

export interface PokemonDetails extends PokemonIndexItem {
  height: number; // decimeters
  weight: number; // hectograms
  abilities: { name: string; isHidden: boolean; description?: string }[];
  eggGroups: string[];
  catchRate: number;
  baseExperience: number;
  growthRate: string;
  description: string;
  evolutionChain: EvolutionNode[];
}

export interface EvolutionNode {
  speciesId: number;
  name: string;
  displayName: string;
  sprite: string;
  types: string[];
  minLevel?: number;
  trigger?: string;
  item?: string;
}

export interface SavedTeam {
  id: string;
  name: string;
  pokemon: PokemonIndexItem[];
  createdAt: string;
  notes?: string;
  generation?: string;
  tags?: string[];
}

