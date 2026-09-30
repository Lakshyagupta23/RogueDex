import { BattlePokemon, BattleMove, BattleAction, BattleRoomState, StatusCondition } from './types';

// Standard Gen 6-9 Type Effectiveness Chart
export const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Calculate Type Modifier for an attack against a defender's types
export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let modifier = 1;
  const attackType = moveType.toLowerCase();
  for (const defType of defenderTypes) {
    const target = defType.toLowerCase();
    if (TYPE_EFFECTIVENESS[attackType] && TYPE_EFFECTIVENESS[attackType][target] !== undefined) {
      modifier *= TYPE_EFFECTIVENESS[attackType][target];
    }
  }
  return modifier;
}

// Get stat multiplier based on stage (-6 to +6)
export function getStageMultiplier(stage: number): number {
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 - stage);
  }
}

// Get speed value incorporating Paralysis and stages
export function getModifiedSpeed(pk: BattlePokemon): number {
  let baseSpeed = pk.stats.spe;
  const mult = getStageMultiplier(pk.stages.spe);
  baseSpeed = Math.floor(baseSpeed * mult);
  
  if (pk.status === 'PAR') {
    baseSpeed = Math.floor(baseSpeed * 0.5); // Paralysis halves speed
  }
  return baseSpeed;
}

// Get modified attack or defense stats
export function getModifiedStat(
  pk: BattlePokemon,
  stat: 'atk' | 'def' | 'spAtk' | 'spDef'
): number {
  let base = pk.stats[stat];
  const mult = getStageMultiplier(pk.stages[stat]);
  base = Math.floor(base * mult);
  
  // Burn halves physical attack power
  if (stat === 'atk' && pk.status === 'BRN') {
    base = Math.floor(base * 0.5);
  }
  return base;
}

// Core Damage Calculator
export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove
): { damage: number; effectiveness: number; isCrit: boolean } {
  if (move.power <= 0 || move.category === 'Status') {
    return { damage: 0, effectiveness: 1, isCrit: false };
  }

  // 1. Calculate Base Damage
  const level = attacker.level;
  const isPhysical = move.category === 'Physical';
  const atk = isPhysical ? getModifiedStat(attacker, 'atk') : getModifiedStat(attacker, 'spAtk');
  const def = isPhysical ? getModifiedStat(defender, 'def') : getModifiedStat(defender, 'spDef');

  // Critical hit check (6.25% standard chance)
  const isCrit = Math.random() < 0.0625;

  let baseDamage = Math.floor(
    (Math.floor((2 * level) / 5 + 2) * move.power * atk) / def / 50 + 2
  );

  // Apply critical hit multiplier (1.5x)
  if (isCrit) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  // 2. Modifiers
  // Type Effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  baseDamage = Math.floor(baseDamage * effectiveness);

  // Same Type Attack Boost (STAB) (1.5x)
  const isStab = attacker.types.includes(move.type.toLowerCase());
  if (isStab) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  // Random factor between 0.85 and 1.0
  const randomFactor = 0.85 + Math.random() * 0.15;
  let finalDamage = Math.floor(baseDamage * randomFactor);

  // Ensure minimum 1 damage if move hits and is not immune
  if (finalDamage <= 0 && effectiveness > 0) {
    finalDamage = 1;
  }

  return { damage: finalDamage, effectiveness, isCrit };
}

// Sort actions based on priority, switch precedence, and speed tier
export function sortActions(
  actions: BattleAction[],
  room: BattleRoomState
): BattleAction[] {
  return [...actions].sort((a, b) => {
    // 1. Resolve switch actions first
    const aIsSwitch = a.type === 'SWITCH';
    const bIsSwitch = b.type === 'SWITCH';
    if (aIsSwitch && !bIsSwitch) return -1;
    if (!aIsSwitch && bIsSwitch) return 1;

    // If both are switches, sort by speed of switching Pokemon (optional, let's keep them equal or speed)
    if (aIsSwitch && bIsSwitch) return 0;

    // 2. Compare priority values
    const aP1 = a.playerId === room.p1?.id;
    const aTeam = aP1 ? room.p1!.team : room.p2!.team;
    const aActiveIdx = aP1 ? room.activeSlots.p1[0] : room.activeSlots.p2[0];
    const aPokemon = aTeam[aActiveIdx];
    const aMove = aPokemon.moves[a.moveIdx!];

    const bP1 = b.playerId === room.p1?.id;
    const bTeam = bP1 ? room.p1!.team : room.p2!.team;
    const bActiveIdx = bP1 ? room.activeSlots.p1[0] : room.activeSlots.p2[0];
    const bPokemon = bTeam[bActiveIdx];
    const bMove = bPokemon.moves[b.moveIdx!];

    const aPriority = aMove?.priority || 0;
    const bPriority = bMove?.priority || 0;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority goes first
    }

    // 3. Compare modified Speeds
    const aSpeed = getModifiedSpeed(aPokemon);
    const bSpeed = getModifiedSpeed(bPokemon);

    if (aSpeed !== bSpeed) {
      return bSpeed - aSpeed; // Faster speed goes first
    }

    // 4. Random tie-breaker
    return Math.random() - 0.5;
  });
}

