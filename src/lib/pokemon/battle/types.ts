import { PokemonIndexItem } from '../types';

export type StatusCondition = 'NONE' | 'BRN' | 'PAR' | 'SLP' | 'TOX' | 'FRZ';

export interface BattleMove {
  name: string;
  type: string;
  category: 'Physical' | 'Special' | 'Status';
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  priority: number;
  effectType?: 'damage' | 'status' | 'boost' | 'heal' | 'hazard' | 'clear';
  effectTarget?: 'self' | 'opponent' | 'field';
  effectValue?: string; // For boost: "atk:+2", for status: "PAR", for hazard: "stealth-rock"
}

export interface BattlePokemon {
  id: number;
  name: string;
  displayName: string;
  sprite: string;
  shinySprite: string;
  types: string[];
  level: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spe: number;
  };
  maxHp: number;
  currentHp: number;
  status: StatusCondition;
  statusTurns: number;
  stages: {
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spe: number;
    accuracy: number;
    evasion: number;
  };
  moves: BattleMove[];
  ability: string;
  item: string;
  isFainted: boolean;
  ownerId: string; // Peer ID of the player owning this Pokemon
  customizations?: {
    originalTypes?: string[];
    isMega?: boolean;
    isGmax?: boolean;
  };
}

export type BattleActionType = 'FIGHT' | 'SWITCH' | 'FORFEIT';

export interface BattleAction {
  playerId: string;
  type: BattleActionType;
  moveIdx?: number;   // Index in moves array (0-3) if FIGHT
  switchSlot?: number; // Index in team array (0-5) if SWITCH
}

export interface Player {
  id: string;
  username: string;
  ready: boolean;
  team: BattlePokemon[];
}

export type BattleMode = 'random' | 'standard' | 'special_forces' | 'national_dex_ag' | 'xfactor';

export interface BattleRoomState {
  code: string;
  status: 'LOBBY' | 'TEAM_SELECT' | 'PLAYING' | 'FINISHED';
  mode: BattleMode;
  format: 'singles' | 'doubles';
  p1: Player | null;
  p2: Player | null;
  spectators: string[];
  activeSlots: {
    p1: number[]; // Active indexes in p1 team (length 1 for singles, 2 for doubles)
    p2: number[]; // Active indexes in p2 team
  };
  turnCount: number;
  actionQueue: BattleAction[];
  log: string[];
  chatLog: { sender: string; message: string; timestamp: number }[];
  draftOptions?: string[][]; // 6 rounds of 3 options each (Pokemon name arrays)
  winnerId: string | null;
  hazards: {
    p1: { stealthRock: boolean; spikes: number };
    p2: { stealthRock: boolean; spikes: number };
  };
}
