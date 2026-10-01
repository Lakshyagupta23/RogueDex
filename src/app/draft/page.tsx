'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem, GameMode, ChaosEventId, DraftTeamMember, PlayerSlot, DraftState } from '@/lib/pokemon/types';
import { FilterCriteria, filterPokemon } from '@/lib/pokemon/data';
import { TYPE_COLORS } from '@/lib/pokemon/constants';
import { Users, UserPlus, Check, HelpCircle, Loader2, Play, SlidersHorizontal, ChevronDown, ChevronUp, Eye, Sword, Shield, Skull, Gavel, Infinity as InfinityIcon, Wand2, Zap } from 'lucide-react';
import { playHoverTick, playSelectClick, playLockIn, playRevealChime, playPokemonCry, playHeistAlarm, playStealSound } from '@/lib/audio';
import { CHAOS_EVENTS, getRandomFullyEvolved, getRandomLegendary, getRandomFossil } from '@/lib/pokemon/chaos';
import Link from 'next/link';

const ALL_TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
const ALL_GENS = [1,2,3,4,5,6,7,8,9];

const GAME_MODES: { id: GameMode; icon: React.ReactNode; label: string; description: string; color: string; borderColor: string }[] = [
  { id: 'standard', icon: <Shield className="w-6 h-6" />, label: 'Standard Draft', description: 'Classic 3-round draft. Pick to keep, give to opponent.', color: 'text-indigo-400', borderColor: 'border-indigo-500' },
  { id: 'wildcard', icon: <HelpCircle className="w-6 h-6" />, label: '🃏 Wildcard Draft', description: '3 cards per round. 1 is guaranteed to be a trap! Picking it gives a random fully evolved Pokémon.', color: 'text-fuchsia-400', borderColor: 'border-fuchsia-500' },
  { id: 'chaos', icon: <Wand2 className="w-6 h-6" />, label: '🌪 Chaos Draft', description: 'Standard 3-round draft, but Round 3 has a 100% chance to trigger a massive, game-changing random event!', color: 'text-fuchsia-400', borderColor: 'border-fuchsia-500' },
  { id: 'snake', icon: <InfinityIcon className="w-6 h-6" />, label: '🐍 Snake Draft', description: 'A shared pool of 18 Pokémon. Take turns picking one at a time!', color: 'text-emerald-400', borderColor: 'border-emerald-500' },
  { id: 'monotype', icon: <Sword className="w-6 h-6" />, label: '🔥 Forced Monotype', description: 'A random type is chosen. The entire draft pool is restricted to it!', color: 'text-orange-400', borderColor: 'border-orange-500' },
  { id: 'blind', icon: <Eye className="w-6 h-6" />, label: '🎭 Blind Draft', description: 'Build your team knowing ONLY the abilities of the Pokemon!', color: 'text-purple-400', borderColor: 'border-purple-500' },
  { id: 'heist', icon: <Skull className="w-6 h-6" />, label: '💣 The Heist', description: '3 normal rounds, then steal 1 Pokémon from your opponent!', color: 'text-amber-400', borderColor: 'border-amber-500' },
  { id: 'auction', icon: <Gavel className="w-6 h-6" />, label: '💰 Salary Cap', description: 'Start with $100. Live bid against your opponent!', color: 'text-emerald-400', borderColor: 'border-emerald-500' },
];

function BlindClueHint({ id, speciesId, clueType }: { id: number, speciesId: number, clueType?: 'ability' | 'color' }) {
  const [clue, setClue] = useState<string>('Loading...');
  useEffect(() => {
    if (clueType === 'color') {
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`)
        .then(r => r.json())
        .then(d => setClue(d.color?.name || 'Unknown Color'))
        .catch(() => setClue('Unknown Color'));
    } else {
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`)
        .then(r => r.json())
        .then(d => setClue(d.abilities[0]?.ability?.name?.replace(/-/g, ' ') || 'Unknown'))
        .catch(() => setClue('Unknown Ability'));
    }
  }, [id, speciesId, clueType]);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-slate-900 border border-purple-500/50 rounded-xl z-20">
      <Eye className="w-6 h-6 text-purple-500 mb-2 opacity-50" />
      <span className="text-[10px] uppercase font-bold text-slate-500">{clueType === 'color' ? 'Color Clue' : 'Ability Clue'}</span>
      <span className="text-sm font-black text-purple-400 text-center capitalize leading-tight mt-1">{clue}</span>
    </div>
  );
}