// Apply entry hazard damage to a switching-in Pokémon
export function applyHazards(
  pokemon: BattlePokemon,
  hasStealthRock: boolean,
  spikesLayers: number,
  logs: string[]
): number {
  let damage = 0;
  if (pokemon.isFainted) return 0;

  // Stealth Rock damage (based on type effectiveness to Rock)
  if (hasStealthRock) {
    const rockEffectiveness = getTypeEffectiveness('rock', pokemon.types);
    const fraction = 0.125 * rockEffectiveness; // 1/8 base
    const srDamage = Math.floor(pokemon.maxHp * fraction);
    if (srDamage > 0) {
      damage += srDamage;
      logs.push(`${pokemon.displayName} was hurt by the Stealth Rocks!`);
    }
  }

  // Spikes damage (depends on layers, ignores Flying/Levitate types)
  const isGrounded = !pokemon.types.includes('flying') && pokemon.ability.toLowerCase() !== 'levitate';
  if (spikesLayers > 0 && isGrounded) {
    let fraction = 0;
    if (spikesLayers === 1) fraction = 1 / 8;
    else if (spikesLayers === 2) fraction = 1 / 6;
    else if (spikesLayers >= 3) fraction = 1 / 4;

    const spikesDamage = Math.floor(pokemon.maxHp * fraction);
    if (spikesDamage > 0) {
      damage += spikesDamage;
      logs.push(`${pokemon.displayName} was hurt by Spikes!`);
    }
  }

  return damage;
}

