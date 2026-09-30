'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { TYPE_COLORS } from '@/lib/pokemon/constants';
import { Users, UserPlus, Check, HelpCircle, Loader2, Play, Copy } from 'lucide-react';
import Link from 'next/link';

type DraftTeamMember = {
  isMystery: boolean;
  actualPk: PokemonIndexItem;
  fromOpponent: boolean;
};

interface DraftState {
  code: string;
  status: 'LOBBY' | 'DRAFTING' | 'REVEAL';
  optionsPerRound: number;
  round: number; // 1 to 3
  p1: {
    id: string;
    username: string;
    team: DraftTeamMember[];
    ready: boolean;
  };
  p2: {
    id: string;
    username: string;
    team: DraftTeamMember[];
    ready: boolean;
  } | null;
  p1Options: PokemonIndexItem[];
  p2Options: PokemonIndexItem[];
}

export default function DraftMode() {
  const { pokemonList, isLoading } = usePokemon();
  
  const [playerId, setPlayerId] = useState<string>('');
  const [username, setUsername] = useState<string>('Trainer');
  const [joinCode, setJoinCode] = useState('');
  const [optionsPerRound, setOptionsPerRound] = useState(3);
  
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // WebRTC PeerJS References
  const peerRef = useRef<any>(null);
  const activeConnRef = useRef<any>(null); // For Guest sending to Host
  const guestConnRef = useRef<any>(null); // For Host sending to Guest
  
  // Game State
  const [gameState, setGameState] = useState<DraftState | null>(null);
  const gameStateRef = useRef<DraftState | null>(null);
  
  // Local Player Selections
  const [keepChoice, setKeepChoice] = useState<number | null>(null);
  const [giveChoice, setGiveChoice] = useState<number | null>(null);
  
  // Generate Local ID
  useEffect(() => {
    let pid = localStorage.getItem('roguedex_draft_pid');
    if (!pid) {
      pid = 'draft_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('roguedex_draft_pid', pid);
    }
    setPlayerId(pid);
  }, []);
  
  const updateState = (newState: DraftState) => {
    gameStateRef.current = newState;
    setGameState(newState);
  };
  
  const broadcastState = (state: DraftState) => {
    if (isHost && guestConnRef.current && guestConnRef.current.open) {
      guestConnRef.current.send({ type: 'sync_state', state });
    }
  };

  const initPeer = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (peerRef.current) return resolve(peerRef.current);
      
      import('peerjs').then(({ Peer }) => {
        const peer = new Peer(playerId, { debug: 1 });
        peer.on('open', () => {
          peerRef.current = peer;
          setIsConnected(true);
          resolve(peer);
        });
        
        peer.on('connection', (conn) => {
          // If we are Host, this is Player 2 connecting
          if (isHost) {
            guestConnRef.current = conn;
            conn.on('open', () => {
              if (gameStateRef.current) {
                conn.send({ type: 'sync_state', state: gameStateRef.current });
              }
            });
            conn.on('data', (data: any) => handleHostReceive(data));
          } else {
            // Should not happen normally for guest, but just in case
            conn.on('data', (data: any) => handleGuestReceive(data));
          }
        });
        
        peer.on('error', (err) => {
          console.error(err);
          reject(err);
        });
      });
    });
  };

  const handleGuestReceive = (payload: any) => {
    if (payload.type === 'sync_state') {
      updateState(payload.state);
      // Reset local choices if new round started
      if (payload.state.status === 'DRAFTING') {
         // reset
      }
    }
  };

  const handleHostReceive = (payload: any) => {
    if (!gameStateRef.current) return;
    
    if (payload.type === 'guest_join') {
      const next = { ...gameStateRef.current };
      next.p2 = {
        id: payload.playerId,
        username: payload.username,
        team: [],
        ready: false
      };
      updateState(next);
      broadcastState(next);
    }
    
    if (payload.type === 'submit_choices') {
      // Guest submitted their keep/give
      const next = { ...gameStateRef.current };
      if (!next.p2) return;
      
      next.p2.ready = true;
      handlePlayerReady(next, 'p2', payload.keepId, payload.giveId);
    }
  };
  
  // Host stores actions temporarily
  const p1PendingRef = useRef<{keepId: number, giveId: number} | null>(null);
  const p2PendingRef = useRef<{keepId: number, giveId: number} | null>(null);

  const handlePlayerReady = (state: DraftState, player: 'p1'|'p2', keepId: number, giveId: number) => {
    if (player === 'p1') p1PendingRef.current = { keepId, giveId };
    if (player === 'p2') p2PendingRef.current = { keepId, giveId };
    
    if (state.p1.ready && state.p2?.ready) {
      resolveRound(state);
    } else {
      updateState(state);
      broadcastState(state);
    }
  };

  const resolveRound = (state: DraftState) => {
    const act1 = p1PendingRef.current!;
    const act2 = p2PendingRef.current!;
    
    const p1KeepPk = state.p1Options.find(p => p.id === act1.keepId)!;
    const p1GivePk = state.p1Options.find(p => p.id === act1.giveId)!;
    
    const p2KeepPk = state.p2Options.find(p => p.id === act2.keepId)!;
    const p2GivePk = state.p2Options.find(p => p.id === act2.giveId)!;
    
    // Add to teams
    state.p1.team.push({ isMystery: false, actualPk: p1KeepPk, fromOpponent: false });
    state.p1.team.push({ isMystery: true, actualPk: p2GivePk, fromOpponent: true });
    
    state.p2!.team.push({ isMystery: false, actualPk: p2KeepPk, fromOpponent: false });
    state.p2!.team.push({ isMystery: true, actualPk: p1GivePk, fromOpponent: true });
    
    // Reset Ready
    state.p1.ready = false;
    state.p2!.ready = false;
    p1PendingRef.current = null;
    p2PendingRef.current = null;
    
    state.round += 1;
    
    if (state.round > 3) {
      state.status = 'REVEAL';
    } else {
      // Generate next round options
      generateOptionsForRound(state);
    }
    
    // reset local choices
    setKeepChoice(null);
    setGiveChoice(null);
    
    updateState(state);
    broadcastState(state);
  };
  
  const generateOptionsForRound = (state: DraftState) => {
    // Basic random gen
    const getRand = () => pokemonList[Math.floor(Math.random() * pokemonList.length)];
    
    const ops1: PokemonIndexItem[] = [];
    const ops2: PokemonIndexItem[] = [];
    for(let i=0; i<state.optionsPerRound; i++) {
      ops1.push(getRand());
      ops2.push(getRand());
    }
    state.p1Options = ops1;
    state.p2Options = ops2;
  };

  const handleCreateRoom = async () => {
    if (!username.trim()) return alert("Enter a username");
    setIsHost(true);
    try {
      const peer = await initPeer();
      const code = peer.id.toUpperCase();
      
      const initial: DraftState = {
        code,
        status: 'LOBBY',
        optionsPerRound,
        round: 1,
        p1: { id: playerId, username, team: [], ready: false },
        p2: null,
        p1Options: [],
        p2Options: []
      };
      updateState(initial);
    } catch (e) {
      alert("Error starting draft host");
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim() || !joinCode.trim()) return alert("Enter username and code");
    setIsHost(false);
    try {
      const peer = await initPeer();
      const conn = peer.connect(joinCode.toUpperCase());
      activeConnRef.current = conn;
      
      conn.on('open', () => {
        conn.send({
          type: 'guest_join',
          playerId,
          username
        });
      });
      
      conn.on('data', (data: any) => handleGuestReceive(data));
    } catch (e) {
      alert("Error joining draft room");
    }
  };

  const startDraft = () => {
    if (!isHost || !gameState) return;
    const next = { ...gameState };
    next.status = 'DRAFTING';
    generateOptionsForRound(next);
    updateState(next);
    broadcastState(next);
  };
  
  const submitMyChoices = () => {
    if (!gameState || keepChoice === null || giveChoice === null) return;
    
    if (isHost) {
      const next = { ...gameState };
      next.p1.ready = true;
      handlePlayerReady(next, 'p1', keepChoice, giveChoice);
    } else {
      // Send to host
      if (activeConnRef.current) {
        activeConnRef.current.send({
          type: 'submit_choices',
          keepId: keepChoice,
          giveId: giveChoice
        });
      }
      // Update local state to show ready
      const next = { ...gameState };
      if (next.p2) next.p2.ready = true;
      updateState(next);
    }
  };
  
  const revealCards = () => {
    if (!isHost || !gameState) return;
    const next = { ...gameState };
    // Flip all mystery cards
    next.p1.team = next.p1.team.map(pk => ({ ...pk, isMystery: false }));
    next.p2!.team = next.p2!.team.map(pk => ({ ...pk, isMystery: false }));
    updateState(next);
    broadcastState(next);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e16] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e16] text-slate-200 p-6 font-sans">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            RogueDex
          </Link>
          <span className="text-slate-600 font-bold">/</span>
          <h1 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Clash Draft
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {!gameState ? (
          /* ================= LOBBY SETUP ================= */
          <div className="max-w-md mx-auto mt-20 glass-panel p-8 rounded-2xl flex flex-col gap-6 border border-slate-800 bg-slate-900/50">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-2">Multiplayer Draft</h2>
              <p className="text-sm text-slate-400">Pick for yourself, give to your opponent.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Host a Game</label>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-slate-400">Cards per Round:</span>
                <select 
                  value={optionsPerRound}
                  onChange={e => setOptionsPerRound(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-white focus:outline-none"
                >
                  <option value={3}>3 Cards</option>
                  <option value={4}>4 Cards</option>
                </select>
              </div>
              <button 
                onClick={handleCreateRoom}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> Create Draft Room
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 absolute w-full"></div>
              <span className="bg-[#0b0e16] px-3 text-xs text-slate-500 relative font-bold uppercase">OR</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Join a Game</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Room Code"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                />
                <button 
                  onClick={handleJoinRoom}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 rounded-xl transition-colors border border-slate-700"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : gameState.status === 'LOBBY' ? (
          /* ================= LOBBY WAITING ================= */
          <div className="max-w-lg mx-auto mt-20 glass-panel p-8 rounded-2xl text-center border border-slate-800 bg-slate-900/50">
            <h2 className="text-2xl font-black text-white mb-6">Waiting Room</h2>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-8">
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mb-2">Room Code</p>
              <div className="text-5xl font-black font-mono tracking-widest text-indigo-400 mb-2 select-all cursor-pointer">
                {gameState.code}
              </div>
              <p className="text-xs text-slate-500">Share this code with your opponent</p>
            </div>

            <div className="flex justify-around items-center mb-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center text-xl font-bold text-indigo-300 mb-2">
                  P1
                </div>
                <span className="font-bold">{gameState.p1.username}</span>
              </div>
              
              <span className="text-2xl font-black text-slate-700">VS</span>

              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 border-2 ${
                  gameState.p2 ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-600 border-dashed'
                }`}>
                  {gameState.p2 ? 'P2' : '?'}
                </div>
                <span className={`font-bold ${gameState.p2 ? 'text-white' : 'text-slate-600'}`}>
                  {gameState.p2 ? gameState.p2.username : 'Waiting...'}
                </span>
              </div>
            </div>

            {isHost && (
              <button 
                onClick={startDraft}
                disabled={!gameState.p2}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 text-lg"
              >
                <Play className="w-5 h-5" /> Start Draft
              </button>
            )}
            {!isHost && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Waiting for Host to start...
              </div>
            )}
          </div>
        ) : (
          /* ================= DRAFTING & REVEAL PHASE ================= */
          <div className="flex flex-col gap-12">
            
            {/* Header info */}
            <div className="text-center">
              <h2 className="text-3xl font-black text-white">
                {gameState.status === 'REVEAL' ? 'Final Teams!' : `Drafting Phase - Round ${gameState.round}/3`}
              </h2>
              {gameState.status !== 'REVEAL' && (
                <p className="text-slate-400 mt-2">Pick 1 to keep, give 1 to your opponent!</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Side: P1 Team */}
              <div className="flex flex-col gap-4 order-2 lg:order-1">
                <h3 className="text-xl font-bold text-indigo-400 text-center">
                  {gameState.p1.username}'s Team
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, idx) => {
                    const pkData = gameState.p1.team[idx];
                    return <TeamSlot key={idx} data={pkData} />;
                  })}
                </div>
              </div>

              {/* Center Area: Current Choices (if DRAFTING) */}
              <div className="flex flex-col gap-6 order-1 lg:order-2">
                {gameState.status === 'DRAFTING' ? (
                  <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col h-full bg-slate-900/50">
                    
                    {/* Am I P1 or P2? */}
                    {(() => {
                      const isP1 = isHost; // For now host is P1
                      const myState = isP1 ? gameState.p1 : gameState.p2;
                      const myOptions = isP1 ? gameState.p1Options : gameState.p2Options;
                      
                      if (myState?.ready) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p className="font-bold">Waiting for opponent...</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <h3 className="text-center font-bold text-slate-300 mb-6 uppercase tracking-widest text-sm">Your Choices</h3>
                          <div className="grid grid-cols-1 gap-3 flex-1 mb-6">
                            {myOptions.map(pk => {
                              const isKeep = keepChoice === pk.id;
                              const isGive = giveChoice === pk.id;
                              const isDiscard = !isKeep && !isGive && (keepChoice !== null && giveChoice !== null);
                              
                              return (
                                <div 
                                  key={pk.id}
                                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                    isKeep ? 'bg-indigo-500/20 border-indigo-500' :
                                    isGive ? 'bg-rose-500/20 border-rose-500' :
                                    isDiscard ? 'bg-slate-900 border-slate-800 opacity-50' :
                                    'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <img src={pk.sprite} alt={pk.name} className="w-12 h-12 object-contain" />
                                    <div>
                                      <p className="font-bold text-sm text-white capitalize">{pk.displayName}</p>
                                      <div className="flex gap-1 mt-1">
                                        {pk.types.map(t => (
                                          <span key={t} style={{ color: TYPE_COLORS[t] }} className="text-[10px] font-bold uppercase">{t}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-1">
                                    <button 
                                      onClick={() => {
                                        setKeepChoice(pk.id);
                                        if (giveChoice === pk.id) setGiveChoice(null);
                                      }}
                                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                        isKeep ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                                      }`}
                                    >
                                      Keep
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setGiveChoice(pk.id);
                                        if (keepChoice === pk.id) setKeepChoice(null);
                                      }}
                                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${
                                        isGive ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                                      }`}
                                    >
                                      Give
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <button 
                            onClick={submitMyChoices}
                            disabled={keepChoice === null || giveChoice === null}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
                          >
                            Confirm Selection
                          </button>
                        </>
                      );
                    })()}

                  </div>
                ) : (
                  <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 flex flex-col items-center justify-center text-center h-full gap-6 bg-slate-900/50">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                      <Check className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">Draft Complete!</h3>
                      <p className="text-slate-400">Both players have built their teams.</p>
                    </div>
                    {isHost && (
                      <button 
                        onClick={revealCards}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl"
                      >
                        Reveal All Cards
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: P2 Team */}
              <div className="flex flex-col gap-4 order-3">
                <h3 className="text-xl font-bold text-rose-400 text-center">
                  {gameState.p2?.username}'s Team
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, idx) => {
                    const pkData = gameState.p2?.team[idx];
                    return <TeamSlot key={idx} data={pkData} />;
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// Subcomponent for rendering a slot
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
      <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
        <HelpCircle className="w-12 h-12 text-slate-600 mb-2 relative z-10 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">Mystery</span>
        {data.fromOpponent && (
          <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">
            Given
          </span>
        )}
      </div>
    );
  }

  const pk = data.actualPk;
  return (
    <div className="aspect-square bg-slate-900/80 border border-slate-700 rounded-2xl p-3 flex flex-col items-center justify-between relative overflow-hidden">
      {data.fromOpponent && (
        <span className="absolute top-2 right-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase z-10">
          Given
        </span>
      )}
      <img src={pk.sprite} alt={pk.name} className="w-16 h-16 object-contain z-10 drop-shadow-md" />
      <div className="text-center z-10">
        <p className="font-bold text-xs text-white capitalize">{pk.displayName}</p>
        <div className="flex gap-1 justify-center mt-1">
          {pk.types.map(t => (
            <div key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="w-2 h-2 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