function ChaosEventPanel({ gameState, myPlayerNum, onChoice }: {
  gameState: DraftState;
  myPlayerNum: 1 | 2 | null;
  isHost: boolean;
  onChoice: (choice: any) => void;
}) {
  const cs = gameState.chaosState!;
  const eventMeta = CHAOS_EVENTS.find(e => e.id === cs.eventId);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const myTeam = myPlayerNum === 1 ? gameState.p1.team : (gameState.p2?.team ?? []);
  const myResolved = myPlayerNum === 1 ? cs.p1Resolved : cs.p2Resolved;
  const myFossil = myPlayerNum === 1 ? cs.data?.p1Fossil : cs.data?.p2Fossil;

  const handleSubmit = (choice: any) => {
    setSubmitted(true);
    onChoice(choice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="w-full max-w-2xl rounded-3xl border-2 border-fuchsia-500/60 bg-slate-900 p-8 flex flex-col items-center gap-6 shadow-2xl shadow-fuchsia-900/40">
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl">{eventMeta?.title.split(' ')[0]}</div>
          <h2 className="text-2xl font-black text-fuchsia-400 text-center tracking-tight">{eventMeta?.title.slice(3)}</h2>
          <p className="text-slate-300 text-center text-sm max-w-sm">{eventMeta?.description}</p>
        </div>

        {!myResolved && !submitted ? (
          <>
            {cs.eventId === 'fossil' && myFossil && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex flex-col items-center bg-slate-800 border border-amber-500/40 rounded-2xl p-4">
                  <img src={myFossil.sprite} className="w-20 h-20 object-contain" alt={myFossil.displayName} />
                  <span className="font-black text-white capitalize mt-1">{myFossil.displayName}</span>
                  <div className="flex gap-1 mt-1">{myFossil.types.map((t: string) => <span key={t} className="text-[10px] font-bold uppercase" style={{ color: TYPE_COLORS[t] }}>{t}</span>)}</div>
                  <span className="text-xs text-amber-400 font-bold mt-1">BST: {myFossil.stats.total}</span>
                </div>
                <p className="text-slate-400 text-sm">Pick which team slot to replace — or skip</p>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {myTeam.map((m, i) => (
                    <button key={i} onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}
                      className={`p-2 rounded-xl border flex flex-col items-center transition-all ${selectedIdx === i ? 'border-fuchsia-500 bg-fuchsia-900/30' : 'border-slate-700 bg-slate-800 hover:border-fuchsia-400'}`}>
                      <img src={m.actualPk.sprite} className="w-10 h-10 object-contain" alt={m.actualPk.displayName} />
                      <span className="text-[10px] font-bold text-white capitalize truncate w-full text-center">{m.actualPk.displayName}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => handleSubmit(-1)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-xl">Skip</button>
                  <button onClick={() => { if (selectedIdx !== null) handleSubmit(selectedIdx); }} disabled={selectedIdx === null}
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl">Accept Fossil!</button>
                </div>
              </div>
            )}

            {cs.eventId === 'wonder' && (
              <div className="flex flex-col items-center gap-4 w-full">
                <p className="text-slate-400 text-sm text-center">Select a Pokémon to throw into the Wonder Trade. You&apos;ll get a random fully evolved one back!</p>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {myTeam.map((m, i) => (
                    <button key={i} onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}
                      className={`p-2 rounded-xl border flex flex-col items-center transition-all ${selectedIdx === i ? 'border-fuchsia-500 bg-fuchsia-900/30' : 'border-slate-700 bg-slate-800 hover:border-fuchsia-400'}`}>
                      <img src={m.actualPk.sprite} className="w-10 h-10 object-contain" alt={m.actualPk.displayName} />
                      <span className="text-[10px] font-bold text-white capitalize truncate w-full text-center">{m.actualPk.displayName}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { if (selectedIdx !== null) handleSubmit(selectedIdx); }} disabled={selectedIdx === null}
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl">Send to Wonder Trade!</button>
              </div>
            )}

            {cs.eventId === 'gamble' && (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="text-4xl font-black text-amber-400 animate-pulse">🎰 SPIN THE WHEEL?</div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center text-sm text-slate-300 w-full">
                  <p><span className="text-emerald-400 font-black">WIN (50%):</span> Steal a random Pokémon from your opponent!</p>
                  <p className="mt-1"><span className="text-rose-400 font-black">LOSE (50%):</span> Your best Pokémon is replaced by a random fully evolved one!</p>
                </div>
                <div className="flex gap-4 w-full">
                  <button onClick={() => handleSubmit(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 rounded-xl text-lg">🛡 Play it safe</button>
                  <button onClick={() => handleSubmit(true)} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl text-lg">🎰 GAMBLE!</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
            <p className="font-bold">{submitted ? 'Waiting for opponent...' : 'Event resolved! Continuing draft...'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DraftMode() {
  const { pokemonList, loading } = usePokemon();
  const [username, setUsername] = useState('Trainer');
  const [joinCode, setJoinCode] = useState('');
  const [optionsPerRound, setOptionsPerRound] = useState(3);
  const [selectedMode, setSelectedMode] = useState<GameMode>('standard');
  const [blindClueType, setBlindClueType] = useState<'ability' | 'color'>('ability');

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGens, setSelectedGens] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeMatchMode, setTypeMatchMode] = useState<'primary'|'secondary'|'either'|'both'>('either');
  const [formsMode, setFormsMode] = useState<'all'|'base_only'|'mega_only'|'regional_only'>('all');
  const [maxBst600, setMaxBst600] = useState(false);
  const [excludeLegendary, setExcludeLegendary] = useState(false);
  const [excludeMythical, setExcludeMythical] = useState(false);
  const [excludeParadox, setExcludeParadox] = useState(false);
  const [excludeStarters, setExcludeStarters] = useState(false);
  const [excludeUltraBeast, setExcludeUltraBeast] = useState(false);
  const [excludeAlolan, setExcludeAlolan] = useState(false);
  const [excludeGalarian, setExcludeGalarian] = useState(false);
  const [excludeHisuian, setExcludeHisuian] = useState(false);
  const [excludePaldean, setExcludePaldean] = useState(false);
  const [fullyEvolvedOnly, setFullyEvolvedOnly] = useState(false);

  // Connection refs
  const peerRef = useRef<any>(null);
  const isHostRef = useRef(false);
  const hostConnRef = useRef<any>(null);
  const guestConnRef = useRef<any>(null);
  const playerIdRef = useRef('d_' + Math.random().toString(36).substring(2, 8));
  const usernameRef = useRef(username);
  useEffect(() => { usernameRef.current = username; }, [username]);

  // Game state
  const [gameState, setGameState] = useState<DraftState | null>(null);
  const gameStateRef = useRef<DraftState | null>(null);
  const [keepChoice, setKeepChoice] = useState<number | null>(null);
  const [giveChoice, setGiveChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const p1PendingRef = useRef<{ keepId: number; giveId: number } | null>(null);
  const p2PendingRef = useRef<{ keepId: number; giveId: number } | null>(null);

  // Heist state
  const [myHeistStealIdx, setMyHeistStealIdx] = useState<number | null>(null);
  const [myHeistSwapIdx, setMyHeistSwapIdx] = useState<number | null>(null);
  const [heistSubmitted, setHeistSubmitted] = useState(false);
  const p1HeistRef = useRef<{ stealIdx: number; swapIdx: number } | null>(null);
  const p2HeistRef = useRef<{ stealIdx: number; swapIdx: number } | null>(null);

  // Auction Local State
  const [auctionBidInput, setAuctionBidInput] = useState<string>('');

  const applyState = useCallback((next: DraftState) => {
    gameStateRef.current = next;
    setGameState(next);
  }, []);

  const broadcastToGuest = useCallback((state: DraftState) => {
    const conn = guestConnRef.current;
    if (conn && conn.open) conn.send({ type: 'sync_state', state });
  }, []);

  const buildFilters = useCallback((): FilterCriteria => ({
    generations: selectedGens,
    types: selectedTypes,
    typeMatchMode,
    formsMode,
    maxBst: maxBst600 ? 600 : undefined,
    excludeLegendary,
    excludeMythical,
    excludeParadox,
    excludeStarters,
    excludeUltraBeast,
    excludeAlolan,
    excludeGalarian,
    excludeHisuian,
    excludePaldean,
    categories: fullyEvolvedOnly ? ['fully_evolved'] : [],
  }), [selectedGens, selectedTypes, typeMatchMode, formsMode, maxBst600,
       excludeLegendary, excludeMythical, excludeParadox, excludeStarters,
       excludeUltraBeast, excludeAlolan, excludeGalarian, excludeHisuian, excludePaldean, fullyEvolvedOnly]);

  const generateOptions = useCallback((state: DraftState, list: PokemonIndexItem[]) => {
    const pool = filterPokemon(list, state.filters);
    const pickUnique = (count: number): PokemonIndexItem[] => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length)).map(p => ({ ...p }));
      if (state.gameMode === 'wildcard' && selected.length > 0) {
        const trapIndex = Math.floor(Math.random() * selected.length);
        selected[trapIndex].isTrap = true;
      }
      return selected;
    };
    if (state.gameMode === 'auction') {
      state.p1Options = pickUnique(1);
      state.p2Options = [];
      state.currentBid = 0;
      state.highestBidder = null;
      state.p1Passed = state.p1.team.length >= 6;
      state.p2Passed = state.p2 ? state.p2.team.length >= 6 : false;
    } else if (state.gameMode === 'snake') {
      if (state.round === 1) { // Only generate once for snake
        state.p1Options = pickUnique(18); // 18 options for 12 picks
        state.p2Options = [];
      }
    } else {
      state.p1Options = pickUnique(state.optionsPerRound);
      state.p2Options = pickUnique(state.optionsPerRound);
    }
  }, []);

  const getActualPk = useCallback((pk: PokemonIndexItem, list: PokemonIndexItem[]) => {
    if (pk.isTrap) {
      playHeistAlarm();
      const fe = list.filter(p => p.isFullyEvolved && p.id < 10000 && !p.isMega);
      return fe[Math.floor(Math.random() * fe.length)] || pk;
    }
    return pk;
  }, []);

  const resolveAuctionWin = useCallback((state: DraftState, winner: 1 | 2 | null) => {
    const pk = getActualPk(state.p1Options[0], pokemonList);
    if (!state.p1Options[0].isTrap) playLockIn();

    if (winner === 1) {
      state.p1Budget -= state.currentBid;
      state.p1.team.push({ isMystery: false, actualPk: pk, fromOpponent: false, cost: state.currentBid });
    } else if (winner === 2) {
      state.p2Budget -= state.currentBid;
      state.p2!.team.push({ isMystery: false, actualPk: pk, fromOpponent: false, cost: state.currentBid });
    }
    
    // Check end condition
    if (state.p1.team.length >= 6 && state.p2!.team.length >= 6) {
      state.status = 'REVEAL';
    } else {
      state.round += 1;
      generateOptions(state, pokemonList);
    }
    applyState({ ...state });
    broadcastToGuest({ ...state });
  }, [applyState, broadcastToGuest, generateOptions, getActualPk, pokemonList]);

  const resolveSnakePick = useCallback((pkId: number) => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
    const pkIndex = next.p1Options.findIndex(p => p.id === pkId);
    if (pkIndex === -1) return;
    
    let originalPk = next.p1Options[pkIndex];
    let pk = getActualPk(originalPk, pokemonList);
    if (!originalPk.isTrap) playLockIn();
    
    if (next.snakeTurn === 1) {
      next.p1.team.push({ isMystery: false, actualPk: pk, fromOpponent: false });
    } else {
      next.p2!.team.push({ isMystery: false, actualPk: pk, fromOpponent: false });
    }
    
    next.p1Options.splice(pkIndex, 1);
    
    next.snakePickCount = (next.snakePickCount || 0) + 1;
    const c = next.snakePickCount;
    if (c >= 12) {
      next.status = 'REVEAL';
    } else {
      const isP1 = [0, 3, 4, 7, 8, 11].includes(c);
      next.snakeTurn = isP1 ? 1 : 2;
    }
    
    applyState(next); broadcastToGuest(next);
  }, [applyState, broadcastToGuest, getActualPk, pokemonList]);

  // Resolve a standard draft round
  const triggerChaosEvent = useCallback((state: DraftState) => {
    const CHAOS_EVENT_IDS: ChaosEventId[] = ['rocket','safari','ditto','fossil','celebi','yveltal','wonder','gym','glitch','gamble'];
    const eventId = CHAOS_EVENT_IDS[Math.floor(Math.random() * CHAOS_EVENT_IDS.length)];
    playHeistAlarm();

    const p1Team = state.p1.team;
    const p2Team = state.p2!.team;

    // Events that need no player choice — resolve immediately
    if (eventId === 'rocket') {
      // Swap strongest pokemon between teams
      const getBest = (team: DraftTeamMember[]) => team.reduce((a, b) => (b.actualPk.stats.total > a.actualPk.stats.total ? b : a), team[0]);
      if (p1Team.length && p2Team.length) {
        const b1 = getBest(p1Team);
        const b2 = getBest(p2Team);
        const i1 = p1Team.indexOf(b1); const i2 = p2Team.indexOf(b2);
        state.p1.team[i1] = { ...b2, fromOpponent: true };
        state.p2!.team[i2] = { ...b1, fromOpponent: true };
      }
      state.chaosState = { eventId, p1Resolved: true, p2Resolved: true, data: { resolved: true } };
      state.status = 'DRAFTING';
      generateOptions(state, pokemonList);
    } else if (eventId === 'safari') {
      // Next round ignores filters — generate from full pool
      const fullPool = pokemonList.filter(p => p.id < 10000 && !p.isMega);
      const shuffled = [...fullPool].sort(() => Math.random() - 0.5);
      state.p1Options = shuffled.slice(0, state.optionsPerRound).map(p => ({ ...p }));
      state.p2Options = shuffled.slice(state.optionsPerRound, state.optionsPerRound * 2).map(p => ({ ...p }));
      state.chaosState = { eventId, p1Resolved: true, p2Resolved: true, data: { resolved: true } };
      state.status = 'DRAFTING';
    } else if (eventId === 'ditto') {
      const ditto = pokemonList.find(p => p.id === 132);
      if (ditto) {
        state.p1Options = Array(state.optionsPerRound).fill(null).map(() => ({ ...ditto }));
        state.p2Options = Array(state.optionsPerRound).fill(null).map(() => ({ ...ditto }));
      }
      state.chaosState = { eventId, p1Resolved: true, p2Resolved: true, data: { resolved: true } };
      state.status = 'DRAFTING';
    } else if (eventId === 'celebi') {
      const tmp = state.p1.team;
      state.p1.team = state.p2!.team.map(m => ({ ...m }));
      state.p2!.team = tmp.map(m => ({ ...m }));
      state.chaosState = { eventId, p1Resolved: true, p2Resolved: true, data: { resolved: true } };
      state.status = 'DRAFTING';
      generateOptions(state, pokemonList);
    } else if (eventId === 'yveltal') {
      const getBest = (team: DraftTeamMember[]) => team.length ? team.reduce((a, b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, team[0]) : null;
      const b1 = getBest(p1Team); const b2 = getBest(p2Team);
      if (b1) { const i = p1Team.indexOf(b1); state.p1.team[i] = { ...b1, actualPk: getRandomFullyEvolved(pokemonList) }; }
      if (b2) { const i = p2Team.indexOf(b2); state.p2!.team[i] = { ...b2, actualPk: getRandomFullyEvolved(pokemonList) }; }
      state.chaosState = { eventId, p1Resolved: true, p2Resolved: true, data: { resolved: true } };
      state.status = 'DRAFTING';
      generateOptions(state, pokemonList);
    } else if (eventId === 'gym') {
      const randomType = ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
      const typePool = pokemonList.filter(p => p.types.includes(randomType) && p.id < 10000 && !p.isMega);
      const shuffled = [...typePool].sort(() => Math.random() - 0.5);
      state.p1Options = shuffled.slice(0, state.optionsPerRound).map(p => ({ ...p }));
      state.p2Options = shuffled.slice(state.optionsPerRound, state.optionsPerRound * 2).map(p => ({ ...p }));
      state.chaosState = { eventId, p1Resolved: true, p2Resolved: true, data: { lockedType: randomType, resolved: true } };
      state.status = 'DRAFTING';
    } else if (eventId === 'glitch') {
      const getBest = (team: DraftTeamMember[]) => team.length ? { m: team.reduce((a, b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, team[0]), i: 0 } : null;
      if (p1Team.length) { const idx = p1Team.indexOf(p1Team.reduce((a,b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, p1Team[0])); state.p1.team[idx] = { ...p1Team[idx], actualPk: getRandomLegendary(pokemonList) }; }
      if (p2Team.length) { const idx = p2Team.indexOf(p2Team.reduce((a,b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, p2Team[0])); state.p2!.team[idx] = { ...p2Team[idx], actualPk: getRandomLegendary(pokemonList) }; }
      state.chaosState = { eventId, p1Resolved: true, p2Resolved: true, data: { resolved: true } };
      state.status = 'DRAFTING';
      generateOptions(state, pokemonList);
    } else {
      // Events requiring player choice: fossil, wonder, gamble
      const eventData: any = {};
      if (eventId === 'fossil') {
        eventData.p1Fossil = getRandomFossil(pokemonList);
        eventData.p2Fossil = getRandomFossil(pokemonList);
      }
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: eventData };
      state.status = 'CHAOS_EVENT';
    }
  }, [generateOptions, pokemonList]);

  const resolveChaosChoice = useCallback((playerNum: 1 | 2, choice: any) => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
    const cs = next.chaosState!;
    if (playerNum === 1) { cs.p1Choice = choice; cs.p1Resolved = true; }
    else { cs.p2Choice = choice; cs.p2Resolved = true; }

    if (cs.p1Resolved && cs.p2Resolved) {
      const eventId = cs.eventId;
      if (eventId === 'fossil') {
        // p1Choice = index to replace (-1 = skip), p2Choice same
        if (cs.p1Choice >= 0 && next.p1.team[cs.p1Choice]) next.p1.team[cs.p1Choice] = { isMystery: false, actualPk: cs.data.p1Fossil, fromOpponent: false };
        if (cs.p2Choice >= 0 && next.p2!.team[cs.p2Choice]) next.p2!.team[cs.p2Choice] = { isMystery: false, actualPk: cs.data.p2Fossil, fromOpponent: false };
      } else if (eventId === 'wonder') {
        // p1Choice = index to trade
        if (cs.p1Choice >= 0 && next.p1.team[cs.p1Choice]) next.p1.team[cs.p1Choice] = { isMystery: false, actualPk: getRandomFullyEvolved(pokemonList), fromOpponent: false };
        if (cs.p2Choice >= 0 && next.p2!.team[cs.p2Choice]) next.p2!.team[cs.p2Choice] = { isMystery: false, actualPk: getRandomFullyEvolved(pokemonList), fromOpponent: false };
      } else if (eventId === 'gamble') {
        // p1Choice / p2Choice = true (gamble) or false (keep)
        const getBestIdx = (team: DraftTeamMember[]) => team.length ? team.indexOf(team.reduce((a, b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, team[0])) : -1;
        if (cs.p1Choice === true) {
          const win = Math.random() < 0.5;
          const bestIdx = getBestIdx(next.p1.team);
          if (win && next.p2!.team.length) {
            const stealIdx = Math.floor(Math.random() * next.p2!.team.length);
            if (bestIdx >= 0) next.p1.team[bestIdx] = { ...next.p2!.team[stealIdx], fromOpponent: true };
          } else if (!win && bestIdx >= 0) {
            next.p1.team[bestIdx] = { ...next.p1.team[bestIdx], actualPk: getRandomFullyEvolved(pokemonList) };
          }
        }
        if (cs.p2Choice === true) {
          const win = Math.random() < 0.5;
          const bestIdx = getBestIdx(next.p2!.team);
          if (win && next.p1.team.length) {
            const stealIdx = Math.floor(Math.random() * next.p1.team.length);
            if (bestIdx >= 0) next.p2!.team[bestIdx] = { ...next.p1.team[stealIdx], fromOpponent: true };
          } else if (!win && bestIdx >= 0) {
            next.p2!.team[bestIdx] = { ...next.p2!.team[bestIdx], actualPk: getRandomFullyEvolved(pokemonList) };
          }
        }
      }
      next.status = 'DRAFTING';
      generateOptions(next, pokemonList);
    }
    applyState(next); broadcastToGuest(next);
  }, [applyState, broadcastToGuest, generateOptions, pokemonList]);

  const resolveRound = useCallback((state: DraftState) => {
    const act1 = p1PendingRef.current!;
    const act2 = p2PendingRef.current!;
    const p1Keep = state.p1Options.find(p => p.id === act1.keepId)!;
    const p1Give = state.p1Options.find(p => p.id === act1.giveId)!;
    const p2Keep = state.p2Options.find(p => p.id === act2.keepId)!;
    const p2Give = state.p2Options.find(p => p.id === act2.giveId)!;

    const isBlind = state.gameMode === 'blind';
    
    let p1k = getActualPk(p1Keep, pokemonList);
    let p2k = getActualPk(p2Keep, pokemonList);
    let p1g = getActualPk(p1Give, pokemonList);
    let p2g = getActualPk(p2Give, pokemonList);

    state.p1.team.push({ isMystery: isBlind, actualPk: p1k, fromOpponent: false });
    state.p1.team.push({ isMystery: true,  actualPk: p2g, fromOpponent: true  });
    state.p2!.team.push({ isMystery: isBlind, actualPk: p2k, fromOpponent: false });
    state.p2!.team.push({ isMystery: true,  actualPk: p1g, fromOpponent: true  });

    state.p1.ready = false;
    state.p2!.ready = false;
    p1PendingRef.current = null;
    p2PendingRef.current = null;
    state.round += 1;

    if (state.round > state.totalRounds) {
      if (state.gameMode === 'heist') {
        state.status = 'HEIST';
        state.p1HeistChoice = null;
        state.p2HeistChoice = null;
      } else if (state.gameMode === 'chaos' && state.round === state.totalRounds + 1) {
        // After last round of chaos draft, trigger an event instead of reveal
        triggerChaosEvent(state);
      } else {
        state.status = 'REVEAL';
      }
    } else {
      generateOptions(state, pokemonList);
    }
    applyState({ ...state });
    broadcastToGuest({ ...state });
  }, [applyState, broadcastToGuest, generateOptions, pokemonList, triggerChaosEvent, getActualPk]);

  // Resolve the Heist round
  const resolveHeist = useCallback((state: DraftState) => {
    const h1 = p1HeistRef.current!;
    const h2 = p2HeistRef.current!;

    const stolen1 = state.p2!.team[h1.stealIdx];
    const stolen2 = state.p1.team[h2.stealIdx];

    const newP1Team = [...state.p1.team];
    const newP2Team = [...state.p2!.team];

    const p1SwappedOut = newP1Team[h1.swapIdx];
    const p2SwappedOut = newP2Team[h2.swapIdx];

    newP1Team[h1.swapIdx] = { ...stolen1, fromOpponent: true, isMystery: false };
    newP2Team[h2.swapIdx] = { ...stolen2, fromOpponent: true, isMystery: false };
    newP2Team[h1.stealIdx] = { ...p1SwappedOut, fromOpponent: true, isMystery: false };
    newP1Team[h2.stealIdx] = { ...p2SwappedOut, fromOpponent: true, isMystery: false };

    state.p1.team = newP1Team;
    state.p2!.team = newP2Team;
    state.p1HeistChoice = null;
    state.p2HeistChoice = null;
    p1HeistRef.current = null;
    p2HeistRef.current = null;
    state.status = 'REVEAL';
    applyState({ ...state });
    broadcastToGuest({ ...state });
  }, [applyState, broadcastToGuest]);

  const handleHostReceiveData = useCallback((data: any) => {
    const cur = gameStateRef.current;
    if (!cur) return;
    if (data.type === 'guest_join') {
      const next: DraftState = { ...cur, p2: { id: data.playerId, username: data.username, team: [], ready: false } };
      applyState(next);
      broadcastToGuest(next);
    }
    if (data.type === 'submit_choices') {
      const next: DraftState = JSON.parse(JSON.stringify(cur));
      next.p2!.ready = true;
      p2PendingRef.current = { keepId: data.keepId, giveId: data.giveId };
      if (next.p1.ready) { resolveRound(next); } else { applyState(next); broadcastToGuest(next); }
    }
    if (data.type === 'submit_heist') {
      const next: DraftState = JSON.parse(JSON.stringify(cur));
      next.p2HeistChoice = data.stealIdx;
      p2HeistRef.current = { stealIdx: data.stealIdx, swapIdx: data.swapIdx };
      if (p1HeistRef.current !== null) { resolveHeist(next); } else { applyState(next); broadcastToGuest(next); }
    }
    if (data.type === 'chaos_choice') {
      resolveChaosChoice(2, data.choice);
    }
    if (data.type === 'auction_bid') {
      const next: DraftState = JSON.parse(JSON.stringify(cur));
      const budget = data.playerNum === 1 ? next.p1Budget : next.p2Budget;
      const isValid = data.amount <= budget && (data.amount > next.currentBid || (data.amount === 0 && next.highestBidder === null));
      if (isValid) {
         playSelectClick();
         next.currentBid = data.amount;
         next.highestBidder = data.playerNum;
         next.p1Passed = next.p1.team.length >= 6;
         next.p2Passed = next.p2!.team.length >= 6;

         if (next.p1Passed && next.highestBidder === 2) resolveAuctionWin(next, 2);
         else if (next.p2Passed && next.highestBidder === 1) resolveAuctionWin(next, 1);
         else { applyState(next); broadcastToGuest(next); }
      }
    }
    if (data.type === 'auction_pass') {
      const next: DraftState = JSON.parse(JSON.stringify(cur));
      if (data.playerNum === 1) next.p1Passed = true;
      else next.p2Passed = true;

      if (next.p1Passed && next.p2Passed && next.highestBidder === null) {
        // Discard
        stateDiscardAndDraw(next);
      } else if (next.p1Passed && next.highestBidder === 2) {
        resolveAuctionWin(next, 2);
      } else if (next.p2Passed && next.highestBidder === 1) {
        resolveAuctionWin(next, 1);
      } else {
        applyState(next); broadcastToGuest(next);
      }
    }
    if (data.type === 'snake_pick') {
      resolveSnakePick(data.pkId);
    }
  }, [applyState, broadcastToGuest, resolveRound, resolveHeist, resolveAuctionWin, resolveChaosChoice, resolveSnakePick]);

  const stateDiscardAndDraw = useCallback((next: DraftState) => {
     next.round += 1;
     generateOptions(next, pokemonList);
     applyState(next);
     broadcastToGuest(next);
  }, [applyState, broadcastToGuest, generateOptions, pokemonList]);

  const initPeer = useCallback((id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (peerRef.current) { resolve(peerRef.current); return; }
      import('peerjs').then(({ Peer }) => {
        const peer = new Peer(id, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              {
                urls: [
                  'turn:relay1.expressturn.com:3478',
                  'turn:relay1.expressturn.com:3478?transport=tcp'
                ],
                username: 'efKVVZXMPVLEWKFNEW',
                credential: 'qA0S6sn0zxWM2v3N'
              },
              { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
            ]
          }
        });
        peer.on('open', () => { peerRef.current = peer; resolve(peer); });
        peer.on('connection', (conn: any) => {
          if (!isHostRef.current) return;
          guestConnRef.current = conn;
          conn.on('open', () => {
            if (gameStateRef.current) conn.send({ type: 'sync_state', state: gameStateRef.current });
          });
          conn.on('data', (d: any) => handleHostReceiveData(d));
          conn.on('error', (err: any) => console.error('Host conn error:', err));
        });
        peer.on('error', (err: any) => { console.error('PeerJS error:', err); reject(err); });
      }).catch(reject);
    });
  }, [handleHostReceiveData]);

  const handleCreateRoom = useCallback(async () => {
    if (!usernameRef.current.trim()) return alert('Enter a username first');
    isHostRef.current = true;
    const pid = playerIdRef.current;
    try {
      const peer = await initPeer(pid);
      const code = peer.id.toUpperCase();
      const filters = buildFilters();
      const totalRounds = 3; 
      const initial: DraftState = {
        code, status: 'LOBBY', gameMode: selectedMode, blindClueType,
        optionsPerRound: selectedMode === 'wildcard' ? 3 : optionsPerRound, round: 1, totalRounds, filters,
        p1: { id: pid, username: usernameRef.current, team: [], ready: false },
        p2: null, p1Options: [], p2Options: [],
        p1HeistChoice: null, p2HeistChoice: null,
        p1Budget: 100, p2Budget: 100, currentBid: 0, highestBidder: null, p1Passed: false, p2Passed: false,
        wildcardModifier: false
      };
      applyState(initial);
    } catch (e: any) {
      isHostRef.current = false;
      alert('Could not create room. Please refresh and try again.\n' + (e.message || String(e)));
    }
  }, [initPeer, optionsPerRound, applyState, buildFilters, selectedMode]);

  const handleJoinRoom = useCallback(async () => {
    const uname = usernameRef.current.trim();
    const code = joinCode.trim().toLowerCase();
    if (!uname) return alert('Enter a username first');
    if (!code) return alert('Enter a room code');
    isHostRef.current = false;
    const guestId = 'g_' + Math.random().toString(36).substring(2, 10);
    try {
      const peer = await initPeer(guestId);
      const conn = peer.connect(code);
      hostConnRef.current = conn;
      let opened = false;
      const timeout = setTimeout(() => {
        if (!opened) {
          alert('Could not connect to that room.\nMake sure the host has created the room and the code is correct.');
          conn.close(); peerRef.current?.destroy(); peerRef.current = null;
        }
      }, 12000);
      conn.on('open', () => {
        opened = true; clearTimeout(timeout);
        conn.send({ type: 'guest_join', playerId: guestId, username: uname });
      });
      conn.on('data', (data: any) => {
        if (data.type === 'sync_state') { applyState(data.state); setSubmitted(false); }
      });
      conn.on('error', (err: any) => {
        clearTimeout(timeout);
        console.error('Guest conn error:', err);
        alert('Connection error: ' + (err.message || String(err)));
      });
      const peerErrorHandler = (err: any) => {
        if (err.type === 'peer-unavailable') {
          clearTimeout(timeout);
          alert('Room does not exist! Make sure you entered the correct code.');
          peer.off('error', peerErrorHandler);
        }
      };
      peer.on('error', peerErrorHandler);
    } catch (e: any) { alert('Error joining room: ' + (e.message || String(e))); }
  }, [joinCode, initPeer, applyState]);

  const startDraft = useCallback(() => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const cur = gameStateRef.current;
    const next: DraftState = { 
       ...cur, 
       status: 'DRAFTING',
       gameMode: selectedMode,
       blindClueType,
       optionsPerRound,
       filters: buildFilters(),
       round: 1,
       p1: { ...cur.p1, team: [], ready: false },
       p2: cur.p2 ? { ...cur.p2, team: [], ready: false } : null,
       p1HeistChoice: null, p2HeistChoice: null,
       p1Budget: 100, p2Budget: 100, currentBid: 0, highestBidder: null, p1Passed: false, p2Passed: false,
       snakeTurn: 1, snakePickCount: 0
    };
    p1PendingRef.current = null;
    p2PendingRef.current = null;
    p1HeistRef.current = null;
    p2HeistRef.current = null;
    setKeepChoice(null); setGiveChoice(null); setSubmitted(false);
    setMyHeistStealIdx(null); setMyHeistSwapIdx(null); setHeistSubmitted(false);
    generateOptions(next, pokemonList);
    applyState(next); broadcastToGuest(next);
  }, [generateOptions, applyState, broadcastToGuest, pokemonList, selectedMode, blindClueType, optionsPerRound, buildFilters]);

  const submitMyChoices = useCallback(() => {
    if (!gameStateRef.current || keepChoice === null || giveChoice === null) return;
    playLockIn();
    setSubmitted(true);
    if (isHostRef.current) {
      p1PendingRef.current = { keepId: keepChoice, giveId: giveChoice };
      const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
      next.p1.ready = true;
      if (p2PendingRef.current) { resolveRound(next); } else { applyState(next); broadcastToGuest(next); }
    } else {
      const conn = hostConnRef.current;
      if (conn && conn.open) {
        conn.send({ type: 'submit_choices', keepId: keepChoice, giveId: giveChoice });
      } else { alert('Lost connection to host!'); setSubmitted(false); }
    }
  }, [keepChoice, giveChoice, applyState, broadcastToGuest, resolveRound]);

  const submitMyHeist = useCallback(() => {
    if (!gameStateRef.current || myHeistStealIdx === null || myHeistSwapIdx === null) return;
    playStealSound();
    setHeistSubmitted(true);
    if (isHostRef.current) {
      p1HeistRef.current = { stealIdx: myHeistStealIdx, swapIdx: myHeistSwapIdx };
      const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
      next.p1HeistChoice = myHeistStealIdx;
      if (p2HeistRef.current !== null) { resolveHeist(next); } else { applyState(next); broadcastToGuest(next); }
    } else {
      const conn = hostConnRef.current;
      if (conn && conn.open) {
        conn.send({ type: 'submit_heist', stealIdx: myHeistStealIdx, swapIdx: myHeistSwapIdx });
      } else { alert('Lost connection to host!'); setHeistSubmitted(false); }
    }
  }, [myHeistStealIdx, myHeistSwapIdx, applyState, broadcastToGuest, resolveHeist]);

  const submitAuctionBid = useCallback((amount: number) => {
    if (!gameStateRef.current) return;
    const playerNum = isHostRef.current ? 1 : 2;
    if (isHostRef.current) {
      handleHostReceiveData({ type: 'auction_bid', playerNum, amount });
    } else {
      hostConnRef.current?.send({ type: 'auction_bid', playerNum, amount });
    }
  }, [handleHostReceiveData]);

  const submitAuctionPass = useCallback(() => {
    if (!gameStateRef.current) return;
    const playerNum = isHostRef.current ? 1 : 2;
    if (isHostRef.current) {
      handleHostReceiveData({ type: 'auction_pass', playerNum });
    } else {
      hostConnRef.current?.send({ type: 'auction_pass', playerNum });
    }
  }, [handleHostReceiveData]);

  const submitSnakePick = useCallback((pkId: number) => {
    if (isHostRef.current) {
      resolveSnakePick(pkId);
    } else {
      hostConnRef.current?.send({ type: 'snake_pick', pkId });
    }
  }, [resolveSnakePick]);

  const revealCards = useCallback(() => {
    if (!isHostRef.current || !gameStateRef.current) return;
    playRevealChime();
    const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
    next.p1.team = next.p1.team.map(m => ({ ...m, isMystery: false }));
    next.p2!.team = next.p2!.team.map(m => ({ ...m, isMystery: false }));
    applyState(next); broadcastToGuest(next);
  }, [applyState, broadcastToGuest]);

  const returnToLobby = useCallback(() => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const cur = gameStateRef.current;
    const next: DraftState = {
      ...cur,
      status: 'LOBBY',
    };
    applyState(next); broadcastToGuest(next);
  }, [applyState, broadcastToGuest]);

  const restartDraft = useCallback(() => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const cur = gameStateRef.current;
    const next: DraftState = {
      ...cur,
      status: 'DRAFTING',
      round: 1,
      p1: { ...cur.p1, team: [], ready: false },
      p2: cur.p2 ? { ...cur.p2, team: [], ready: false } : null,
      p1Options: [],
      p2Options: [],
      p1HeistChoice: null, p2HeistChoice: null,
      p1Budget: 100, p2Budget: 100, currentBid: 0, highestBidder: null, p1Passed: false, p2Passed: false,
      snakeTurn: 1, snakePickCount: 0
    };
    p1PendingRef.current = null;
    p2PendingRef.current = null;
    p1HeistRef.current = null;
    p2HeistRef.current = null;
    setKeepChoice(null); setGiveChoice(null); setSubmitted(false);
    setMyHeistStealIdx(null); setMyHeistSwapIdx(null); setHeistSubmitted(false);
    generateOptions(next, pokemonList);
    applyState(next); broadcastToGuest(next);
  }, [generateOptions, applyState, broadcastToGuest, pokemonList]);

  useEffect(() => {
    if (gameState?.status === 'HEIST') {
      playHeistAlarm();
      setMyHeistStealIdx(null); setMyHeistSwapIdx(null); setHeistSubmitted(false);
    }
  }, [gameState?.status]);

  useEffect(() => { setKeepChoice(null); setGiveChoice(null); setSubmitted(false); }, [gameState?.round]);
  useEffect(() => { return () => { peerRef.current?.destroy(); peerRef.current = null; }; }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0b0e16] flex items-center justify-center text-white">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    </div>
  );

  const isHost = isHostRef.current;
  const myPlayerNum = isHost ? 1 : 2;
  const myOptions = isHost ? gameState?.p1Options : gameState?.p2Options;
  const mySlot = isHost ? gameState?.p1 : gameState?.p2;
  const opponentSlot = isHost ? gameState?.p2 : gameState?.p1;
  const activeFilterCount = [
    selectedGens.length > 0, selectedTypes.length > 0, formsMode !== 'all', maxBst600,
    excludeLegendary, excludeMythical, excludeParadox, excludeStarters, excludeUltraBeast,
    excludeAlolan, excludeGalarian, excludeHisuian, excludePaldean, fullyEvolvedOnly
  ].filter(Boolean).length;
  const filteredPool = pokemonList.length > 0 ? filterPokemon(pokemonList, buildFilters()) : [];

  const resetFilters = () => {
    setSelectedGens([]); setSelectedTypes([]); setTypeMatchMode('either');
    setFormsMode('all'); setMaxBst600(false);
    setExcludeLegendary(false); setExcludeMythical(false); setExcludeParadox(false);
    setExcludeStarters(false); setExcludeUltraBeast(false);
    setExcludeAlolan(false); setExcludeGalarian(false); setExcludeHisuian(false); setExcludePaldean(false); setFullyEvolvedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0e16] text-slate-200 p-6 font-sans">
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">RogueDex</Link>
          <span className="text-slate-600 font-bold">/</span>
          <h1 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Clash Draft
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {(!gameState || (gameState.status === 'LOBBY' && isHost)) ? (
          <div className="max-w-xl mx-auto mt-6 flex flex-col gap-4">
            <div className="p-8 rounded-2xl flex flex-col gap-6 border border-slate-800 bg-slate-900/50">
              <div className="text-center">
                <h2 className="text-2xl font-black text-white mb-2">Multiplayer Draft</h2>
                <p className="text-sm text-slate-400">Pick for yourself, give to your opponent.</p>
                {gameState && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4">
                     <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mb-2">Room Code</p>
                     <div className="text-3xl font-black font-mono tracking-widest text-indigo-400 select-all cursor-pointer">{gameState.code}</div>
                     <p className="text-xs text-slate-500 mt-2 font-bold">Opponent Status: <span className={gameState.p2 ? "text-emerald-400" : "text-amber-400"}>{gameState.p2 ? `Joined (${gameState.p2.username})` : 'Waiting...'}</span></p>
                  </div>
                )}
              </div>

              {!gameState && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Game Mode</label>
                <div className="flex flex-col gap-2">
                  {GAME_MODES.map(mode => (
                    <button key={mode.id} onClick={() => { playHoverTick(); setSelectedMode(mode.id); }}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedMode === mode.id
                          ? `bg-slate-800 ${mode.borderColor} ${mode.color}`
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <span className={`mt-0.5 shrink-0 ${selectedMode === mode.id ? mode.color : 'text-slate-600'}`}>{mode.icon}</span>
                      <div>
                        <p className="font-bold text-sm text-white">{mode.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{mode.description}</p>
                      </div>
                    </button>
                  ))}
                  {selectedMode === 'blind' && (
                    <div className="mt-2 p-3 rounded-xl border border-purple-500/30 bg-purple-900/10 flex items-center justify-between">
                      <span className="text-sm text-purple-300 font-bold">What clue should be revealed?</span>
                      <select value={blindClueType} onChange={e => setBlindClueType(e.target.value as 'ability' | 'color')}
                        className="bg-slate-950 border border-purple-500/50 rounded px-3 py-1 text-purple-400 text-sm focus:outline-none">
                        <option value="ability">Pokemon Ability</option>
                        <option value="color">Pokemon Color</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Host a Game</label>
                {selectedMode !== 'auction' && selectedMode !== 'wildcard' && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">Cards per Round:</span>
                    <select value={optionsPerRound} onChange={e => setOptionsPerRound(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-white focus:outline-none">
                      <option value={3}>3 Cards</option>
                      <option value={4}>4 Cards</option>
                    </select>
                  </div>
                )}
                {gameState ? (
                  <button onClick={startDraft} disabled={!gameState.p2}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2">
                    <Play className="w-5 h-5" /> Start Draft
                  </button>
                ) : (
                  <button onClick={handleCreateRoom}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2">
                    <UserPlus className="w-5 h-5" /> Create Draft Room
                  </button>
                )}
              </div>
              {!gameState && (
                <>
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-800 absolute w-full" />
                    <span className="bg-slate-900 px-3 text-xs text-slate-500 relative font-bold uppercase">OR</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Join a Game</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Room Code" value={joinCode}
                        onChange={e => setJoinCode(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleJoinRoom(); }}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 uppercase font-mono" />
                      <button onClick={handleJoinRoom}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 rounded-xl transition-colors border border-slate-700">Join</button>
                    </div>
                    <p className="text-xs text-slate-600">Enter the code exactly as shown on the host screen</p>
                  </div>
                </>
              )}
            </div>

            {/* Advanced Filters Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <button onClick={() => setShowFilters(f => !f)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-300">Advanced Filters</span>
                  {activeFilterCount > 0 && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">{activeFilterCount} active</span>}
                  {pokemonList.length > 0 && <span className="text-xs text-slate-500">({filteredPool.length} Pokemon)</span>}
                </div>
                {showFilters ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showFilters && (
                <div className="px-6 pb-6 flex flex-col gap-5 border-t border-slate-800 pt-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Generations</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_GENS.map(g => (
                        <button key={g} onClick={() => setSelectedGens(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors border ${selectedGens.includes(g) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>Gen {g}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Types</label>
                      <select value={typeMatchMode} onChange={e => setTypeMatchMode(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white">
                        <option value="either">Either Type</option>
                        <option value="primary">Primary Only</option>
                        <option value="secondary">Secondary Only</option>
                        <option value="both">Both Types</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TYPES.map(t => (
                        <button key={t} onClick={() => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold capitalize transition-all border ${selectedTypes.includes(t) ? 'border-transparent text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                          style={selectedTypes.includes(t) ? { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : {}}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Forms</label>
                      <select value={formsMode} onChange={e => setFormsMode(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                        <option value="all">All Forms</option>
                        <option value="base_only">Base Only</option>
                        <option value="mega_only">Megas Only</option>
                        <option value="regional_only">Regionals Only</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Evolution</label>
                      <button onClick={() => setFullyEvolvedOnly(b => !b)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-colors ${fullyEvolvedOnly ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        <span className={`w-3 h-3 rounded-full border-2 ${fullyEvolvedOnly ? 'bg-indigo-400 border-indigo-400' : 'border-slate-600'}`} /> Fully Evolved
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">BST Cap</label>
                      <button onClick={() => setMaxBst600(b => !b)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-colors ${maxBst600 ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        <span className={`w-3 h-3 rounded-full border-2 ${maxBst600 ? 'bg-amber-400 border-amber-400' : 'border-slate-600'}`} /> Max 600 BST
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Exclude</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['Legendaries', excludeLegendary, setExcludeLegendary], ['Mythicals', excludeMythical, setExcludeMythical],
                        ['Paradox', excludeParadox, setExcludeParadox], ['Starters', excludeStarters, setExcludeStarters],
                        ['Ultra Beasts', excludeUltraBeast, setExcludeUltraBeast], ['Alolan Forms', excludeAlolan, setExcludeAlolan],
                        ['Galarian Forms', excludeGalarian, setExcludeGalarian], ['Hisuian Forms', excludeHisuian, setExcludeHisuian],
                        ['Paldean Forms', excludePaldean, setExcludePaldean],
                      ] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, set]) => (
                        <button key={label} onClick={() => set(v => !v)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-colors text-left ${val ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                          <span className={`w-3 h-3 rounded-sm border-2 shrink-0 flex items-center justify-center ${val ? 'bg-rose-500 border-rose-500' : 'border-slate-600'}`}>
                            {val && <span className="text-white text-[8px] font-black">X</span>}
                          </span> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2 text-center">Reset all filters</button>
                  )}
                </div>
              )}
            </div>
          </div>

        ) : gameState.status === 'LOBBY' ? (
          <div className="max-w-lg mx-auto mt-20 p-8 rounded-2xl text-center border border-slate-800 bg-slate-900/50">
            <h2 className="text-2xl font-black text-white mb-6">Waiting Room</h2>
            {(() => {
              const m = GAME_MODES.find(x => x.id === gameState.gameMode)!;
              return (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-4 ${m.borderColor} bg-slate-900`}>
                  <span className={m.color}>{m.icon}</span>
                  <span className={`text-sm font-bold ${m.color}`}>{m.label}</span>
                </div>
              );
            })()}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-6">
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mb-2">Room Code</p>
              <div className="text-4xl font-black font-mono tracking-widest text-indigo-400 mb-2 select-all cursor-pointer">{gameState.code}</div>
              <p className="text-xs text-slate-500">Share this code with your opponent</p>
            </div>
            <div className="flex justify-around items-center mb-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center text-xl font-bold text-indigo-300 mb-2">P1</div>
                <span className="font-bold">{gameState.p1.username}</span>
              </div>
              <span className="text-2xl font-black text-slate-700">VS</span>
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 border-2 ${gameState.p2 ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-800 border-dashed border-slate-700 text-slate-600'}`}>{gameState.p2 ? 'P2' : '?'}</div>
                <span className={`font-bold ${gameState.p2 ? 'text-white' : 'text-slate-600'}`}>{gameState.p2 ? gameState.p2.username : 'Waiting...'}</span>
              </div>
            </div>
            {isHost ? (
              <button onClick={startDraft} disabled={!gameState.p2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 text-lg">
                <Play className="w-5 h-5" /> Start Draft
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Waiting for host to start...
              </div>
            )}
          </div>
        ) : gameState.status === 'HEIST' ? (
          <HeistPhase gameState={gameState} isHost={isHost} myTeam={mySlot?.team ?? []} opponentTeam={opponentSlot?.team ?? []} myStealIdx={myHeistStealIdx} mySwapIdx={myHeistSwapIdx} setMyStealIdx={setMyHeistStealIdx} setMySwapIdx={setMyHeistSwapIdx} heistSubmitted={heistSubmitted} onSubmit={submitMyHeist} />
        ) : gameState.status === 'CHAOS_EVENT' ? (
          <ChaosEventPanel
            gameState={gameState}
            myPlayerNum={myPlayerNum}
            isHost={isHost}
            onChoice={(choice: any) => {
              if (isHostRef.current) {
                resolveChaosChoice(1, choice);
              } else {
                hostConnRef.current?.send({ type: 'chaos_choice', choice });
              }
            }}
          />
        ) : (
          <div className="flex flex-col gap-12">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white">
                {gameState.status === 'REVEAL' ? 'Final Teams!' : gameState.gameMode === 'auction' ? 'Live Auction' : gameState.gameMode === 'snake' ? 'Snake Draft' : `Round ${gameState.round} / ${gameState.totalRounds}`}
              </h2>
              {gameState.gameMode === 'blind' && gameState.status === 'DRAFTING' && <p className="text-purple-400 font-bold mt-1 text-sm">👁 BLIND MODE - Pick by abilities!</p>}
              {gameState.gameMode === 'monotype' && gameState.status === 'DRAFTING' && <p className="font-bold mt-1 text-sm" style={{ color: gameState.monotypeType ? TYPE_COLORS[gameState.monotypeType] : '#fb923c' }}>🔥 FORCED MONOTYPE: {gameState.monotypeType?.toUpperCase()}</p>}
              {gameState.gameMode === 'wildcard' && gameState.status === 'DRAFTING' && <p className="text-fuchsia-400 font-bold mt-1 text-sm animate-pulse">🃏 WILDCARD MODE: 1 of these is a trap!</p>}
              {gameState.gameMode !== 'auction' && gameState.gameMode !== 'snake' && gameState.status !== 'REVEAL' && <p className="text-slate-400 mt-2">Pick 1 to Keep, give 1 to your opponent!</p>}
              {gameState.status === 'REVEAL' && isHost && (
                <button onClick={returnToLobby} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">🔄 Play Again (Change Settings)</button>
              )}
              {gameState.status !== 'REVEAL' && isHost && (
                 <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                   <button onClick={returnToLobby} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-indigo-500/30">⬅️ Back to Lobby (Change Mode)</button>
                   <button onClick={restartDraft} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-rose-500/30">🔄 Reset Draft (Clear Teams)</button>
                 </div>
              )}
              {gameState.status === 'REVEAL' && !isHost && <p className="text-slate-500 text-sm mt-2">Waiting for host to restart...</p>}
            </div>
            
            {gameState.gameMode === 'auction' && gameState.status === 'DRAFTING' && (
              <div className="max-w-4xl mx-auto w-full mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* P1 Budget */}
                  <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center ${gameState.highestBidder === 1 ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-900/50'}`}>
                     <span className="text-xs uppercase font-bold text-slate-500">{gameState.p1.username}&apos;s Budget</span>
                     <span className="text-3xl font-black text-emerald-400">${gameState.p1Budget}</span>
                     {gameState.highestBidder === 1 && <span className="mt-2 text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-1 rounded">WINNING BID</span>}
                     {gameState.p1Passed && <span className="mt-2 text-xs font-black text-rose-400 bg-rose-500/20 px-2 py-1 rounded">PASSED / FULL</span>}
                  </div>
                  
                  {/* Center Action */}
                  <div className="p-6 rounded-2xl border border-indigo-500/30 bg-slate-900 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest">On The Block</h3>
                    {gameState.p1Options.length > 0 && (
                      <div className="flex flex-col items-center justify-center w-full relative">
                        <img src={gameState.p1Options[0].sprite} className="w-24 h-24 object-contain drop-shadow-lg" />
                        <span className="font-bold text-lg text-white capitalize mt-2">{gameState.p1Options[0].displayName}</span>
                        <div className="flex gap-1 mt-1 mb-4">
                          {gameState.p1Options[0].types.map(t => <span key={t} style={{ color: TYPE_COLORS[t] }} className="text-[10px] font-bold uppercase">{t}</span>)}
                        </div>
                        <div className="text-4xl font-black text-amber-400 mb-4">${gameState.currentBid}</div>
                        
                        {(myPlayerNum === 1 ? gameState.p1Passed : gameState.p2Passed) ? (
                          <div className="flex flex-col items-center text-rose-400 font-bold mb-4">
                            You passed on this item.
                          </div>
                        ) : (
                          <div className="flex flex-col w-full gap-2">
                             <div className="flex gap-2">
                               {gameState.highestBidder === null && (
                                 <button onClick={() => submitAuctionBid(0)} className="flex-1 bg-slate-700 hover:bg-slate-600 font-bold py-2 rounded text-white text-sm transition-colors">Bid $0</button>
                               )}
                               <button onClick={() => submitAuctionBid(gameState.currentBid + 1)} disabled={myPlayerNum === 1 ? gameState.p1Budget < gameState.currentBid + 1 : gameState.p2Budget < gameState.currentBid + 1} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold py-2 rounded text-white text-sm transition-colors">+ $1</button>
                               <button onClick={() => submitAuctionBid(gameState.currentBid + 5)} disabled={myPlayerNum === 1 ? gameState.p1Budget < gameState.currentBid + 5 : gameState.p2Budget < gameState.currentBid + 5} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold py-2 rounded text-white text-sm transition-colors">+ $5</button>
                               <button onClick={() => submitAuctionBid(gameState.currentBid + 10)} disabled={myPlayerNum === 1 ? gameState.p1Budget < gameState.currentBid + 10 : gameState.p2Budget < gameState.currentBid + 10} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold py-2 rounded text-white text-sm transition-colors">+ $10</button>
                             </div>
                             <div className="flex gap-2 mt-2">
                               <input type="number" placeholder="Custom Bid" value={auctionBidInput} onChange={e => setAuctionBidInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 px-3 rounded text-white" />
                               <button onClick={() => {
                                 const val = parseInt(auctionBidInput);
                                 if (val > gameState.currentBid) { submitAuctionBid(val); setAuctionBidInput(''); }
                               }} className="bg-indigo-600 px-4 py-2 rounded font-bold hover:bg-indigo-500 text-sm">Bid</button>
                             </div>
                             <button onClick={submitAuctionPass} className="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded text-sm transition-colors">Skip Pokémon</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* P2 Budget */}
                  <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center ${gameState.highestBidder === 2 ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-900/50'}`}>
                     <span className="text-xs uppercase font-bold text-slate-500">{gameState.p2?.username}&apos;s Budget</span>
                     <span className="text-3xl font-black text-emerald-400">${gameState.p2Budget}</span>
                     {gameState.highestBidder === 2 && <span className="mt-2 text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-1 rounded">WINNING BID</span>}
                     {gameState.p2Passed && <span className="mt-2 text-xs font-black text-rose-400 bg-rose-500/20 px-2 py-1 rounded">PASSED / FULL</span>}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="flex flex-col gap-4 order-2 lg:order-1">
                <h3 className="text-xl font-bold text-indigo-400 text-center">{gameState.p1.username}&apos;s Team</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => <TeamSlot key={i} data={gameState.p1.team[i]} index={i} playerNum={1} />)}
                </div>
              </div>

              <div className="flex flex-col gap-6 order-1 lg:order-2">
                {gameState.gameMode === 'snake' && gameState.status === 'DRAFTING' ? (
                  <div className="p-6 rounded-2xl border border-emerald-500/30 bg-slate-900/50 flex flex-col">
                     <h3 className={`text-center font-black mb-6 uppercase tracking-widest text-lg ${gameState.snakeTurn === myPlayerNum ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                       {gameState.snakeTurn === myPlayerNum ? "Your Turn to Pick!" : "Opponent's Turn..."}
                     </h3>
                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
                        {gameState.p1Options.map(pk => (
                          <button key={pk.id} 
                            disabled={gameState.snakeTurn !== myPlayerNum}
                            onClick={() => submitSnakePick(pk.id)}
                            className={`relative p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              gameState.snakeTurn === myPlayerNum ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-emerald-400 cursor-pointer' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'
                            }`}>
                            <img src={pk.sprite} className="w-12 h-12 object-contain" />
                            <span className="text-[10px] font-bold text-white capitalize mt-1 text-center leading-tight truncate w-full px-1">{pk.displayName}</span>
                          </button>
                        ))}
                     </div>
                  </div>
                ) : gameState.gameMode !== 'auction' && gameState.status === 'DRAFTING' ? (
                  <div className="p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/50 flex flex-col">
                    {submitted || mySlot?.ready ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p className="font-bold">Waiting for opponent...</p>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-center font-bold text-slate-300 mb-6 uppercase tracking-widest text-sm">Your Choices</h3>
                        <div className="flex flex-col gap-3 mb-6">
                          {(myOptions ?? []).map(pk => {
                            const isKeep = keepChoice === pk.id;
                            const isGive = giveChoice === pk.id;
                            const isBlind = gameState.gameMode === 'blind';
                            return (
                              <div key={pk.id} className={`relative p-3 rounded-xl border flex items-center justify-between transition-all overflow-hidden ${
                                isKeep ? 'bg-indigo-500/20 border-indigo-500' : isGive ? 'bg-rose-500/20 border-rose-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                              }`}>
                                {isBlind && <BlindClueHint id={pk.id} speciesId={pk.speciesId} clueType={gameState.blindClueType} />}
                                <div className="flex items-center gap-3 relative z-30">
                                  <img src={pk.sprite} alt={pk.name} className={`w-12 h-12 object-contain ${isBlind ? 'opacity-0' : ''}`} />
                                  <div className={isBlind ? 'opacity-0' : ''}>
                                    <p className="font-bold text-sm text-white capitalize">{pk.displayName}</p>
                                    <div className="flex gap-1 mt-1">
                                      {pk.types.map(t => <span key={t} style={{ color: TYPE_COLORS[t] }} className="text-[10px] font-bold uppercase">{t}</span>)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 relative z-30">
                                  <button onClick={() => { playHoverTick(); setKeepChoice(pk.id); if (giveChoice === pk.id) setGiveChoice(null); }}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors shadow-lg ${isKeep ? 'bg-indigo-500 text-white shadow-indigo-500/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-700 shadow-black/50'}`}>Keep</button>
                                  <button onClick={() => { playHoverTick(); setGiveChoice(pk.id); if (keepChoice === pk.id) setKeepChoice(null); }}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors shadow-lg ${isGive ? 'bg-rose-500 text-white shadow-rose-500/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-700 shadow-black/50'}`}>Give</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={submitMyChoices} disabled={keepChoice === null || giveChoice === null}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-colors">
                          Confirm Selection
                        </button>
                      </>
                    )}
                  </div>
                ) : gameState.status === 'REVEAL' ? (
                  <div className="p-6 rounded-2xl border border-emerald-500/30 flex flex-col items-center justify-center text-center gap-6 bg-slate-900/50">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                      <Check className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">Draft Complete!</h3>
                      <p className="text-slate-400">Both players have built their teams.</p>
                    </div>
                    {isHost ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={revealCards} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                          Reveal All Cards
                        </button>
                        <button onClick={restartDraft} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                          🔄 Restart Draft
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Waiting for host to reveal...</p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 order-3">
                <h3 className="text-xl font-bold text-rose-400 text-center">{gameState.p2?.username ?? 'Opponent'}&apos;s Team</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => <TeamSlot key={i} data={gameState.p2?.team[i]} index={i} playerNum={2} />)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeistPhase({ gameState, isHost, myTeam, opponentTeam, myStealIdx, mySwapIdx, setMyStealIdx, setMySwapIdx, heistSubmitted, onSubmit }: any) {
  const myOpponentReady = isHost ? gameState.p2HeistChoice !== null : gameState.p1HeistChoice !== null;
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center relative">
        <div className="absolute inset-0 rounded-3xl blur-2xl bg-amber-500/10 pointer-events-none" />
        <div className="relative">
          <p className="text-6xl mb-2">💣</p>
          <h2 className="text-4xl font-black text-amber-400 tracking-tight">THE HEIST</h2>
          <p className="text-slate-400 mt-2 text-lg">Steal 1 Pokémon from your opponent&apos;s team and swap it with one of yours!</p>
          <div className="mt-3 flex justify-center gap-3">
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold uppercase">Step 1: Pick to steal from opponent</span>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-bold uppercase">Step 2: Pick which of yours to give up</span>
          </div>
        </div>
      </div>
      {heistSubmitted ? (
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-amber-500/30 bg-slate-900/50">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-amber-300 font-bold text-lg">Heist locked in! Waiting for opponent...</p>
          {myOpponentReady && <p className="text-emerald-400 text-sm font-bold">Opponent is ready! Resolving heist...</p>}
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="font-black text-amber-400 text-lg flex items-center gap-2">
              <Sword className="w-5 h-5" /> Steal from {isHost ? gameState.p2?.username : gameState.p1.username}&apos;s Team
            </h3>
            <p className="text-xs text-slate-500">Click a card to mark it for stealing</p>
            <div className="grid grid-cols-3 gap-2">
              {opponentTeam.map((member: any, i: number) => (
                <button key={i} onClick={() => { playHoverTick(); setMyStealIdx(myStealIdx === i ? null : i); }}
                  className={`aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all ${myStealIdx === i ? 'border-amber-400 bg-amber-500/20 scale-95' : 'border-slate-700 bg-slate-900 hover:border-amber-600 hover:bg-amber-500/10'}`}>
                  <img src={member.actualPk.sprite} alt={member.actualPk.name} className="w-12 h-12 object-contain" />
                  <p className="text-[9px] font-bold text-slate-300 capitalize mt-1 text-center leading-tight">{member.actualPk.displayName}</p>
                  {myStealIdx === i && <span className="text-[8px] text-amber-400 font-black mt-0.5">STEAL!</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-black text-rose-400 text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" /> Give up from Your Team
            </h3>
            <p className="text-xs text-slate-500">Click a card to offer it in exchange</p>
            <div className="grid grid-cols-3 gap-2">
              {myTeam.map((member: any, i: number) => (
                <button key={i} onClick={() => { playHoverTick(); setMySwapIdx(mySwapIdx === i ? null : i); }}
                  className={`aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all ${mySwapIdx === i ? 'border-rose-400 bg-rose-500/20 scale-95' : 'border-slate-700 bg-slate-900 hover:border-rose-600 hover:bg-rose-500/10'}`}>
                  <img src={member.actualPk.sprite} alt={member.actualPk.name} className="w-12 h-12 object-contain" />
                  <p className="text-[9px] font-bold text-slate-300 capitalize mt-1 text-center leading-tight">{member.actualPk.displayName}</p>
                  {mySwapIdx === i && <span className="text-[8px] text-rose-400 font-black mt-0.5">GIVE</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {!heistSubmitted && (
        <button onClick={onSubmit} disabled={myStealIdx === null || mySwapIdx === null}
          className="px-12 py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all disabled:bg-slate-800 disabled:text-slate-600 bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30">
          🦹 Execute Heist!
        </button>
      )}
    </div>
  );
}

function TeamSlot({ data, index, playerNum }: { data?: DraftTeamMember, index: number, playerNum: 1 | 2 }) {
  const [isFlipped, setIsFlipped] = useState(!data?.isMystery);

  useEffect(() => {
    if (data && !data.isMystery && !isFlipped) {
      const delay = (index * 800) + (playerNum === 2 ? 400 : 0);
      const t = setTimeout(() => {
        setIsFlipped(true);
        playPokemonCry(data.actualPk.id);
      }, delay);
      return () => clearTimeout(t);
    } else if (data?.isMystery) {
      setIsFlipped(false);
    }
  }, [data, isFlipped, index, playerNum]);

  if (!data) {
    return (
      <div className="aspect-square bg-slate-900/50 border-2 border-slate-800 border-dashed rounded-2xl flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-800/80" />
      </div>
    );
  }

  const pk = data.actualPk;
  
  return (
    <div className="aspect-square w-full h-full relative" style={{ perspective: '1000px' }}>
      <div 
        className="w-full h-full relative rounded-2xl transition-transform duration-700"
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* FRONT: MYSTERY */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center overflow-hidden"
             style={{ backfaceVisibility: 'hidden' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <HelpCircle className="w-12 h-12 text-slate-600 mb-2 relative z-10 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">Mystery</span>
          {data.fromOpponent && <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase z-10">Given</span>}
        </div>

        {/* BACK: POKEMON */}
        <div className="absolute inset-0 w-full h-full bg-slate-900/80 border border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-between overflow-hidden"
             style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {data.fromOpponent && <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase z-10">Given</span>}
          {data.cost !== undefined && <span className="absolute top-2 left-2 text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black z-10">${data.cost}</span>}
          <img src={pk.sprite} alt={pk.name} className="w-16 h-16 object-contain z-10 drop-shadow-md" />
          <div className="text-center z-10">
            <p className="font-bold text-xs text-white capitalize">{pk.displayName}</p>
            <div className="flex gap-1 justify-center mt-1">
              {pk.types.map(t => <div key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="w-2 h-2 rounded-full" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
