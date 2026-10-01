'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { BattlePokemon, BattleMove, BattleAction, BattleRoomState, BattleMode, Player } from '@/lib/pokemon/battle/types';
import { executeTurn } from '@/lib/pokemon/battle/engine';

interface BattleContextType {
  roomCode: string | null;
  status: 'LOBBY' | 'TEAM_SELECT' | 'PLAYING' | 'FINISHED';
  mode: BattleMode;
  format: 'singles' | 'doubles';
  p1: Player | null;
  p2: Player | null;
  spectators: string[];
  activeSlots: { p1: number[]; p2: number[] };
  turnCount: number;
  log: string[];
  chatLog: { sender: string; message: string; timestamp: number }[];
  draftOptions: string[][];
  winnerId: string | null;
  playerId: string;
  username: string;
  isHost: boolean;
  isConnected: boolean;
  
  createRoom: (username: string, mode: BattleMode, format: 'singles' | 'doubles') => void;
  joinRoom: (username: string, code: string) => void;
  setReadyWithTeam: (rawTeam: PokemonIndexItem[], customizations?: any[]) => void;
  submitAction: (actionType: 'FIGHT' | 'SWITCH' | 'FORFEIT', valueIdx: number) => void;
  sendChatMessage: (msgText: string) => void;
  submitDraftSelection: (pokemonName: string) => void;
  leaveRoom: () => void;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

// Helper: Calculate official HP stat
export function calculateHpStat(base: number, iv = 31, ev = 84, level = 100): number {
  if (base === 1) return 1; // Shedinja
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

// Helper: Calculate other stats (atk, def, spAtk, spDef, spe)
export function calculateOtherStat(base: number, iv = 31, ev = 84, level = 100, natureMult = 1.0): number {
  const step = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(step * natureMult);
}

// Convert PokemonIndexItem to BattlePokemon structure
export function convertToBattlePokemon(
  pk: PokemonIndexItem,
  ownerId: string,
  customConfig?: {
    types?: string[];
    ability?: string;
    moves?: BattleMove[];
    stats?: { hp: number; atk: number; def: number; spAtk: number; spDef: number; spe: number };
    evs?: { hp: number; atk: number; def: number; spAtk: number; spDef: number; spe: number };
    ivs?: { hp: number; atk: number; def: number; spAtk: number; spDef: number; spe: number };
    item?: string;
  }
): BattlePokemon {
  const hpBase = customConfig?.stats?.hp ?? pk.stats.hp;
  const hpEv = customConfig?.evs?.hp ?? 84;
  const hpIv = customConfig?.ivs?.hp ?? 31;
  const maxHp = calculateHpStat(hpBase, hpIv, hpEv);

  const stats = {
    hp: maxHp,
    atk: calculateOtherStat(customConfig?.stats?.atk ?? pk.stats.atk, customConfig?.ivs?.atk ?? 31, customConfig?.evs?.atk ?? 84),
    def: calculateOtherStat(customConfig?.stats?.def ?? pk.stats.def, customConfig?.ivs?.def ?? 31, customConfig?.evs?.def ?? 84),
    spAtk: calculateOtherStat(customConfig?.stats?.spAtk ?? pk.stats.spAtk, customConfig?.ivs?.spAtk ?? 31, customConfig?.evs?.spAtk ?? 84),
    spDef: calculateOtherStat(customConfig?.stats?.spDef ?? pk.stats.spDef, customConfig?.ivs?.spDef ?? 31, customConfig?.evs?.spDef ?? 84),
    spe: calculateOtherStat(customConfig?.stats?.spe ?? pk.stats.spe, customConfig?.ivs?.spe ?? 31, customConfig?.evs?.spe ?? 84),
  };

  // Build default procedural moves based on type if no moves are provided
  const types = customConfig?.types || pk.types;
  const defaultMoves: BattleMove[] = types.map((t, idx) => ({
    name: t.toUpperCase() + ' Attack',
    type: t,
    category: idx % 2 === 0 ? 'Physical' : 'Special',
    power: 80,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    priority: 0,
    effectType: 'damage',
  }));

  // Append generic setup move and healing move to fill 4 slots
  if (defaultMoves.length < 4) {
    defaultMoves.push({
      name: 'Dragon Dance',
      type: 'dragon',
      category: 'Status',
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      priority: 0,
      effectType: 'boost',
      effectTarget: 'self',
      effectValue: 'atk:1,spe:1',
    });
  }
  if (defaultMoves.length < 4) {
    defaultMoves.push({
      name: 'Recover',
      type: 'normal',
      category: 'Status',
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      priority: 0,
      effectType: 'heal',
      effectValue: '0.5',
    });
  }

  const moves = customConfig?.moves || defaultMoves.slice(0, 4);

  return {
    id: pk.id,
    name: pk.name,
    displayName: customConfig?.types ? `${pk.displayName} (Custom)` : pk.displayName,
    sprite: pk.sprite,
    shinySprite: pk.shinySprite,
    types,
    level: 100,
    stats,
    maxHp,
    currentHp: maxHp,
    status: 'NONE',
    statusTurns: 0,
    stages: { atk: 0, def: 0, spAtk: 0, spDef: 0, spe: 0, accuracy: 0, evasion: 0 },
    moves,
    ability: customConfig?.ability || 'Inner Focus',
    item: customConfig?.item || 'Leftovers',
    isFainted: false,
    ownerId,
    customizations: {
      originalTypes: pk.types,
      isMega: pk.isMega,
    },
  };
}

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const { pokemonList } = { pokemonList: [] as PokemonIndexItem[] }; // Context loader placeholder
  const [playerId, setPlayerId] = useState<string>('');
  const [username, setUsername] = useState<string>('Trainer');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Synced Battle Room State
  const [status, setStatus] = useState<'LOBBY' | 'TEAM_SELECT' | 'PLAYING' | 'FINISHED'>('LOBBY');
  const [mode, setMode] = useState<BattleMode>('standard');
  const [format, setFormat] = useState<'singles' | 'doubles'>('singles');
  const [p1, setP1] = useState<Player | null>(null);
  const [p2, setP2] = useState<Player | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [activeSlots, setActiveSlots] = useState<{ p1: number[]; p2: number[] }>({ p1: [0], p2: [0] });
  const [turnCount, setTurnCount] = useState<number>(1);
  const [log, setLog] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<{ sender: string; message: string; timestamp: number }[]>([]);
  const [draftOptions, setDraftOptions] = useState<string[][]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [hazards, setHazards] = useState({
    p1: { stealthRock: false, spikes: 0 },
    p2: { stealthRock: false, spikes: 0 }
  });

  const peerRef = useRef<any>(null);
  const activeConnRef = useRef<any>(null); // For P2P message delivery
  const connsMapRef = useRef<Map<string, any>>(new Map()); // Map of Peer IDs to connections
  const roomStateRef = useRef<BattleRoomState | null>(null);

  // Generate local player ID on mount
  useEffect(() => {
    let pid = localStorage.getItem('roguedex_battle_pid');
    if (!pid) {
      pid = 'player_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('roguedex_battle_pid', pid);
    }
    setPlayerId(pid);
  }, []);

  const updateLocalState = (state: BattleRoomState) => {
    roomStateRef.current = state;
    setRoomCode(state.code);
    setStatus(state.status);
    setMode(state.mode);
    setFormat(state.format);
    setP1(state.p1);
    setP2(state.p2);
    setSpectators(state.spectators);
    setActiveSlots(state.activeSlots);
    setTurnCount(state.turnCount);
    setLog(state.log);
    setChatLog(state.chatLog || []);
    setDraftOptions(state.draftOptions || []);
    setWinnerId(state.winnerId);
    setHazards(state.hazards);
  };

  // Dynamically load PeerJS in browser
  const initPeer = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (peerRef.current) {
        resolve(peerRef.current);
        return;
      }

      import('peerjs').then(({ Peer }) => {
        const peer = new Peer(playerId, {
          debug: 1,
        });

        peer.on('open', (id) => {
          peerRef.current = peer;
          setIsConnected(true);
          resolve(peer);
        });

        peer.on('connection', (conn) => {
          // Add connection to maps
          connsMapRef.current.set(conn.peer, conn);
          activeConnRef.current = conn;

          conn.on('open', () => {
            if (isHost && roomStateRef.current) {
              // Send current state to newly connected client
              conn.send({
                type: 'sync_state',
                state: roomStateRef.current,
              });
            }
          });

          conn.on('data', (data: any) => {
            handleBroadcastReceived(data, conn.peer);
          });

          conn.on('close', () => {
            connsMapRef.current.delete(conn.peer);
          });
        });

        peer.on('error', (err) => {
          console.error('PeerJS Connection Error:', err);
          reject(err);
        });
      }).catch(reject);
    });
  };

  // Broadcast state changes to guest and spectators
  const broadcastState = (state: BattleRoomState) => {
    const payload = { type: 'sync_state', state };
    for (const conn of connsMapRef.current.values()) {
      if (conn.open) {
        conn.send(payload);
      }
    }
  };

  const handleBroadcastReceived = (payload: any, senderPeerId: string) => {
    if (payload.type === 'sync_state') {
      updateLocalState(payload.state);
    }

    if (payload.type === 'chat_msg') {
      if (roomStateRef.current) {
        const nextState = { ...roomStateRef.current };
        nextState.chatLog = [...(nextState.chatLog || []), payload.msg];
        updateLocalState(nextState);
        if (isHost) {
          broadcastState(nextState);
        }
      }
    }

    // Host handles Player 2's ready and actions
    if (isHost && roomStateRef.current) {
      if (payload.type === 'guest_ready') {
        const nextState = { ...roomStateRef.current };
        nextState.p2 = payload.player;
        
        if (nextState.p1 && nextState.p1.ready && nextState.p2 && nextState.p2.ready) {
          nextState.status = 'PLAYING';
          nextState.activeSlots = { p1: [0], p2: [0] };
          nextState.log.push('Battle starts! Enter your selections.');
        }
        updateLocalState(nextState);
        broadcastState(nextState);
      }

      if (payload.type === 'submit_action') {
        const nextState = { ...roomStateRef.current };
        const exists = nextState.actionQueue.some(act => act.playerId === payload.action.playerId);
        if (!exists) {
          nextState.actionQueue.push(payload.action);
        }

        if (nextState.actionQueue.length === 2) {
          const resolved = executeTurn(nextState);
          updateLocalState(resolved);
          broadcastState(resolved);
        } else {
          updateLocalState(nextState);
          broadcastState(nextState);
        }
      }

      if (payload.type === 'draft_select') {
        const nextState = { ...roomStateRef.current };
        // Guest submits draft selection, append to player 2 team
        if (nextState.p2) {
          // Construct placeholder PokemonIndexItem
          // eslint-disable-next-line react-hooks/purity
          const randomId = Math.floor(Math.random() * 1000);
          const pkDummy: PokemonIndexItem = {
            id: randomId,
            speciesId: randomId,
            name: payload.pokemonName.toLowerCase(),
            displayName: payload.pokemonName,
            types: ['normal'],
            generation: 1,
            stats: { hp: 80, atk: 80, def: 80, spAtk: 80, spDef: 80, spe: 80, total: 480 },
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
            shinySprite: '',
            isLegendary: false, isMythical: false, isBaby: false, isStarter: false, isMega: false, isRegional: false, isUltraBeast: false, isParadox: false, isPseudoLegendary: false, isFossil: false, canEvolve: false, isFullyEvolved: true
          };
          const bPk = convertToBattlePokemon(pkDummy, senderPeerId);
          nextState.p2.team.push(bPk);
          nextState.log.push(`${nextState.p2.username} drafted a Pokémon!`);
          
          // Check draft progress
          checkDraftProgress(nextState);
        }
      }
    }
  };

  const checkDraftProgress = (state: BattleRoomState) => {
    if (!state.p1 || !state.p2) return;
    
    // Each round players draft up to 6 Pokemon
    const roundCount = Math.max(state.p1.team.length, state.p2.team.length);
    if (state.p1.team.length === state.p2.team.length) {
      if (roundCount >= 6) {
        state.status = 'PLAYING';
        state.activeSlots = { p1: [0], p2: [0] };
        state.log.push('Draft phase complete! Battle begins.');
      } else {
        state.log.push(`--- Draft Round ${roundCount + 1} ---`);
      }
    }
    updateLocalState(state);
    broadcastState(state);
  };

  // Host creates room (roomCode becomes host peer id)
  const createRoom = async (user: string, battleMode: BattleMode, battleFormat: 'singles' | 'doubles') => {
    const cleanUser = user.trim() || 'Trainer A';
    setUsername(cleanUser);
    setIsHost(true);

    try {
      const peer = await initPeer();
      const code = peer.id.toUpperCase();
      
      const initialRoom: BattleRoomState = {
        code,
        status: 'LOBBY',
        mode: battleMode,
        format: battleFormat,
        p1: { id: playerId, username: cleanUser, ready: false, team: [] },
        p2: null,
        spectators: [],
        activeSlots: { p1: [0], p2: [0] },
        turnCount: 1,
        actionQueue: [],
        log: ['Waiting for player 2 to join...'],
        chatLog: [],
        draftOptions: [],
        winnerId: null,
        hazards: {
          p1: { stealthRock: false, spikes: 0 },
          p2: { stealthRock: false, spikes: 0 }
        }
      };
      
      updateLocalState(initialRoom);
    } catch (e) {
      alert('Could not initialize PeerJS host client connection.');
    }
  };

  // Guest joins room using Host Peer ID
  const joinRoom = async (user: string, code: string) => {
    const cleanUser = user.trim() || 'Trainer B';
    const cleanCode = code.trim().toUpperCase();
    setUsername(cleanUser);
    setIsHost(false);

    try {
      const peer = await initPeer();
      const conn = peer.connect(cleanCode);
      activeConnRef.current = conn;
      connsMapRef.current.set(cleanCode, conn);

      conn.on('open', () => {
        conn.send({
          type: 'player_joined',
          username: cleanUser,
          playerId
        });
        setRoomCode(cleanCode);
      });

      conn.on('data', (data: any) => {
        handleBroadcastReceived(data, cleanCode);
      });
    } catch (e) {
      alert('Could not establish WebRTC join connection with the room code.');
    }
  };

  const setReadyWithTeam = (rawTeam: PokemonIndexItem[], customizations?: any[]) => {
    if (!roomStateRef.current) return;

    const formattedTeam = rawTeam.map((pk, idx) => {
      const custom = customizations?.[idx];
      return convertToBattlePokemon(pk, playerId, custom);
    });

    const nextState = { ...roomStateRef.current };

    if (isHost) {
      if (nextState.p1) {
        nextState.p1.team = formattedTeam;
        nextState.p1.ready = true;
        nextState.log.push(`${username} is ready!`);
      }

      if (nextState.p2 && nextState.p2.ready) {
        nextState.status = 'PLAYING';
        nextState.activeSlots = { p1: [0], p2: [0] };
        nextState.log.push('Battle starts! Select your actions.');
      }
      updateLocalState(nextState);
      broadcastState(nextState);
    } else {
      const guestPlayer: Player = {
        id: playerId,
        username,
        ready: true,
        team: formattedTeam
      };
      nextState.p2 = guestPlayer;
      updateLocalState(nextState);
      if (activeConnRef.current) {
        activeConnRef.current.send({
          type: 'guest_ready',
          player: guestPlayer
        });
      }
    }
  };

  const submitAction = (actionType: 'FIGHT' | 'SWITCH' | 'FORFEIT', valueIdx: number) => {
    if (!roomStateRef.current) return;

    const action: BattleAction = {
      playerId,
      type: actionType,
      moveIdx: actionType === 'FIGHT' ? valueIdx : undefined,
      switchSlot: actionType === 'SWITCH' ? valueIdx : undefined
    };

    const nextState = { ...roomStateRef.current };

    if (isHost) {
      const exists = nextState.actionQueue.some(act => act.playerId === playerId);
      if (!exists) {
        nextState.actionQueue.push(action);
      }

      if (nextState.actionQueue.length === 2) {
        const resolved = executeTurn(nextState);
        updateLocalState(resolved);
        broadcastState(resolved);
      } else {
        updateLocalState(nextState);
        broadcastState(nextState);
      }
    } else {
      if (activeConnRef.current) {
        activeConnRef.current.send({
          type: 'submit_action',
          action
        });
      }
      
      const exists = nextState.actionQueue.some(act => act.playerId === playerId);
      if (!exists) {
        nextState.actionQueue.push(action);
      }
      updateLocalState(nextState);
    }
  };

  const sendChatMessage = (msgText: string) => {
    if (!roomStateRef.current || !msgText.trim()) return;

    const chatMsg = {
      sender: username,
      message: msgText.trim(),
      timestamp: Date.now(),
    };

    const nextState = { ...roomStateRef.current };
    nextState.chatLog = [...(nextState.chatLog || []), chatMsg];
    updateLocalState(nextState);

    if (isHost) {
      broadcastState(nextState);
    } else if (activeConnRef.current) {
      activeConnRef.current.send({
        type: 'chat_msg',
        msg: chatMsg,
      });
    }
  };

  // Submit draft choice in Draft Mode
  const submitDraftSelection = (pokemonName: string) => {
    if (!roomStateRef.current) return;

    const nextState = { ...roomStateRef.current };
    
    if (isHost) {
      if (nextState.p1) {
        // Construct dummy Pokemon details
        const pkDummy: PokemonIndexItem = {
          id: Math.floor(Math.random() * 1000),
          speciesId: Math.floor(Math.random() * 1000),
          name: pokemonName.toLowerCase(),
          displayName: pokemonName,
          types: ['normal'],
          generation: 1,
          stats: { hp: 80, atk: 80, def: 80, spAtk: 80, spDef: 80, spe: 80, total: 480 },
          sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
          shinySprite: '',
          isLegendary: false, isMythical: false, isBaby: false, isStarter: false, isMega: false, isRegional: false, isUltraBeast: false, isParadox: false, isPseudoLegendary: false, isFossil: false, canEvolve: false, isFullyEvolved: true
        };
        const bPk = convertToBattlePokemon(pkDummy, playerId);
        nextState.p1.team.push(bPk);
        nextState.log.push(`${username} drafted ${pokemonName}!`);
        
        checkDraftProgress(nextState);
      }
    } else {
      if (activeConnRef.current) {
        activeConnRef.current.send({
          type: 'draft_select',
          pokemonName
        });
      }
    }
  };

  const leaveRoom = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setRoomCode(null);
    setStatus('LOBBY');
    setP1(null);
    setP2(null);
    setLog([]);
    setChatLog([]);
    setIsHost(false);
  };

  return (
    <BattleContext.Provider
      value={{
        roomCode,
        status,
        mode,
        format,
        p1,
        p2,
        spectators,
        activeSlots,
        turnCount,
        log,
        chatLog,
        draftOptions,
        winnerId,
        playerId,
        username,
        isHost,
        isConnected,
        createRoom,
        joinRoom,
        setReadyWithTeam,
        submitAction,
        sendChatMessage,
        submitDraftSelection,
        leaveRoom,
      }}
    >
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
}
