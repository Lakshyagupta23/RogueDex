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

export type GameMode = 'standard' | 'blind' | 'shadow' | 'heist' | 'auction' | 'snake' | 'monotype' | 'wildcard' | 'chaos' | 'speedrun' | 'vip' | 'salary_cap' | 'nuzlocke' | 'slot_machine' | 'tug_of_war' | 'sealed_bid' | 'team_rocket' | 'evolution_roulette' | 'roulette_steal' | 'balanced_budget' | 'booster' | 'boss_raid';
export type ChaosEventId = 'rocket' | 'safari' | 'ditto' | 'fossil' | 'celebi' | 'yveltal' | 'wonder' | 'gym' | 'glitch' | 'gamble';

export type DraftTeamMember = {
  isMystery: boolean;
  actualPk: PokemonIndexItem;
  fromOpponent: boolean;
  cost?: number;
  isDead?: boolean;
  wasAssassinated?: boolean;
};

export interface PlayerSlot {
  id: string;
  username: string;
  team: DraftTeamMember[];
  ready: boolean;
}

export interface DraftState {
  code: string;
  status: 'LOBBY' | 'MONOTYPE_ROULETTE' | 'DRAFTING' | 'HEIST' | 'REVEAL' | 'CHAOS_EVENT' | 'NUZLOCKE' | 'ROULETTE_STEAL';
  gameMode: GameMode;
  blindClueType?: 'ability' | 'color';
  optionsPerRound: number;
  round: number;
  totalRounds: number;
  filters: any; // FilterCriteria is imported in page.tsx, we'll keep as any here to avoid circular dep if any, or just import it.
  p1: PlayerSlot;
  p2: PlayerSlot | null;
  p1Options: PokemonIndexItem[];
  p2Options: PokemonIndexItem[];
  // Heist state
  p1HeistChoice: number | null;
  p2HeistChoice: number | null;
  // Auction state
  p1Budget: number;
  p2Budget: number;
  currentBid: number;
  highestBidder: 1 | 2 | null;
  p1Passed: boolean;
  p2Passed: boolean;
  
  // Sealed Bid state
  p1SealedBid?: number | null;
  p2SealedBid?: number | null;
  sealedBidFled?: boolean;
  
  // Slot Machine state
  slotMachineRule?: string;
  
  // Tug of War state
  tugOfWarSnapThreshold?: number;
  // Modifiers
  wildcardModifier?: boolean;
  monotypeP1?: string;
  monotypeP2?: string;
  snakeTurn?: 1 | 2;
  snakePickCount?: number;
  vipType?: string;
  speedrunDeadline?: number;
  salaryNominee?: PokemonIndexItem | null;
  salaryNominationTurn?: 1 | 2;
  salaryPhase?: 'NOMINATING' | 'BIDDING';
  salaryPool?: PokemonIndexItem[];
  // Chaos State
  chaosState?: {
    eventId: ChaosEventId;
    p1Resolved: boolean;
    p2Resolved: boolean;
    data?: any;
    p1Choice?: any;
    p2Choice?: any;
  };
  // Nuzlocke state
  nuzlockeP1Target?: number | null;
  nuzlockeP1Protect?: number | null;
  nuzlockeP2Target?: number | null;
  nuzlockeP2Protect?: number | null;
  // Roulette Steal state
  rouletteStealVictimPlayer?: 1 | 2;
  rouletteStealIdx?: number;
  rouletteStealRound?: number; // which draft round triggered this (2 or 4)
  // Balanced Budget state
  bstCap?: number;
  p1BstUsed?: number;
  p2BstUsed?: number;
  
  // Booster Gacha state
  availablePacks?: string[];
  boosterPhase?: 'PICKING_PACK' | 'DRAFTING_PACK';
  p1PackChoice?: string | null;
  p2PackChoice?: string | null;
  
  // Boss Raid state
  bossId?: number;
}

