'use client';
import React, { useEffect, useState } from 'react';
import { usePlayerProfile, getRankForLevel, calculateLevel, ACHIEVEMENTS } from '@/context/PlayerProfileContext';
import { Trophy, Star, Shield, Medal, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { xp, level, unlockedAchievements } = usePlayerProfile();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-8 text-center text-slate-400">Loading Profile...</div>;

  const { currentLevelXp, nextLevelRequired, progress } = calculateLevel(xp);
  const rank = getRankForLevel(level);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0b0e16] min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-slate-800 flex items-center justify-center text-7xl shadow-inner border-4 border-slate-700/50">
                {rank.icon}
              </div>
              <div className="absolute -bottom-4 -right-4 bg-slate-950 border-2 border-indigo-500 text-indigo-400 font-black px-4 py-1.5 rounded-xl shadow-lg">
                LVL {level}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-black text-white mb-2">Trainer Profile</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider bg-slate-950/50 border border-slate-800 ${rank.color}`}>
                  {rank.name}
                </span>
                <span className="flex items-center gap-2 text-slate-300 font-bold bg-slate-950/50 border border-slate-800 px-4 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-amber-400" />
                  {xp.toLocaleString()} Total XP
                </span>
              </div>
              
              <div className="w-full max-w-md bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>Level {level} Progress</span>
                  <span>{currentLevelXp} / {nextLevelRequired} XP</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <Trophy className="w-8 h-8 text-fuchsia-400 mb-3" />
            <div className="text-4xl font-black text-white mb-1">{unlockedAchievements.length}</div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Badges Earned</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
            <Shield className="w-8 h-8 text-emerald-400 mb-3" />
            <div className="text-4xl font-black text-white mb-1">-</div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Drafts Won (Coming Soon)</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
            <Medal className="w-8 h-8 text-amber-400 mb-3" />
            <div className="text-4xl font-black text-white mb-1">-</div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Win Rate (Coming Soon)</div>
          </div>
        </div>

        {/* Achievements Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
            <h2 className="text-2xl font-black text-white">Trainer Achievements</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(ACHIEVEMENTS).map(ach => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              
              return (
                <div 
                  key={ach.id} 
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isUnlocked 
                      ? 'bg-slate-800/80 border-slate-700 hover:border-fuchsia-500/50' 
                      : 'bg-slate-900/30 border-slate-800/50 opacity-60 grayscale'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl ${
                      isUnlocked ? 'bg-slate-950 shadow-inner' : 'bg-slate-950/50'
                    }`}>
                      {isUnlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-600" />}
                    </div>
                    <div>
                      <h3 className={`font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {ach.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {ach.description}
                      </p>
                      {isUnlocked && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 w-fit px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3" /> +{ach.xpReward} XP
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
