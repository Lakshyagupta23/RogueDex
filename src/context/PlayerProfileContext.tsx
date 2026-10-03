'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_draft: { id: 'first_draft', name: 'First Steps', description: 'Complete your first draft.', icon: '🔰', xpReward: 200 },
  legendary_hunter: { id: 'legendary_hunter', name: 'Legendary Hunter', description: 'Draft a Legendary or Mythical Pokemon.', icon: '🌟', xpReward: 150 },
  nuzlocke_survivor: { id: 'nuzlocke_survivor', name: 'Nuzlocke Survivor', description: 'Survive a Nuzlocke assassination attempt.', icon: '🛡️', xpReward: 300 },
  heist_master: { id: 'heist_master', name: 'Heist Master', description: 'Steal an opponent\'s Pokemon in Heist mode.', icon: '🥷', xpReward: 250 },
  monotype_expert: { id: 'monotype_expert', name: 'Monotype Expert', description: 'Complete a Forced Monotype draft.', icon: '🔥', xpReward: 200 },
  wtp_streak: { id: 'wtp_streak', name: 'Trivia Master', description: 'Get a streak of 10 in Who\'s That Pokemon.', icon: '🧠', xpReward: 400 },
};

export const RANKS = [
  { level: 1, name: 'Rookie Trainer', icon: '👦', color: 'text-slate-400', badge: '/badges/basic.png', requiredXp: 0 },
  { level: 5, name: 'Gym Challenger', icon: '⚡', color: 'text-blue-400', badge: '/badges/cascade.png', requiredXp: 1000 },
  { level: 10, name: 'Gym Leader', icon: '🏅', color: 'text-emerald-400', badge: '/badges/earth.png', requiredXp: 3000 },
  { level: 20, name: 'Elite Four', icon: '👑', color: 'text-purple-400', badge: '/badges/elite.png', requiredXp: 8000 },
  { level: 35, name: 'Champion', icon: '🏆', color: 'text-amber-400', badge: '/badges/champion.png', requiredXp: 15000 },
  { level: 50, name: 'Pokemon Master', icon: '⭐', color: 'text-rose-500', badge: '/badges/master.png', requiredXp: 30000 },
];

export const getRankForLevel = (level: number) => {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.level) currentRank = rank;
    else break;
  }
  return currentRank;
};

export const calculateLevel = (xp: number) => {
  // Base formula: level = floor(sqrt(xp) / 3) + 1
  // This means: Lvl 1 = 0, Lvl 5 = 144, Lvl 10 = 729... wait let's use fixed XP per level.
  // 100 XP per level for first 10, then scaling up.
  // Let's keep it simple: 200 XP per level flat for now, or simple quadratic.
  let level = 1;
  let required = 200;
  let totalRequired = 0;
  
  while (xp >= totalRequired + required) {
    totalRequired += required;
    level++;
    required = 200 + (level * 50); // XP requirement grows by 50 each level
  }
  
  const currentLevelXp = xp - totalRequired;
  const nextLevelRequired = required;
  const progress = currentLevelXp / nextLevelRequired;
  
  return { level, currentLevelXp, nextLevelRequired, progress, totalRequired };
};

interface PlayerState {
  xp: number;
  level: number;
  matchesPlayed: number;
  unlockedAchievements: string[];
  justLeveledUpTo: number | null;
  justUnlockedAchievements: Achievement[];
}

interface PlayerProfileContextType extends PlayerState {
  addXp: (amount: number, source?: string) => void;
  unlockAchievement: (id: string) => void;
  clearLevelUpAnimation: () => void;
  clearAchievementAnimation: (id: string) => void;
}

const PlayerProfileContext = createContext<PlayerProfileContextType | undefined>(undefined);

export function PlayerProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    xp: 0,
    level: 1,
    matchesPlayed: 0,
    unlockedAchievements: [],
    justLeveledUpTo: null,
    justUnlockedAchievements: [],
  });
  
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('roguedex_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const { level } = calculateLevel(parsed.xp || 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setTimeout(() => setState({
          xp: parsed.xp || 0,
          level: level,
          matchesPlayed: parsed.matchesPlayed || 0,
          unlockedAchievements: parsed.unlockedAchievements || [],
          justLeveledUpTo: null,
          justUnlockedAchievements: [],
        }), 0);
      } catch (e) {
        console.error('Failed to parse player profile', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('roguedex_profile', JSON.stringify({
        xp: state.xp,
        matchesPlayed: state.matchesPlayed,
        unlockedAchievements: state.unlockedAchievements,
      }));
    }
  }, [state.xp, state.matchesPlayed, state.unlockedAchievements, isLoaded]);

  const addXp = useCallback((amount: number, source?: string) => {
    if (amount <= 0) return;
    
    setState(prev => {
      const newXp = prev.xp + amount;
      const oldLevelData = calculateLevel(prev.xp);
      const newLevelData = calculateLevel(newXp);
      
      let leveledUpTo = null;
      if (newLevelData.level > oldLevelData.level) {
        leveledUpTo = newLevelData.level;
      }
      
      return {
        ...prev,
        xp: newXp,
        level: newLevelData.level,
        justLeveledUpTo: leveledUpTo || prev.justLeveledUpTo,
      };
    });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    const ach = ACHIEVEMENTS[id];
    if (!ach) return;
    
    setState(prev => {
      if (prev.unlockedAchievements.includes(id)) return prev;
      
      return {
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, id],
        justUnlockedAchievements: [...prev.justUnlockedAchievements, ach],
      };
    });
    
    // Also award XP
    addXp(ach.xpReward, `Achievement: ${ach.name}`);
  }, [addXp]);

  const clearLevelUpAnimation = useCallback(() => {
    setState(prev => ({ ...prev, justLeveledUpTo: null }));
  }, []);

  const clearAchievementAnimation = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      justUnlockedAchievements: prev.justUnlockedAchievements.filter(a => a.id !== id)
    }));
  }, []);

  return (
    <PlayerProfileContext.Provider value={{
      ...state,
      addXp,
      unlockAchievement,
      clearLevelUpAnimation,
      clearAchievementAnimation
    }}>
      {children}
    </PlayerProfileContext.Provider>
  );
}

export function usePlayerProfile() {
  const context = useContext(PlayerProfileContext);
  if (context === undefined) {
    throw new Error('usePlayerProfile must be used within a PlayerProfileProvider');
  }
  return context;
}
