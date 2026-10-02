'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePokemon } from '@/context/PokemonContext';
import { usePlayerProfile } from '@/context/PlayerProfileContext';
import { PokemonIndexItem, GameMode, ChaosEventId, DraftTeamMember, PlayerSlot, DraftState } from '@/lib/pokemon/types';
import { FilterCriteria, filterPokemon } from '@/lib/pokemon/data';
import { TYPE_COLORS } from '@/lib/pokemon/constants';
import { Users, UserPlus, Check, HelpCircle, Loader2, Play, SlidersHorizontal, ChevronDown, ChevronUp, Eye, Sword, Shield, Skull, Gavel, Infinity as InfinityIcon, Wand2, Zap, Volume2, VolumeX, ClipboardCopy, Timer, Crown, Coins } from 'lucide-react';
import { playHoverTick, playSelectClick, playLockIn, playRevealChime, playPokemonCry, playHeistAlarm, playStealSound, startAmbientMusic, stopAmbientMusic, playThud, playSwish, playSlash, playLegendary } from '@/lib/audio';
import { CHAOS_EVENTS, getRandomFullyEvolved, getRandomLegendary, getRandomFossil } from '@/lib/pokemon/chaos';
import Link from 'next/link';
import HoloCard from '@/components/HoloCard';
import { motion, AnimatePresence } from 'framer-motion';
import { generateShowdownExport } from '@/lib/showdown';

const ALL_TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
const ALL_GENS = [1,2,3,4,5,6,7,8,9];

const GAME_MODES: { id: GameMode; icon: React.ReactNode; label: string; description: string; color: string; borderColor: string }[] = [
  { id: 'standard', icon: <Shield className="w-6 h-6" />, label: 'Standard Draft', description: 'Classic 3-round draft. Pick to keep, give to opponent.', color: 'text-indigo-400', borderColor: 'border-indigo-500' },
  { id: 'wildcard', icon: <HelpCircle className="w-6 h-6" />, label: '🃏 Wildcard Draft', description: '3 cards per round. 1 is guaranteed to be a trap! Picking it gives a random fully evolved Pokémon.', color: 'text-fuchsia-400', borderColor: 'border-fuchsia-500' },
  { id: 'chaos', icon: <Wand2 className="w-6 h-6" />, label: '🌪 Chaos Draft', description: 'Standard 3-round draft, but Round 3 has a 100% chance to trigger a massive, game-changing random event!', color: 'text-fuchsia-400', borderColor: 'border-fuchsia-500' },
  { id: 'snake', icon: <InfinityIcon className="w-6 h-6" />, label: '🐍 Snake Draft', description: 'A shared pool of 18 Pokémon. Take turns picking one at a time!', color: 'text-emerald-400', borderColor: 'border-emerald-500' },
  { id: 'monotype', icon: <Sword className="w-6 h-6" />, label: '🔥 Forced Monotype', description: 'A random type is chosen. The entire draft pool is restricted to it!', color: 'text-orange-400', borderColor: 'border-orange-500' },
  { id: 'blind', icon: <Eye className="w-6 h-6" />, label: '🎭 Blind Draft', description: 'Build your team knowing ONLY the color and abilities of the Pokemon!', color: 'text-purple-400', borderColor: 'border-purple-500' },
  { id: 'shadow', icon: <Eye className="w-6 h-6" />, label: '🌑 Shadow Protocol', description: 'Pokémon are hidden! Use obscure cues like weight, height, or habitat to draft.', color: 'text-slate-400', borderColor: 'border-slate-500' },
  { id: 'heist', icon: <Skull className="w-6 h-6" />, label: '💣 The Heist', description: '3 normal rounds, then steal 1 Pokémon from your opponent!', color: 'text-amber-400', borderColor: 'border-amber-500' },
  { id: 'auction', icon: <Gavel className="w-6 h-6" />, label: '💰 Simple Auction', description: 'Start with $100. Live bid against your opponent!', color: 'text-emerald-400', borderColor: 'border-emerald-500' },
  { id: 'speedrun', icon: <Timer className="w-6 h-6" />, label: '⏱️ Speedrun', description: '7 seconds per pick. If time runs out, the worst Pokémon is auto-picked!', color: 'text-red-400', borderColor: 'border-red-500' },
  { id: 'vip', icon: <Crown className="w-6 h-6" />, label: '👑 Protect the King', description: 'Round 1 is your VIP. All other picks must share a type with it!', color: 'text-yellow-400', borderColor: 'border-yellow-500' },
  { id: 'salary_cap', icon: <Coins className="w-6 h-6" />, label: '🏛️ Salary Cap (Nomination)', description: 'Take turns nominating Pokémon for bidding. Don\'t run out of money!', color: 'text-green-400', borderColor: 'border-green-500' },
  { id: 'nuzlocke', icon: <Skull className="w-6 h-6" />, label: '☠️ Nuzlocke Draft', description: 'Draft a team of 6, then each player assassinates 1 opponent Pokémon! Guess their target to save it.', color: 'text-rose-400', borderColor: 'border-rose-500' }
];

