'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { FilterCriteria, filterPokemon } from '@/lib/pokemon/data';
import { TYPE_COLORS } from '@/lib/pokemon/constants';
import { Users, UserPlus, Check, HelpCircle, Loader2, Play, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

type DraftTeamMember = {
  isMystery: boolean;
  actualPk: PokemonIndexItem;
  fromOpponent: boolean;
};

interface PlayerSlot {
  id: string;
  username: string;
  team: DraftTeamMember[];
  ready: boolean;
}

interface DraftState {
  code: string;
  status: 'LOBBY' | 'DRAFTING' | 'REVEAL';
  optionsPerRound: number;
  round: number;
  filters: FilterCriteria;
  p1: PlayerSlot;
  p2: PlayerSlot | null;
  p1Options: PokemonIndexItem[];
  p2Options: PokemonIndexItem[];
}

const ALL_TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
const ALL_GENS = [1,2,3,4,5,6,7,8,9];

export default function DraftMode() {
  const { pokemonList, loading } = usePokemon();
  const [username, setUsername] = useState('Trainer');
  const [joinCode, setJoinCode] = useState('');
  const [optionsPerRound, setOptionsPerRound] = useState(3);

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
    const src = pool.length > 0 ? pool : list;
    const rand = () => src[Math.floor(Math.random() * src.length)];
    const p1Opts: PokemonIndexItem[] = [];
    const p2Opts: PokemonIndexItem[] = [];
    for (let i = 0; i < state.optionsPerRound; i++) {
      p1Opts.push(rand());
      p2Opts.push(rand());
    }
    state.p1Options = p1Opts;
    state.p2Options = p2Opts;
  }, []);

  const resolveRound = useCallback((state: DraftState) => {
    const act1 = p1PendingRef.current!;
    const act2 = p2PendingRef.current!;
    const p1Keep = state.p1Options.find(p => p.id === act1.keepId)!;
    const p1Give = state.p1Options.find(p => p.id === act1.giveId)!;
    const p2Keep = state.p2Options.find(p => p.id === act2.keepId)!;
    const p2Give = state.p2Options.find(p => p.id === act2.giveId)!;
    state.p1.team.push({ isMystery: false, actualPk: p1Keep, fromOpponent: false });
    state.p1.team.push({ isMystery: true,  actualPk: p2Give, fromOpponent: true  });
    state.p2!.team.push({ isMystery: false, actualPk: p2Keep, fromOpponent: false });
    state.p2!.team.push({ isMystery: true,  actualPk: p1Give, fromOpponent: true  });
    state.p1.ready = false;
    state.p2!.ready = false;
    p1PendingRef.current = null;
    p2PendingRef.current = null;
    state.round += 1;
    if (state.round > 3) {
      state.status = 'REVEAL';
    } else {
      generateOptions(state, pokemonList);
    }
    applyState({ ...state });
    broadcastToGuest({ ...state });
  }, [applyState, broadcastToGuest, generateOptions, pokemonList]);

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
  }, [applyState, broadcastToGuest, resolveRound]);

  const initPeer = useCallback((id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (peerRef.current) { resolve(peerRef.current); return; }
      import('peerjs').then(({ Peer }) => {
        const peer = new Peer(id, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
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
      const initial: DraftState = {
        code, status: 'LOBBY', optionsPerRound, round: 1, filters,
        p1: { id: pid, username: usernameRef.current, team: [], ready: false },
        p2: null, p1Options: [], p2Options: [],
      };
      applyState(initial);
    } catch (e: any) {
      isHostRef.current = false;
      alert('Could not create room. Please refresh and try again.\n' + (e.message || String(e)));
    }
  }, [initPeer, optionsPerRound, applyState, buildFilters]);

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
    } catch (e: any) { alert('Error joining room: ' + (e.message || String(e))); }
  }, [joinCode, initPeer, applyState]);

  const startDraft = useCallback(() => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const next: DraftState = { ...gameStateRef.current, status: 'DRAFTING' };
    generateOptions(next, pokemonList);
    applyState(next); broadcastToGuest(next);
  }, [generateOptions, applyState, broadcastToGuest, pokemonList]);

  const submitMyChoices = useCallback(() => {
    if (!gameStateRef.current || keepChoice === null || giveChoice === null) return;
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

  const revealCards = useCallback(() => {
    if (!isHostRef.current || !gameStateRef.current) return;
    const next: DraftState = JSON.parse(JSON.stringify(gameStateRef.current));
    next.p1.team = next.p1.team.map(m => ({ ...m, isMystery: false }));
    next.p2!.team = next.p2!.team.map(m => ({ ...m, isMystery: false }));
    applyState(next); broadcastToGuest(next);
  }, [applyState, broadcastToGuest]);

  useEffect(() => { setKeepChoice(null); setGiveChoice(null); setSubmitted(false); }, [gameState?.round]);
  useEffect(() => { return () => { peerRef.current?.destroy(); peerRef.current = null; }; }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e16] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  const isHost = isHostRef.current;
  const myOptions = isHost ? gameState?.p1Options : gameState?.p2Options;
  const mySlot = isHost ? gameState?.p1 : gameState?.p2;
  const activeFilterCount = [
    selectedGens.length > 0, selectedTypes.length > 0, formsMode !== 'all', maxBst600,
    excludeLegendary, excludeMythical, excludeParadox, excludeStarters, excludeUltraBeast,
    excludeAlolan, excludeGalarian, excludeHisuian, excludePaldean,
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
        {!gameState ? (
          <div className="max-w-xl mx-auto mt-6 flex flex-col gap-4">
            {/* Main Card */}
            <div className="p-8 rounded-2xl flex flex-col gap-6 border border-slate-800 bg-slate-900/50">
              <div className="text-center">
                <h2 className="text-2xl font-black text-white mb-2">Multiplayer Draft</h2>
                <p className="text-sm text-slate-400">Pick for yourself, give to your opponent.</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Host a Game</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">Cards per Round:</span>
                  <select value={optionsPerRound} onChange={e => setOptionsPerRound(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-white focus:outline-none">
                    <option value={3}>3 Cards</option>
                    <option value={4}>4 Cards</option>
                  </select>
                </div>
                <button onClick={handleCreateRoom}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Create Draft Room
                </button>
              </div>
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
            </div>

            {/* Advanced Filters Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <button onClick={() => setShowFilters(f => !f)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-slate-300">Advanced Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">{activeFilterCount} active</span>
                  )}
                  {pokemonList.length > 0 && (
                    <span className="text-xs text-slate-500">({filteredPool.length} Pokemon in pool)</span>
                  )}
                </div>
                {showFilters ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showFilters && (
                <div className="px-6 pb-6 flex flex-col gap-5 border-t border-slate-800 pt-5">

                  {/* Generations */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Generations</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_GENS.map(g => (
                        <button key={g}
                          onClick={() => setSelectedGens(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors border ${
                            selectedGens.includes(g) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}>Gen {g}</button>
                      ))}
                    </div>
                  </div>

                  {/* Types */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Types</label>
                      <select value={typeMatchMode} onChange={e => setTypeMatchMode(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white">
                        <option value="either">Either Type</option>
                        <option value="primary">Primary Only</option>
                        <option value="secondary">Secondary Only</option>
                        <option value="both">Both Types</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TYPES.map(t => (
                        <button key={t}
                          onClick={() => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold capitalize transition-all border ${
                            selectedTypes.includes(t) ? 'border-transparent text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                          style={selectedTypes.includes(t) ? { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : {}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Forms, BST & Evolution */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Forms</label>
                      <select value={formsMode} onChange={e => setFormsMode(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                        <option value="all">All Forms</option>
                        <option value="base_only">Base Only</option>
                        <option value="mega_only">Megas Only</option>
                        <option value="regional_only">Regionals Only</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Evolution</label>
                      <button onClick={() => setFullyEvolvedOnly(b => !b)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-colors ${
                          fullyEvolvedOnly ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}>
                        <span className={`w-3 h-3 rounded-full border-2 ${fullyEvolvedOnly ? 'bg-indigo-400 border-indigo-400' : 'border-slate-600'}`} />
                        Fully Evolved
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">BST Cap</label>
                      <button onClick={() => setMaxBst600(b => !b)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-colors ${
                          maxBst600 ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}>
                        <span className={`w-3 h-3 rounded-full border-2 ${maxBst600 ? 'bg-amber-400 border-amber-400' : 'border-slate-600'}`} />
                        Max 600 BST
                      </button>
                    </div>
                  </div>

                  {/* Exclusions */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Exclude</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['Legendaries', excludeLegendary, setExcludeLegendary],
                        ['Mythicals', excludeMythical, setExcludeMythical],
                        ['Paradox', excludeParadox, setExcludeParadox],
                        ['Starters', excludeStarters, setExcludeStarters],
                        ['Ultra Beasts', excludeUltraBeast, setExcludeUltraBeast],
                        ['Alolan Forms', excludeAlolan, setExcludeAlolan],
                        ['Galarian Forms', excludeGalarian, setExcludeGalarian],
                        ['Hisuian Forms', excludeHisuian, setExcludeHisuian],
                        ['Paldean Forms', excludePaldean, setExcludePaldean],
                      ] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, set]) => (
                        <button key={label} onClick={() => set(v => !v)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-colors text-left ${
                            val ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}>
                          <span className={`w-3 h-3 rounded-sm border-2 shrink-0 flex items-center justify-center ${val ? 'bg-rose-500 border-rose-500' : 'border-slate-600'}`}>
                            {val && <span className="text-white text-[8px] font-black">X</span>}
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button onClick={resetFilters} className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2 text-center">
                      Reset all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        ) : gameState.status === 'LOBBY' ? (
          <div className="max-w-lg mx-auto mt-20 p-8 rounded-2xl text-center border border-slate-800 bg-slate-900/50">
            <h2 className="text-2xl font-black text-white mb-6">Waiting Room</h2>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-6">
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mb-2">Room Code</p>
              <div className="text-4xl font-black font-mono tracking-widest text-indigo-400 mb-2 select-all cursor-pointer">{gameState.code}</div>
              <p className="text-xs text-slate-500">Share this code with your opponent</p>
            </div>
            {(() => {
              const f = gameState.filters;
              const tags: string[] = [];
              if (f.generations && f.generations.length > 0) tags.push(`Gen ${f.generations.join('/')}`);
              if (f.types && f.types.length > 0) tags.push(f.types.join('+'));
              if (f.maxBst) tags.push('BST max 600');
              if (f.formsMode && f.formsMode !== 'all') tags.push(f.formsMode.replace(/_/g, ' '));
              if (f.excludeLegendary) tags.push('No Legends');
              if (f.excludeMythical) tags.push('No Mythicals');
              if (f.excludeParadox) tags.push('No Paradox');
              if (f.excludeStarters) tags.push('No Starters');
              if (f.excludeUltraBeast) tags.push('No Ultra Beasts');
              if (f.categories?.includes('fully_evolved')) tags.push('Fully Evolved');
              if (tags.length === 0) return <p className="text-xs text-slate-600 mb-4">No filters applied</p>;
              return (
                <div className="mb-6 flex flex-wrap gap-2 justify-center">
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-bold uppercase">{tag}</span>
                  ))}
                </div>
              );
            })()}
            <div className="flex justify-around items-center mb-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center text-xl font-bold text-indigo-300 mb-2">P1</div>
                <span className="font-bold">{gameState.p1.username}</span>
              </div>
              <span className="text-2xl font-black text-slate-700">VS</span>
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 border-2 ${
                  gameState.p2 ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-800 border-dashed border-slate-700 text-slate-600'
                }`}>{gameState.p2 ? 'P2' : '?'}</div>
                <span className={`font-bold ${gameState.p2 ? 'text-white' : 'text-slate-600'}`}>
                  {gameState.p2 ? gameState.p2.username : 'Waiting...'}
                </span>
              </div>
            </div>
            {isHost ? (
              <button onClick={startDraft} disabled={!gameState.p2}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 text-lg">
                <Play className="w-5 h-5" /> Start Draft
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Waiting for host to start...
              </div>
            )}
          </div>

        ) : (
          <div className="flex flex-col gap-12">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white">
                {gameState.status === 'REVEAL' ? 'Final Teams!' : `Round ${gameState.round} / 3`}
              </h2>
              {gameState.status !== 'REVEAL' && <p className="text-slate-400 mt-2">Pick 1 to Keep, give 1 to your opponent!</p>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="flex flex-col gap-4 order-2 lg:order-1">
                <h3 className="text-xl font-bold text-indigo-400 text-center">{gameState.p1.username}&apos;s Team</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => <TeamSlot key={i} data={gameState.p1.team[i]} />)}
                </div>
              </div>
              <div className="flex flex-col gap-6 order-1 lg:order-2">
                {gameState.status === 'DRAFTING' ? (
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
                            return (
                              <div key={pk.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                isKeep ? 'bg-indigo-500/20 border-indigo-500' : isGive ? 'bg-rose-500/20 border-rose-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                              }`}>
                                <div className="flex items-center gap-3">
                                  <img src={pk.sprite} alt={pk.name} className="w-12 h-12 object-contain" />
                                  <div>
                                    <p className="font-bold text-sm text-white capitalize">{pk.displayName}</p>
                                    <div className="flex gap-1 mt-1">
                                      {pk.types.map(t => <span key={t} style={{ color: TYPE_COLORS[t] }} className="text-[10px] font-bold uppercase">{t}</span>)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button onClick={() => { setKeepChoice(pk.id); if (giveChoice === pk.id) setGiveChoice(null); }}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${isKeep ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'}`}>Keep</button>
                                  <button onClick={() => { setGiveChoice(pk.id); if (keepChoice === pk.id) setKeepChoice(null); }}
                                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${isGive ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'}`}>Give</button>
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
                ) : (
                  <div className="p-6 rounded-2xl border border-emerald-500/30 flex flex-col items-center justify-center text-center gap-6 bg-slate-900/50">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                      <Check className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">Draft Complete!</h3>
                      <p className="text-slate-400">Both players have built their teams.</p>
                    </div>
                    {isHost ? (
                      <button onClick={revealCards} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl">Reveal All Cards</button>
                    ) : (
                      <p className="text-slate-500 text-sm">Waiting for host to reveal...</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4 order-3">
                <h3 className="text-xl font-bold text-rose-400 text-center">{gameState.p2?.username ?? 'Opponent'}&apos;s Team</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => <TeamSlot key={i} data={gameState.p2?.team[i]} />)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamSlot({ data }: { data?: DraftTeamMember }) {
  if (!data) {
    return (
      <div className="aspect-square bg-slate-900/50 border-2 border-slate-800 border-dashed rounded-2xl flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-800/80" />
      </div>
    );
  }
  if (data.isMystery) {
    return (
      <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
        <HelpCircle className="w-12 h-12 text-slate-600 mb-2 relative z-10 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">Mystery</span>
        {data.fromOpponent && <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">Given</span>}
      </div>
    );
  }
  const pk = data.actualPk;
  return (
    <div className="aspect-square bg-slate-900/80 border border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-between relative overflow-hidden">
      {data.fromOpponent && <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase z-10">Given</span>}
      <img src={pk.sprite} alt={pk.name} className="w-16 h-16 object-contain z-10 drop-shadow-md" />
      <div className="text-center z-10">
        <p className="font-bold text-xs text-white capitalize">{pk.displayName}</p>
        <div className="flex gap-1 justify-center mt-1">
          {pk.types.map(t => <div key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="w-2 h-2 rounded-full" />)}
        </div>
      </div>
    </div>
  );
}