// Execute a single Battle Action
export function executeAction(
  action: BattleAction,
  room: BattleRoomState
): void {
  const isP1 = action.playerId === room.p1?.id;
  const myPlayer = isP1 ? room.p1! : room.p2!;
  const oppPlayer = isP1 ? room.p2! : room.p1!;
  
  const myActiveIdx = isP1 ? room.activeSlots.p1[0] : room.activeSlots.p2[0];
  const oppActiveIdx = isP1 ? room.activeSlots.p2[0] : room.activeSlots.p1[0];

  const myPokemon = myPlayer.team[myActiveIdx];
  const oppPokemon = oppPlayer.team[oppActiveIdx];

  // 1. SWITCH Action
  if (action.type === 'SWITCH') {
    const nextSlot = action.switchSlot!;
    if (nextSlot === myActiveIdx || myPlayer.team[nextSlot].isFainted) return;

    room.log.push(`${myPlayer.username} withdrew ${myPokemon.displayName}!`);
    
    // Clear boost stages of switched out Pokémon
    myPokemon.stages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spe: 0, accuracy: 0, evasion: 0 };
    if (myPokemon.status === 'TOX') {
      myPokemon.statusTurns = 0; // Toxic multiplier resets on switch
    }

    // Set new active slot
    if (isP1) {
      room.activeSlots.p1[0] = nextSlot;
    } else {
      room.activeSlots.p2[0] = nextSlot;
    }

    const newPokemon = myPlayer.team[nextSlot];
    room.log.push(`${myPlayer.username} sent out ${newPokemon.displayName}!`);

    // Apply Entry Hazards
    const myHazards = isP1 ? room.hazards.p1 : room.hazards.p2;
    const hazardDamage = applyHazards(newPokemon, myHazards.stealthRock, myHazards.spikes, room.log);
    if (hazardDamage > 0) {
      newPokemon.currentHp = Math.max(0, newPokemon.currentHp - hazardDamage);
      if (newPokemon.currentHp === 0) {
        newPokemon.isFainted = true;
        room.log.push(`${newPokemon.displayName} fainted from hazard damage!`);
      }
    }
    return;
  }

  // 2. FIGHT Action
  if (action.type === 'FIGHT') {
    if (myPokemon.isFainted) return; // Can't attack if already fainted

    const move = myPokemon.moves[action.moveIdx!];
    if (!move) return;

    // Check status condition (paralysis chance, sleep duration, freeze thaw)
    if (myPokemon.status === 'SLP') {
      myPokemon.statusTurns++;
      // Sleep lasts 1-3 turns
      if (myPokemon.statusTurns > 2 || (myPokemon.statusTurns > 1 && Math.random() < 0.5)) {
        myPokemon.status = 'NONE';
        myPokemon.statusTurns = 0;
        room.log.push(`${myPokemon.displayName} woke up!`);
      } else {
        room.log.push(`${myPokemon.displayName} is fast asleep.`);
        return;
      }
    }

    if (myPokemon.status === 'FRZ') {
      // 20% chance to thaw out each turn
      if (Math.random() < 0.2) {
        myPokemon.status = 'NONE';
        room.log.push(`${myPokemon.displayName} thawed out!`);
      } else {
        room.log.push(`${myPokemon.displayName} is frozen solid!`);
        return;
      }
    }

    if (myPokemon.status === 'PAR') {
      // 25% chance to be fully paralyzed
      if (Math.random() < 0.25) {
        room.log.push(`${myPokemon.displayName} is fully paralyzed! It cannot move.`);
        return;
      }
    }

    room.log.push(`${myPokemon.displayName} used ${move.name}!`);

    // Accuracy Check
    const accuracy = move.accuracy;
    if (accuracy < 100 && Math.random() * 100 > accuracy) {
      room.log.push(`The attack missed!`);
      return;
    }

    // Immune Check
    const effectiveness = getTypeEffectiveness(move.type, oppPokemon.types);
    if (effectiveness === 0) {
      room.log.push(`It doesn't affect ${oppPokemon.displayName}...`);
      return;
    }

    // Apply Damage
    if (move.category !== 'Status') {
      const { damage, effectiveness: eff, isCrit } = calculateDamage(myPokemon, oppPokemon, move);
      oppPokemon.currentHp = Math.max(0, oppPokemon.currentHp - damage);

      if (isCrit) room.log.push(`A critical hit!`);
      if (eff > 1) room.log.push(`It's super effective!`);
      if (eff > 0 && eff < 1) room.log.push(`It's not very effective...`);

      room.log.push(`${oppPokemon.displayName} lost ${Math.round((damage / oppPokemon.maxHp) * 100)}% of its health!`);

      if (oppPokemon.currentHp === 0) {
        oppPokemon.isFainted = true;
        room.log.push(`${oppPokemon.displayName} fainted!`);
        return;
      }
    }

    // Apply Move Effects (Status, Boosts, Hazards, Healing)
    if (move.effectType && move.effectValue) {
      // 1. Status effects (Toxic, Burn, Paralysis, Sleep)
      if (move.effectType === 'status' && oppPokemon.status === 'NONE') {
        const cond = move.effectValue as StatusCondition;
        oppPokemon.status = cond;
        oppPokemon.statusTurns = 0;
        room.log.push(`${oppPokemon.displayName} was afflicted with ${cond}!`);
      }
      
      // 2. Stat boosts (e.g. "atk:+2", "spe:+1")
      if (move.effectType === 'boost') {
        const target = move.effectTarget === 'opponent' ? oppPokemon : myPokemon;
        const [stat, valStr] = move.effectValue.split(':');
        const val = parseInt(valStr, 10);
        
        const statKey = stat as keyof typeof target.stages;
        if (target.stages[statKey] !== undefined) {
          const currentStage = target.stages[statKey];
          const newStage = Math.max(-6, Math.min(6, currentStage + val));
          target.stages[statKey] = newStage;

          const change = newStage - currentStage;
          if (change > 0) {
            room.log.push(`${target.displayName}'s ${stat.toUpperCase()} rose!`);
          } else if (change < 0) {
            room.log.push(`${target.displayName}'s ${stat.toUpperCase()} fell!`);
          }
        }
      }

      // 3. Entry Hazards (Stealth Rock, Spikes)
      if (move.effectType === 'hazard') {
        const oppHazards = isP1 ? room.hazards.p2 : room.hazards.p1;
        if (move.effectValue === 'stealth-rock') {
          if (!oppHazards.stealthRock) {
            oppHazards.stealthRock = true;
            room.log.push(`Pointed stones float in the air around the opponent's side!`);
          } else {
            room.log.push(`Stealth Rocks are already set up.`);
          }
        } else if (move.effectValue === 'spikes') {
          if (oppHazards.spikes < 3) {
            oppHazards.spikes++;
            room.log.push(`Spikes were scattered around the opponent's side!`);
          } else {
            room.log.push(`Spikes can't be scattered any further.`);
          }
        }
      }

      // 4. Healing
      if (move.effectType === 'heal' && myPokemon.currentHp < myPokemon.maxHp) {
        const fraction = parseFloat(move.effectValue) || 0.5;
        const healAmt = Math.floor(myPokemon.maxHp * fraction);
        myPokemon.currentHp = Math.min(myPokemon.maxHp, myPokemon.currentHp + healAmt);
        room.log.push(`${myPokemon.displayName} recovered some health.`);
      }
    }
  }
}