function ShadowClueHint({ id, speciesId }: { id: number, speciesId: number }) {
  const [clue, setClue] = useState<string>('Loading...');
  const [clueLabel, setClueLabel] = useState<string>('Analyzing...');

  useEffect(() => {
    const types = ['weight', 'height', 'shape', 'habitat'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    
    if (['shape', 'habitat'].includes(chosenType)) {
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`)
        .then(r => r.json())
        .then(d => {
          if (chosenType === 'shape') { setClueLabel('Shape'); setClue(d.shape?.name || 'Unknown'); }
          if (chosenType === 'habitat') { setClueLabel('Habitat'); setClue(d.habitat?.name || 'Unknown'); }
        })
        .catch(() => { setClueLabel('Error'); setClue('???'); });
    } else {
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`)
        .then(r => r.json())
        .then(d => {
          if (chosenType === 'weight') { setClueLabel('Weight'); setClue(`${d.weight / 10} kg`); }
          if (chosenType === 'height') { setClueLabel('Height'); setClue(`${d.height / 10} m`); }
        })
        .catch(() => { setClueLabel('Error'); setClue('???'); });
    }
  }, [id, speciesId]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-[#0b0e16] border border-slate-500/30 rounded-xl z-20 shadow-[inset_0_0_20px_rgba(100,116,139,0.15)]">
      <Eye className="w-8 h-8 text-slate-500 mb-2 opacity-50" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{clueLabel}</span>
      <span className="text-base font-black text-slate-400 text-center capitalize leading-tight mt-1">{clue}</span>
    </div>
  );
}

function BlindClueHint({ id, speciesId }: { id: number, speciesId: number }) {
  const [clue, setClue] = useState<string>('Loading...');
  const [clueLabel, setClueLabel] = useState<string>('Analyzing...');

  useEffect(() => {
    const chosenType = Math.random() > 0.5 ? 'color' : 'ability';
    if (chosenType === 'color') {
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`)
        .then(r => r.json())
        .then(d => {
          setClueLabel('Color');
          setClue(d.color?.name || 'Unknown');
        })
        .catch(() => { setClueLabel('Error'); setClue('???'); });
    } else {
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`)
        .then(r => r.json())
        .then(d => {
          setClueLabel('Ability');
          setClue(d.abilities[0]?.ability?.name?.replace(/-/g, ' ') || 'Unknown');
        })
        .catch(() => { setClueLabel('Error'); setClue('???'); });
    }
  }, [id, speciesId]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-[#0b0e16] border border-purple-500/30 rounded-xl z-20 shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]">
      <Eye className="w-8 h-8 text-purple-500 mb-2 opacity-50" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{clueLabel}</span>
      <span className="text-base font-black text-purple-400 text-center capitalize leading-tight mt-1">{clue}</span>
    </div>
  );
}

function MonotypeRoulettePanel({ gameState, isHost, onComplete }: { gameState: DraftState, isHost: boolean, onComplete: () => void }) {
  const [currentTypeP1, setCurrentTypeP1] = useState<string>(ALL_TYPES[0]);
  const [currentTypeP2, setCurrentTypeP2] = useState<string>(ALL_TYPES[1]);
  const [isDone, setIsDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    let tick = 0;
    const maxTicks = 40;
    const interval = setInterval(() => {
      tick++;
      setCurrentTypeP1(ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]);
      setCurrentTypeP2(ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]);
      if (tick >= maxTicks) {
        clearInterval(interval);
        setCurrentTypeP1(gameState.monotypeP1 || 'normal');
        setCurrentTypeP2(gameState.monotypeP2 || 'normal');
        setIsDone(true);
        if (isHost) {
          setTimeout(() => onCompleteRef.current(), 3000);
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [gameState.monotypeP1, gameState.monotypeP2, isHost]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-3xl font-black text-white mb-8">Rolling Monotypes...</h2>
      <div className="flex gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-slate-400 font-bold">{gameState.p1.username}&apos;s Type</span>
          <motion.div 
            key={currentTypeP1}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: isDone ? 1.2 : 1, opacity: 1 }}
            className="w-40 h-40 rounded-2xl flex flex-col items-center justify-center border-4"
            style={{ 
              backgroundColor: `${TYPE_COLORS[currentTypeP1]}20`,
              borderColor: TYPE_COLORS[currentTypeP1],
              boxShadow: isDone ? `0 0 40px ${TYPE_COLORS[currentTypeP1]}` : 'none'
            }}
          >
            <span className="text-3xl font-black uppercase tracking-widest" style={{ color: TYPE_COLORS[currentTypeP1] }}>
              {currentTypeP1}
            </span>
          </motion.div>
        </div>
        {gameState.p2 && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-slate-400 font-bold">{gameState.p2.username}&apos;s Type</span>
            <motion.div 
              key={currentTypeP2}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: isDone ? 1.2 : 1, opacity: 1 }}
              className="w-40 h-40 rounded-2xl flex flex-col items-center justify-center border-4"
              style={{ 
                backgroundColor: `${TYPE_COLORS[currentTypeP2]}20`,
                borderColor: TYPE_COLORS[currentTypeP2],
                boxShadow: isDone ? `0 0 40px ${TYPE_COLORS[currentTypeP2]}` : 'none'
              }}
            >
              <span className="text-3xl font-black uppercase tracking-widest" style={{ color: TYPE_COLORS[currentTypeP2] }}>
                {currentTypeP2}
              </span>
            </motion.div>
          </div>
        )}
      </div>
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

            {!['fossil', 'wonder', 'gamble'].includes(cs.eventId) && (
              <div className="flex flex-col items-center gap-4 w-full mt-4">
                <button onClick={() => handleSubmit('continue')} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 rounded-xl text-lg">
                  Continue
                </button>
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
  const { addXp, unlockAchievement, unlockedAchievements } = usePlayerProfile();
  
  const [username, setUsername] = useState('Trainer');
  const [joinCode, setJoinCode] = useState('');
  const [optionsPerRound, setOptionsPerRound] = useState(3);
  const [selectedMode, setSelectedMode] = useState<GameMode>('standard');
  const [musicOn, setMusicOn] = useState(false);
  const [criesOn, setCriesOn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mutePokemonCries') !== 'true';
    }
    return true;
  });

  const toggleCries = () => {
    const newVal = !criesOn;
    setCriesOn(newVal);
    localStorage.setItem('mutePokemonCries', (!newVal).toString());
  };
  
  // Track XP awarded for current draft session
  const [draftRewardGivenForId, setDraftRewardGivenForId] = useState<string | null>(null);

  useEffect(() => {
    if (musicOn) {
      startAmbientMusic();
    } else {
      stopAmbientMusic();
    }
    return () => stopAmbientMusic();
  }, [musicOn]);

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
  const [vsScreenPlaying, setVsScreenPlaying] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
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

  // XP & Achievement Logic
  useEffect(() => {
    if (gameState?.status === 'REVEAL' && gameState.code !== draftRewardGivenForId) {
      setDraftRewardGivenForId(gameState.code);
      
      // Award base XP
      addXp(100, 'Draft Completed');
      
      // Achievements
      unlockAchievement('first_draft');
      
      if (gameState.gameMode === 'nuzlocke') {
        addXp(50, 'Nuzlocke Assassin');
      }
      if (gameState.gameMode === 'heist') {
        unlockAchievement('heist_master');
      }
      if (gameState.gameMode === 'monotype') {
        unlockAchievement('monotype_expert');
      }
      
      // Check Legendary Team
      const myPlayerNumEffect = isHostRef.current ? 1 : 2;
      const myTeam = myPlayerNumEffect === 1 ? gameState.p1.team : (gameState.p2?.team || []);
      const hasLegendary = myTeam.some(m => m.actualPk.isLegendary || m.actualPk.isMythical || m.actualPk.isUltraBeast);
      if (hasLegendary) {
        unlockAchievement('legendary_hunter');
      }
    } else if (gameState?.status !== 'REVEAL' && draftRewardGivenForId !== null) {
      setDraftRewardGivenForId(null);
    }
  }, [gameState?.status, gameState?.code, draftRewardGivenForId, gameState?.gameMode, gameState?.p1, gameState?.p2, addXp, unlockAchievement]);

  const [myNuzlockeTargetIdx, setMyNuzlockeTargetIdx] = useState<number | null>(null);
  const [myNuzlockeProtectIdx, setMyNuzlockeProtectIdx] = useState<number | null>(null);
  const [nuzlockeSubmitted, setNuzlockeSubmitted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const p1HeistRef = useRef<{ stealIdx: number; swapIdx: number } | null>(null);
  const p2HeistRef = useRef<{ stealIdx: number; swapIdx: number } | null>(null);

  // Auction Local State
  const [auctionBidInput, setAuctionBidInput] = useState<string>('');

  useEffect(() => {
    if (gameState?.status === 'DRAFTING' && gameState.round === 1 && prevStatusRef.current === 'LOBBY') {
      setVsScreenPlaying(true);
      setTimeout(() => setVsScreenPlaying(false), 3000);
    }
    prevStatusRef.current = gameState?.status ?? null;
  }, [gameState?.status, gameState?.round]);

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
    const basePool = filterPokemon(list, state.filters);
    const pickUnique = (count: number, poolToUse: PokemonIndexItem[]): PokemonIndexItem[] => {
      const shuffled = [...poolToUse].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length)).map(p => ({ ...p }));
      if (state.gameMode === 'wildcard' && selected.length > 0) {
        const trapIndex = Math.floor(Math.random() * selected.length);
        selected[trapIndex].isTrap = true;
      }
      return selected;
    };

    let p1Pool = basePool;
    let p2Pool = basePool;
    if (state.gameMode === 'monotype' && state.monotypeP1 && state.monotypeP2) {
      p1Pool = basePool.filter(p => p.types.includes(state.monotypeP1!));
      p2Pool = basePool.filter(p => p.types.includes(state.monotypeP2!));
      if (p1Pool.length === 0) p1Pool = basePool;
      if (p2Pool.length === 0) p2Pool = basePool;
    }
    
    if (state.gameMode === 'vip' && state.round > 1) {
      if (state.p1.team.length > 0) {
        const p1Type = state.p1.team[0].actualPk.types[0];
        p1Pool = basePool.filter(p => p.types.includes(p1Type));
        if (p1Pool.length === 0) p1Pool = basePool; // fallback
      }
      if (state.p2?.team && state.p2.team.length > 0) {
        const p2Type = state.p2.team[0].actualPk.types[0];
        p2Pool = basePool.filter(p => p.types.includes(p2Type));
        if (p2Pool.length === 0) p2Pool = basePool; // fallback
      }
    }

    if (state.gameMode === 'auction' || state.gameMode === 'salary_cap') {
      state.p2Options = [];
      state.currentBid = 0;
      state.highestBidder = null;
      state.p1Passed = state.p1.team.length >= 6;
      state.p2Passed = state.p2 ? state.p2.team.length >= 6 : false;
      
      if (state.gameMode === 'salary_cap') {
        state.p1Options = pickUnique(6, basePool); // options to nominate
        state.salaryPhase = 'NOMINATING';
        state.salaryNominationTurn = state.salaryNominationTurn === 1 ? 2 : 1;
        if (state.salaryNominationTurn === 1 && state.p1Passed) state.salaryNominationTurn = 2;
        if (state.salaryNominationTurn === 2 && state.p2Passed) state.salaryNominationTurn = 1;
      } else {
        state.p1Options = pickUnique(1, basePool);
      }
    } else if (state.gameMode === 'snake') {
      if (state.round === 1) { // Only generate once for snake
        state.p1Options = pickUnique(18, basePool); 
        state.p2Options = [];
      }
    } else {
      state.p1Options = pickUnique(state.optionsPerRound, p1Pool);
      state.p2Options = pickUnique(state.optionsPerRound, p2Pool);
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

  const getRandomWeakFullyEvolved = useCallback((list: PokemonIndexItem[]) => {
    const fe = list.filter(p => p.isFullyEvolved && p.id < 10000 && !p.isMega && p.stats.total <= 480);
    return fe[Math.floor(Math.random() * fe.length)] || list[0];
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
    const pkIndex = next.p1Options.findIndex(p => Number(p.id) === Number(pkId));
    if (pkIndex === -1) return;
    
    const originalPk = next.p1Options[pkIndex];
    const pk = getActualPk(originalPk, pokemonList);
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
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: { resolved: true } };
      state.status = 'CHAOS_EVENT';
    } else if (eventId === 'safari') {
      // Next round ignores filters — generate from full pool
      const fullPool = pokemonList.filter(p => p.id < 10000 && !p.isMega);
      const shuffled = [...fullPool].sort(() => Math.random() - 0.5);
      state.p1Options = shuffled.slice(0, state.optionsPerRound).map(p => ({ ...p }));
      state.p2Options = shuffled.slice(state.optionsPerRound, state.optionsPerRound * 2).map(p => ({ ...p }));
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: { resolved: true, generated: true } };
      state.status = 'CHAOS_EVENT';
    } else if (eventId === 'ditto') {
      const ditto = pokemonList.find(p => p.id === 132);
      if (ditto) {
        state.p1Options = Array(state.optionsPerRound).fill(null).map(() => ({ ...ditto }));
        state.p2Options = Array(state.optionsPerRound).fill(null).map(() => ({ ...ditto }));
      }
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: { resolved: true, generated: true } };
      state.status = 'CHAOS_EVENT';
    } else if (eventId === 'celebi') {
      const tmp = state.p1.team;
      state.p1.team = state.p2!.team.map(m => ({ ...m }));
      state.p2!.team = tmp.map(m => ({ ...m }));
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: { resolved: true } };
      state.status = 'CHAOS_EVENT';
    } else if (eventId === 'yveltal') {
      const getBest = (team: DraftTeamMember[]) => team.length ? team.reduce((a, b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, team[0]) : null;
      const b1 = getBest(p1Team); const b2 = getBest(p2Team);
      if (b1) { const i = p1Team.indexOf(b1); state.p1.team[i] = { ...b1, actualPk: getRandomFullyEvolved(pokemonList) }; }
      if (b2) { const i = p2Team.indexOf(b2); state.p2!.team[i] = { ...b2, actualPk: getRandomFullyEvolved(pokemonList) }; }
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: { resolved: true } };
      state.status = 'CHAOS_EVENT';
    } else if (eventId === 'gym') {
      const randomType = ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
      const typePool = pokemonList.filter(p => p.types.includes(randomType) && p.id < 10000 && !p.isMega);
      const shuffled = [...typePool].sort(() => Math.random() - 0.5);
      state.p1Options = shuffled.slice(0, state.optionsPerRound).map(p => ({ ...p }));
      state.p2Options = shuffled.slice(state.optionsPerRound, state.optionsPerRound * 2).map(p => ({ ...p }));
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: { lockedType: randomType, resolved: true, generated: true } };
      state.status = 'CHAOS_EVENT';
    } else if (eventId === 'glitch') {
      const getBest = (team: DraftTeamMember[]) => team.length ? { m: team.reduce((a, b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, team[0]), i: 0 } : null;
      if (p1Team.length) { const idx = p1Team.indexOf(p1Team.reduce((a,b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, p1Team[0])); state.p1.team[idx] = { ...p1Team[idx], actualPk: getRandomLegendary(pokemonList) }; }
      if (p2Team.length) { const idx = p2Team.indexOf(p2Team.reduce((a,b) => b.actualPk.stats.total > a.actualPk.stats.total ? b : a, p2Team[0])); state.p2!.team[idx] = { ...p2Team[idx], actualPk: getRandomLegendary(pokemonList) }; }
      state.chaosState = { eventId, p1Resolved: false, p2Resolved: false, data: { resolved: true } };
      state.status = 'CHAOS_EVENT';
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
      // Only generate options if the event didn't already generate them (like safari, ditto, gym)
      if (!cs.data?.generated) {
        generateOptions(next, pokemonList);
      }
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
    
    const p1k = getActualPk(p1Keep, pokemonList);
    const p2k = getActualPk(p2Keep, pokemonList);
    const p1g = p1Give ? getActualPk(p1Give, pokemonList) : null;
    const p2g = p2Give ? getActualPk(p2Give, pokemonList) : null;

    state.p1.team.push({ isMystery: isBlind || state.gameMode === 'shadow', actualPk: p1k, fromOpponent: false });
    state.p2!.team.push({ isMystery: isBlind || state.gameMode === 'shadow', actualPk: p2k, fromOpponent: false });
    
    if (state.gameMode !== 'vip') {
      if (p2g) state.p1.team.push({ isMystery: true,  actualPk: p2g, fromOpponent: true  });
      if (p1g) state.p2!.team.push({ isMystery: true,  actualPk: p1g, fromOpponent: true  });
    }

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
      } else if (state.gameMode === 'nuzlocke') {
        state.status = 'NUZLOCKE';
        state.nuzlockeP1Target = null;
        state.nuzlockeP1Protect = null;
        state.nuzlockeP2Target = null;
        state.nuzlockeP2Protect = null;
      } else {
        state.status = 'REVEAL';
      }
    } else {
      if (state.gameMode === 'chaos' && state.round === state.totalRounds) {
        // Trigger chaos event instead of generating normal round options for the final round
        triggerChaosEvent(state);
      } else {
        generateOptions(state, pokemonList);
      }
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

  const resolveNuzlocke = useCallback((state: DraftState) => {
    // Both submitted
    let someoneDied = false;
    if (state.nuzlockeP1Target !== state.nuzlockeP2Protect) {
      if (state.nuzlockeP1Target !== null && state.nuzlockeP1Target !== undefined && state.p2!.team[state.nuzlockeP1Target]) {
        state.p2!.team[state.nuzlockeP1Target] = { 
          ...state.p2!.team[state.nuzlockeP1Target], 
          actualPk: getRandomWeakFullyEvolved(pokemonList),
          isDead: false,
          wasAssassinated: true
        };
        someoneDied = true;
      }
    }
    // P2 target kills P1's pokemon UNLESS P1 protected it
    if (state.nuzlockeP2Target !== state.nuzlockeP1Protect) {
      if (state.nuzlockeP2Target !== null && state.nuzlockeP2Target !== undefined && state.p1.team[state.nuzlockeP2Target]) {
        state.p1.team[state.nuzlockeP2Target] = { 
          ...state.p1.team[state.nuzlockeP2Target], 
          actualPk: getRandomWeakFullyEvolved(pokemonList),
          isDead: false,
          wasAssassinated: true
        };
        someoneDied = true;
      }
    }
    if (someoneDied) setTimeout(playSlash, 500);
    
    state.nuzlockeP1Target = null;
    state.nuzlockeP1Protect = null;
    state.nuzlockeP2Target = null;
    state.nuzlockeP2Protect = null;
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
    if (data.type === 'submit_nuzlocke') {
      const next: DraftState = JSON.parse(JSON.stringify(cur));
      if (data.playerNum === 1) {
        next.nuzlockeP1Target = data.targetIdx;
        next.nuzlockeP1Protect = data.protectIdx;
      } else {
        next.nuzlockeP2Target = data.targetIdx;
        next.nuzlockeP2Protect = data.protectIdx;
      }
      
      const p1Ready = next.nuzlockeP1Target !== null && next.nuzlockeP1Target !== undefined;
      const p2Ready = next.nuzlockeP2Target !== null && next.nuzlockeP2Target !== undefined;

      if (p1Ready && p2Ready) {
        resolveNuzlocke(next);
      } else {
        applyState(next); broadcastToGuest(next);
      }
    }
    if (data.type === 'chaos_choice') {
      resolveChaosChoice(2, data.choice);
    }
    if (data.type === 'nominate_salary_cap') {
      const next: DraftState = JSON.parse(JSON.stringify(cur));
      const pk = next.p1Options.find((p: any) => p.id === data.pkId);
      if (pk) {
        next.p1Options = [pk];
        next.salaryPhase = 'BIDDING';
        applyState(next); broadcastToGuest(next);
      }
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
          conn.on('data', (d: any) => {
            if (d.type === 'ping') return;
            handleHostReceiveData(d);
          });
          conn.on('error', (err: any) => console.error('Host conn error:', err));
          conn.on('close', () => {
            console.error('Guest disconnected.');
            // Only alert if we are not already done
            if (gameStateRef.current && gameStateRef.current.status !== 'LOBBY' && gameStateRef.current.status !== 'REVEAL') {
              alert('Guest disconnected. The game cannot continue.');
              window.location.reload();
            }
          });
          
          // Send periodic keepalive ping to prevent WebRTC timeout
          const pingInterval = setInterval(() => {
            if (conn && conn.open) {
              conn.send({ type: 'ping' });
            } else {
              clearInterval(pingInterval);
            }
          }, 3000);
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
      const isVip = selectedMode === 'vip';
      const totalRounds = isVip ? 6 : 3; 
      const initial: DraftState = {
        code, status: 'LOBBY', gameMode: selectedMode,
        optionsPerRound: selectedMode === 'wildcard' || isVip ? 3 : optionsPerRound, round: 1, totalRounds, filters,
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
        if (data.type === 'ping') { conn.send({ type: 'ping' }); return; }
        if (data.type === 'sync_state') { applyState(data.state); setSubmitted(false); }
      });
      conn.on('error', (err: any) => {
        clearTimeout(timeout);
        console.error('Guest conn error:', err);
        alert('Connection error: ' + (err.message || String(err)));
      });
      conn.on('close', () => {
        console.error('Host disconnected.');
        if (gameStateRef.current && gameStateRef.current.status !== 'LOBBY' && gameStateRef.current.status !== 'REVEAL') {
          alert('Host disconnected. The game cannot continue.');
          window.location.reload();
        }
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
    const initialStatus = selectedMode === 'monotype' ? 'MONOTYPE_ROULETTE' : 'DRAFTING';
    const next: DraftState = { 
       ...cur, 
       status: initialStatus,
       gameMode: selectedMode,
       optionsPerRound,
       filters: buildFilters(),
       round: 1,
       totalRounds: selectedMode === 'vip' ? 6 : 3,
       p1: { ...cur.p1, team: [], ready: false },
       p2: cur.p2 ? { ...cur.p2, team: [], ready: false } : null,
       p1HeistChoice: null, p2HeistChoice: null,
       p1Budget: 100, p2Budget: 100, currentBid: 0, highestBidder: null, p1Passed: false, p2Passed: false,
       snakeTurn: 1, snakePickCount: 0
    };
    if (selectedMode === 'monotype') {
       next.monotypeP1 = ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
       next.monotypeP2 = ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
    }
    
    p1PendingRef.current = null;
    p2PendingRef.current = null;
    p1HeistRef.current = null;
    p2HeistRef.current = null;
    setKeepChoice(null); setGiveChoice(null); setSubmitted(false);
    setMyHeistStealIdx(null); setMyHeistSwapIdx(null); setHeistSubmitted(false);
    generateOptions(next, pokemonList);
    applyState(next); broadcastToGuest(next);
  }, [generateOptions, applyState, broadcastToGuest, pokemonList, selectedMode, optionsPerRound, buildFilters]);

  const submitChoices = useCallback((kId: number, gId: number) => {
    if (!gameStateRef.current) return;
    playLockIn();
    setSubmitted(true);
    setKeepChoice(kId);
    setGiveChoice(gId);
    if (isHostRef.current) {
      p1PendingRef.current = { keepId: kId, giveId: gId };
      const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
      next.p1.ready = true;
      if (p2PendingRef.current) { resolveRound(next); } else { applyState(next); broadcastToGuest(next); }
    } else {
      const conn = hostConnRef.current;
      if (conn && conn.open) {
        conn.send({ type: 'submit_choices', keepId: kId, giveId: gId });
      } else { alert('Lost connection to host!'); setSubmitted(false); }
    }
  }, [applyState, broadcastToGuest, resolveRound]);

  const submitMyChoices = useCallback(() => {
    if (keepChoice !== null && (giveChoice !== null || gameState?.gameMode === 'vip')) {
      playThud();
      submitChoices(keepChoice, giveChoice ?? -1); // send -1 or some dummy value for giveChoice
    }
  }, [keepChoice, giveChoice, gameState?.gameMode, submitChoices]);

  const [speedrunTimer, setSpeedrunTimer] = useState(7);
  useEffect(() => {
    const isHostLocal = isHostRef.current;
    const mySlotLocal = isHostLocal ? gameState?.p1 : gameState?.p2;
    const myOptionsLocal = (gameState?.gameMode === 'snake' || gameState?.gameMode === 'auction') ? gameState?.p1Options : (isHostLocal ? gameState?.p1Options : gameState?.p2Options);
    if (gameState?.gameMode === 'speedrun' && gameState.status === 'DRAFTING' && !submitted && !mySlotLocal?.ready) {
      setSpeedrunTimer(7);
      const interval = setInterval(() => {
        setSpeedrunTimer(t => {
          if (t <= 1) {
            if (myOptionsLocal && myOptionsLocal.length >= 2) {
               const sorted = [...myOptionsLocal].sort((a, b) => a.stats.total - b.stats.total);
               const worst = sorted[0];
               const best = sorted[sorted.length - 1]; 
               submitChoices(worst.id, best.id);
            }
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState?.round, gameState?.status, gameState?.gameMode, submitted, gameState?.p1?.ready, gameState?.p2?.ready, gameState?.p1Options, gameState?.p2Options, submitChoices]);

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

  const submitMyNuzlocke = useCallback(() => {
    if (!gameStateRef.current || myNuzlockeTargetIdx === null || myNuzlockeProtectIdx === null) return;
    playStealSound(); // Reuse sound
    setNuzlockeSubmitted(true);
    if (isHostRef.current) {
      const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
      next.nuzlockeP1Target = myNuzlockeTargetIdx;
      next.nuzlockeP1Protect = myNuzlockeProtectIdx;
      const p2Ready = next.nuzlockeP2Target !== null && next.nuzlockeP2Target !== undefined;
      if (p2Ready) { resolveNuzlocke(next); } else { applyState(next); broadcastToGuest(next); }
    } else {
      const conn = hostConnRef.current;
      if (conn && conn.open) {
        conn.send({ type: 'submit_nuzlocke', targetIdx: myNuzlockeTargetIdx, protectIdx: myNuzlockeProtectIdx });
      } else { alert('Lost connection to host!'); setNuzlockeSubmitted(false); }
    }
  }, [myNuzlockeTargetIdx, myNuzlockeProtectIdx, applyState, broadcastToGuest, resolveNuzlocke]);


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

  const exportToShowdown = useCallback(async () => {
    if (!gameStateRef.current) return;
    const team = isHostRef.current ? gameStateRef.current.p1.team : gameStateRef.current.p2?.team;
    if (!team) return;
    
    setIsExporting(true);
    try {
      const names = team.filter(m => !m.isMystery).map(m => m.actualPk.displayName);
      const showdownText = await generateShowdownExport(names);
      
      await navigator.clipboard.writeText(showdownText);
      playHoverTick();
      alert('Competitive Team copied to clipboard with Random Battle sets!');
    } catch (err) {
      console.error('Failed to export competitive team: ', err);
      alert('Failed to generate competitive sets.');
    } finally {
      setIsExporting(false);
    }
  }, []);

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
      status: cur.gameMode === 'monotype' ? 'MONOTYPE_ROULETTE' : 'DRAFTING',
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

  const changeModeMidDraft = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const newMode = e.target.value as GameMode;
    const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
    next.gameMode = newMode;
    generateOptions(next, pokemonList);
    applyState(next); broadcastToGuest(next);
  }, [applyState, broadcastToGuest, generateOptions, pokemonList]);

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
  const myOptions = (gameState?.gameMode === 'snake' || gameState?.gameMode === 'auction') ? gameState?.p1Options : (isHost ? gameState?.p1Options : gameState?.p2Options);
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0b0e16] to-black text-slate-200 p-6 font-sans relative overflow-hidden">
      {/* Dynamic Grid Background Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 20%, #000 100%)' }}></div>
      {/* Content Wrapper */}
      <div className="relative z-10 h-full flex flex-col">
      <AnimatePresence>
        {vsScreenPlaying && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
          >
            <div className="flex items-center gap-8 md:gap-16">
              <motion.div 
                initial={{ x: -100, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-indigo-500/20 border-4 border-indigo-500 flex items-center justify-center mb-4 shadow-[0_0_50px_rgba(99,102,241,0.5)]">
                  <Users className="w-12 h-12 md:w-16 md:h-16 text-indigo-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">{gameState?.p1.username}</h2>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}
                className="text-6xl md:text-8xl font-black italic bg-gradient-to-br from-amber-400 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
              >
                VS
              </motion.div>
              
              <motion.div 
                initial={{ x: 100, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-rose-500/20 border-4 border-rose-500 flex items-center justify-center mb-4 shadow-[0_0_50px_rgba(244,63,94,0.5)]">
                  <Users className="w-12 h-12 md:w-16 md:h-16 text-rose-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">{gameState?.p2?.username || 'Opponent'}</h2>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">RogueDex</Link>
            <span className="text-slate-600 font-bold hidden sm:inline">/</span>
            <h1 className="text-lg font-bold text-slate-300 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400 hidden sm:block" /> <span className="hidden sm:inline">Clash Draft</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          {gameState && isHost && gameState.status !== 'LOBBY' && (
            <>
              <select
                value={gameState.gameMode}
                onChange={changeModeMidDraft}
                className="bg-slate-900 text-fuchsia-400 font-bold px-3 py-2 rounded-lg text-xs transition-colors border border-slate-700 outline-none cursor-pointer hover:border-slate-500"
              >
                {GAME_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <button onClick={restartDraft} className="whitespace-nowrap inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-rose-400 font-bold px-3 py-2 rounded-lg text-xs transition-colors border border-slate-700 hover:border-rose-500/50">🔄 Reset</button>
              <button onClick={returnToLobby} className="whitespace-nowrap inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 font-bold px-3 py-2 rounded-lg text-xs transition-colors border border-slate-700 hover:border-indigo-500/50">⬅️ Lobby</button>
              <div className="hidden md:block w-px h-6 bg-slate-800 mx-1"></div>
            </>
          )}
          <button 
            onClick={toggleCries}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-lg border font-bold transition-all text-xs ${
              criesOn ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
            title="Toggle Pokemon Cries"
          >
            {criesOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {criesOn ? 'Cries On' : 'Cries Off'}
          </button>
          <button 
            onClick={() => setMusicOn(!musicOn)}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-lg border font-bold transition-all text-xs ${
              musicOn ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
            title="Toggle Ambient Lofi"
          >
            {musicOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {musicOn ? 'Vibing' : 'Music Off'}
          </button>
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
        ) : gameState.status === 'MONOTYPE_ROULETTE' ? (
          <MonotypeRoulettePanel gameState={gameState} isHost={isHost} onComplete={() => {
             const next = JSON.parse(JSON.stringify(gameStateRef.current));
             next.status = 'DRAFTING';
             applyState(next); broadcastToGuest(next);
          }} />
        ) : gameState.status === 'HEIST' ? (
          <HeistPhase gameState={gameState} isHost={isHost} myTeam={mySlot?.team ?? []} opponentTeam={opponentSlot?.team ?? []} myStealIdx={myHeistStealIdx} mySwapIdx={myHeistSwapIdx} setMyStealIdx={setMyHeistStealIdx} setMySwapIdx={setMyHeistSwapIdx} heistSubmitted={heistSubmitted} onSubmit={submitMyHeist} />
        ) : gameState.status === 'NUZLOCKE' ? (
          <NuzlockePhase gameState={gameState} isHost={isHost} myTeam={mySlot?.team ?? []} opponentTeam={opponentSlot?.team ?? []} myTargetIdx={myNuzlockeTargetIdx} myProtectIdx={myNuzlockeProtectIdx} setMyTargetIdx={setMyNuzlockeTargetIdx} setMyProtectIdx={setMyNuzlockeProtectIdx} submitted={nuzlockeSubmitted} onSubmit={submitMyNuzlocke} />
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
              {gameState.gameMode === 'shadow' && gameState.status === 'DRAFTING' && <p className="text-slate-400 font-bold mt-1 text-sm">🌑 SHADOW PROTOCOL - Pick by clues!</p>}
              {gameState.gameMode === 'monotype' && gameState.status === 'DRAFTING' && (
                <div className="flex gap-4 mt-1 justify-center">
                  <p className="font-bold text-sm" style={{ color: gameState.monotypeP1 ? TYPE_COLORS[gameState.monotypeP1] : '#fb923c' }}>
                    🔥 P1: {gameState.monotypeP1?.toUpperCase()}
                  </p>
                  <p className="font-bold text-sm" style={{ color: gameState.monotypeP2 ? TYPE_COLORS[gameState.monotypeP2] : '#fb923c' }}>
                    🔥 P2: {gameState.monotypeP2?.toUpperCase()}
                  </p>
                </div>
              )}
              {gameState.gameMode === 'wildcard' && gameState.status === 'DRAFTING' && <p className="text-fuchsia-400 font-bold mt-1 text-sm animate-pulse">🃏 WILDCARD MODE: 1 of these is a trap!</p>}
              {gameState.gameMode === 'vip' && gameState.status === 'DRAFTING' && gameState.round > 1 && <p className="text-yellow-400 font-bold mt-1 text-sm">👑 PROTECT THE KING: Pick 1 to join your {mySlot?.team[0]?.actualPk.types[0]?.toUpperCase() ?? ''} King!</p>}
              {gameState.gameMode === 'vip' && gameState.status === 'DRAFTING' && gameState.round === 1 && <p className="text-yellow-400 font-bold mt-1 text-sm">👑 PROTECT THE KING: Choose your VIP! Your entire team will share their type!</p>}
              {gameState.gameMode === 'vip' && gameState.status === 'DRAFTING' && gameState.round === 1 && <p className="text-yellow-400 font-bold mt-1 text-sm">👑 PROTECT THE KING: Choose your VIP!</p>}
              {gameState.gameMode === 'speedrun' && gameState.status === 'DRAFTING' && !submitted && !mySlot?.ready && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="text-4xl font-black text-red-500 animate-pulse bg-red-950/50 px-6 py-2 rounded-xl border-2 border-red-500/50">
                    00:0{speedrunTimer}
                  </div>
                  <p className="text-red-400 text-xs font-bold mt-2 uppercase tracking-widest">Pick fast or get the worst!</p>
                </div>
              )}
              {gameState.gameMode !== 'auction' && gameState.gameMode !== 'snake' && gameState.gameMode !== 'vip' && gameState.status !== 'REVEAL' && <p className="text-slate-400 mt-2">Pick 1 to Keep, give 1 to your opponent!</p>}
              {gameState.status === 'REVEAL' && isHost && (
                <button onClick={returnToLobby} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">🔄 Play Again (Change Settings)</button>
              )}
              {gameState.status === 'REVEAL' && !isHost && <p className="text-slate-500 text-sm mt-2">Waiting for host to restart...</p>}
            </div>
            
            {gameState.gameMode === 'salary_cap' && gameState.status === 'DRAFTING' && gameState.salaryPhase === 'NOMINATING' && (
              <div className="max-w-4xl mx-auto w-full mb-4">
                <h3 className="text-center text-xl font-bold mb-4 text-emerald-400">
                  {gameState.salaryNominationTurn === myPlayerNum ? "Your Turn to Nominate!" : "Opponent is Nominating..."}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {gameState.p1Options.map(pk => (
                    <button 
                       key={pk.id}
                       onClick={() => {
                          if (gameState.salaryNominationTurn === myPlayerNum) {
                            playSelectClick();
                            if (isHostRef.current) {
                              const next = JSON.parse(JSON.stringify(gameStateRef.current));
                              next.p1Options = [pk];
                              next.salaryPhase = 'BIDDING';
                              applyState(next); broadcastToGuest(next);
                            } else {
                              hostConnRef.current?.send({ type: 'nominate_salary_cap', pkId: pk.id });
                            }
                          }
                       }}
                       disabled={gameState.salaryNominationTurn !== myPlayerNum}
                       className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${gameState.salaryNominationTurn === myPlayerNum ? 'bg-slate-900 hover:bg-slate-800 cursor-pointer border-emerald-500/50 hover:border-emerald-400' : 'bg-slate-900/50 opacity-50 cursor-not-allowed border-slate-800'}`}
                    >
                       <img src={pk.sprite} className="w-16 h-16 object-contain drop-shadow-md mb-2" />
                       <div className="font-bold text-sm text-center capitalize">{pk.displayName}</div>
                       <div className="flex gap-1 mt-1">
                         {pk.types.map(t => <span key={t} style={{ color: TYPE_COLORS[t] }} className="text-[10px] font-bold uppercase">{t}</span>)}
                       </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {(gameState.gameMode === 'auction' || (gameState.gameMode === 'salary_cap' && gameState.salaryPhase === 'BIDDING')) && gameState.status === 'DRAFTING' && (
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
                ) : gameState.gameMode !== 'auction' && gameState.gameMode !== 'salary_cap' && gameState.status === 'DRAFTING' ? (
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
                            const isShadow = gameState.gameMode === 'shadow';
                            const isVip = gameState.gameMode === 'vip';
                            
                            // In Blind mode, we only hide the image/name/types, but color remains accurate
                            // In Shadow mode, the color is hidden (purple)
                            const cardColor = isShadow ? '#64748b' : TYPE_COLORS[pk.types[0]];
                            
                            return (
                              <motion.div
                                key={pk.id}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              >
                                <HoloCard typeColor={cardColor} className={`relative p-3 rounded-xl border flex items-center justify-between transition-all overflow-hidden ${
                                  isKeep ? 'bg-indigo-500/20 border-indigo-500' : isGive ? 'bg-rose-500/20 border-rose-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                                }`}>
                                  {isBlind && <BlindClueHint id={pk.id} speciesId={pk.speciesId} />}
                                  {isShadow && <ShadowClueHint id={pk.id} speciesId={pk.speciesId} />}
                                  <div className={`flex items-center gap-3 relative z-30 ${isBlind || isShadow ? 'invisible opacity-0' : ''}`}>
                                    {(!isBlind && !isShadow) && (
                                      <>
                                        <img src={pk.sprite} alt={pk.name} className="w-12 h-12 object-contain" />
                                        <div>
                                          <p className="font-bold text-sm text-white capitalize">{pk.displayName}</p>
                                          <div className="flex gap-1 mt-1">
                                            {pk.types.map(t => <span key={t} style={{ color: TYPE_COLORS[t] }} className="text-[10px] font-bold uppercase">{t}</span>)}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1 relative z-30">
                                    <button onClick={() => { playHoverTick(); setKeepChoice(pk.id); if (giveChoice === pk.id) setGiveChoice(null); }}
                                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors shadow-lg ${isKeep ? 'bg-indigo-500 text-white shadow-indigo-500/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-700 shadow-black/50'}`}>{isVip ? 'Draft' : 'Keep'}</button>
                                    {!isVip && (
                                      <button onClick={() => { playHoverTick(); setGiveChoice(pk.id); if (keepChoice === pk.id) setKeepChoice(null); }}
                                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors shadow-lg ${isGive ? 'bg-rose-500 text-white shadow-rose-500/50' : 'bg-slate-900 text-slate-400 hover:bg-slate-700 shadow-black/50'}`}>Give</button>
                                    )}
                                  </div>
                                </HoloCard>
                              </motion.div>
                            );
                          })}
                        </div>
                        <button onClick={submitMyChoices} disabled={keepChoice === null || (gameState.gameMode !== 'vip' && giveChoice === null)}
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
                    <div className="flex flex-col sm:flex-row gap-3">
                      {isHost ? (
                        <>
                          <button onClick={revealCards} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                            Reveal All Cards
                          </button>
                          <button onClick={restartDraft} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                            🔄 Restart Draft
                          </button>
                        </>
                      ) : (
                        <p className="text-slate-500 text-sm flex items-center h-full px-4">Waiting for host to reveal...</p>
                      )}
                      <button onClick={exportToShowdown} disabled={isExporting} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCopy className="w-5 h-5" />}
                        {isExporting ? 'Generating Sets...' : 'Export to Showdown'}
                      </button>
                    </div>
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

function NuzlockePhase({ gameState, isHost, myTeam, opponentTeam, myTargetIdx, myProtectIdx, setMyTargetIdx, setMyProtectIdx, submitted, onSubmit }: any) {
  const myOpponentReady = isHost ? gameState.nuzlockeP2Target !== null && gameState.nuzlockeP2Target !== undefined : gameState.nuzlockeP1Target !== null && gameState.nuzlockeP1Target !== undefined;
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center relative">
        <div className="absolute inset-0 rounded-3xl blur-2xl bg-rose-500/10 pointer-events-none" />
        <div className="relative">
          <p className="text-6xl mb-2">☠️</p>
          <h2 className="text-4xl font-black text-rose-400 tracking-tight">NUZLOCKE PHASE</h2>
          <p className="text-slate-400 mt-2 text-lg">Pick 1 opponent Pokémon to kill. Pick 1 of yours to protect!</p>
          <div className="mt-3 flex justify-center gap-3">
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-bold uppercase">Step 1: Pick to Kill</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase">Step 2: Pick to Protect</span>
          </div>
        </div>
      </div>
      {submitted ? (
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-rose-500/30 bg-slate-900/50">
          <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          <p className="text-rose-300 font-bold text-lg">Choices locked in! Waiting for opponent...</p>
          {myOpponentReady && <p className="text-emerald-400 text-sm font-bold">Opponent is ready! Resolving Nuzlocke...</p>}
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="font-black text-rose-400 text-lg flex items-center gap-2">
              <Sword className="w-5 h-5" /> Assassinate from {isHost ? gameState.p2?.username : gameState.p1.username}&apos;s Team
            </h3>
            <p className="text-xs text-slate-500">Click a card to mark it for assassination</p>
            <div className="grid grid-cols-3 gap-2">
              {opponentTeam.map((member: any, i: number) => (
                <button key={i} onClick={() => { playHoverTick(); setMyTargetIdx(myTargetIdx === i ? null : i); }}
                  className={`aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all ${myTargetIdx === i ? 'border-rose-400 bg-rose-500/20 scale-95' : 'border-slate-700 bg-slate-900 hover:border-rose-600 hover:bg-rose-500/10'}`}>
                  <img src={member.actualPk.sprite} alt={member.actualPk.name} className="w-12 h-12 object-contain" />
                  <p className="text-[9px] font-bold text-slate-300 capitalize mt-1 text-center leading-tight">{member.actualPk.displayName}</p>
                  {myTargetIdx === i && <span className="text-[8px] text-rose-400 font-black mt-0.5">KILL!</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-black text-emerald-400 text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" /> Protect from Your Team
            </h3>
            <p className="text-xs text-slate-500">Click a card to protect it</p>
            <div className="grid grid-cols-3 gap-2">
              {myTeam.map((member: any, i: number) => (
                <button key={i} onClick={() => { playHoverTick(); setMyProtectIdx(myProtectIdx === i ? null : i); }}
                  className={`aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center transition-all ${myProtectIdx === i ? 'border-emerald-400 bg-emerald-500/20 scale-95' : 'border-slate-700 bg-slate-900 hover:border-emerald-600 hover:bg-emerald-500/10'}`}>
                  <img src={member.actualPk.sprite} alt={member.actualPk.name} className="w-12 h-12 object-contain" />
                  <p className="text-[9px] font-bold text-slate-300 capitalize mt-1 text-center leading-tight">{member.actualPk.displayName}</p>
                  {myProtectIdx === i && <span className="text-[8px] text-emerald-400 font-black mt-0.5">PROTECT</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {!submitted && (
        <button onClick={onSubmit} disabled={myTargetIdx === null || myProtectIdx === null}
          className="px-12 py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all disabled:bg-slate-800 disabled:text-slate-600 bg-rose-500 hover:bg-rose-400 text-slate-900 shadow-lg shadow-rose-500/30">
          ☠️ Lock In Choices
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
        if (data.actualPk.isLegendary || data.actualPk.isMythical || data.actualPk.isUltraBeast) {
          setTimeout(playLegendary, 200);
        }
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
    <motion.div
      key={`${pk.id}-${data.wasAssassinated}`}
      initial={data.wasAssassinated ? { opacity: 0, scale: 0.1, rotate: -45, y: -100 } : { opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={data.wasAssassinated 
        ? { type: 'spring', stiffness: 200, damping: 10, mass: 1, delay: 0.5 + index * 0.1 }
        : { type: 'spring', stiffness: 300, damping: 20, delay: index * 0.1 }
      }
      className="w-full h-full relative"
    >
      {data.wasAssassinated && (
        <motion.div
          initial={{ opacity: 1, scale: 0.5 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="w-full h-full border-4 border-rose-500 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,1)]"></div>
          <span className="absolute text-5xl">💀</span>
        </motion.div>
      )}
      <HoloCard typeColor={TYPE_COLORS[pk.types[0]]} className={`aspect-square w-full h-full relative ${data.wasAssassinated ? 'animate-shake' : ''}`}>
        <div 
          className="w-full h-full relative rounded-2xl transition-transform duration-700"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
        {/* FRONT: MYSTERY */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center overflow-hidden"
             style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <HelpCircle className="w-12 h-12 text-slate-600 mb-2 relative z-10 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">Mystery</span>
          {data.fromOpponent && <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase z-10">Given</span>}
        </div>

        {/* BACK: POKEMON */}
        <div className={`absolute inset-0 w-full h-full border rounded-2xl p-3 flex flex-col items-center justify-between overflow-hidden transition-all ${data.isDead ? 'bg-slate-900 border-rose-900/50 grayscale' : 'bg-slate-900/80 border-slate-700'}`}
             style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {data.fromOpponent && <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase z-10">Given</span>}
          {data.cost !== undefined && <span className="absolute top-2 left-2 text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black z-10">${data.cost}</span>}
          {data.isDead && <div className="absolute inset-0 z-20 flex items-center justify-center bg-rose-950/40 backdrop-blur-[1px]"><span className="text-4xl">☠️</span></div>}
          
          {!data.isMystery && (
            <>
              <img src={pk.sprite} alt={pk.name} className={`w-16 h-16 object-contain z-10 drop-shadow-md ${data.isDead ? 'opacity-50 mix-blend-luminosity' : ''}`} />
              <div className="text-center z-10">
                <p className={`font-bold text-xs capitalize ${data.isDead ? 'text-slate-500 line-through' : 'text-white'}`}>{pk.displayName}</p>
                <div className="flex gap-1 justify-center mt-1">
                  {pk.types.map(t => <div key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className={`w-2 h-2 rounded-full ${data.isDead ? 'opacity-20' : ''}`} />)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </HoloCard>
    </motion.div>
  );
}