// Process End-of-Turn ticks (Status ticks, weather, check faints)
export function processEndOfTurn(room: BattleRoomState): void {
  const tickStatus = (pk: BattlePokemon, playerUsername: string) => {
    if (pk.isFainted) return;

    if (pk.status === 'BRN') {
      const burnDmg = Math.max(1, Math.floor(pk.maxHp / 16));
      pk.currentHp = Math.max(0, pk.currentHp - burnDmg);
      room.log.push(`${pk.displayName} is hurt by its burn!`);
    } else if (pk.status === 'TOX') {
      pk.statusTurns++;
      const toxicDmg = Math.max(1, Math.floor((pk.maxHp * pk.statusTurns) / 16));
      pk.currentHp = Math.max(0, pk.currentHp - toxicDmg);
      room.log.push(`${pk.displayName} is hurt by poison!`);
    }

    if (pk.currentHp === 0) {
      pk.isFainted = true;
      room.log.push(`${pk.displayName} fainted to status damage!`);
    }
  };

  // 1. Tick status damage for both active Pokémon
  if (room.p1) {
    const activeP1 = room.p1.team[room.activeSlots.p1[0]];
    if (activeP1) tickStatus(activeP1, room.p1.username);
  }
  if (room.p2) {
    const activeP2 = room.p2.team[room.activeSlots.p2[0]];
    if (activeP2) tickStatus(activeP2, room.p2.username);
  }

  // 2. Increment turn counter and clear queue
  room.turnCount++;
  room.actionQueue = [];

  // 3. Game Over Checks
  const p1AllFainted = room.p1?.team.every(pk => pk.isFainted) || false;
  const p2AllFainted = room.p2?.team.every(pk => pk.isFainted) || false;

  if (p1AllFainted && p2AllFainted) {
    room.status = 'FINISHED';
    room.winnerId = 'TIE';
    room.log.push(`All Pokémon on both sides have fainted! It's a draw!`);
  } else if (p1AllFainted) {
    room.status = 'FINISHED';
    room.winnerId = room.p2?.id || null;
    room.log.push(`${room.p2?.username} wins the battle!`);
  } else if (p2AllFainted) {
    room.status = 'FINISHED';
    room.winnerId = room.p1?.id || null;
    room.log.push(`${room.p1?.username} wins the battle!`);
  }
}

// Run a complete turn by sorting actions and executing them sequentially
export function executeTurn(room: BattleRoomState): BattleRoomState {
  if (room.status !== 'PLAYING') return room;

  // Clone to avoid side-effect mutations directly during rendering
  const nextRoom = JSON.parse(JSON.stringify(room)) as BattleRoomState;

  nextRoom.log.push(`--- Turn ${nextRoom.turnCount} ---`);

  // Sort actions (Switch runs first, then higher Priority, then Speed)
  const sorted = sortActions(nextRoom.actionQueue, nextRoom);

  // Execute first action
  if (sorted[0]) {
    executeAction(sorted[0], nextRoom);
  }

  // Execute second action (if first opponent didn't cause a fight interruption/faint)
  if (sorted[1]) {
    executeAction(sorted[1], nextRoom);
  }

  // Run end-of-turn status ticks and game over conditions
  processEndOfTurn(nextRoom);

  return nextRoom;
}
