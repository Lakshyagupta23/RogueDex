'use client';
import { usePlayerProfile, getRankForLevel, calculateLevel } from '@/context/PlayerProfileContext';
import { Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProfileWidget({ collapsed = false }: { collapsed?: boolean }) {
  const { xp, level, unlockedAchievements } = usePlayerProfile();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-14"></div>; // Skeleton

  const { progress } = calculateLevel(xp);
  const rank = getRankForLevel(level);

  if (collapsed) {
    return (
      <Link href="/profile" className="flex justify-center w-full relative group">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl shadow-inner relative overflow-hidden flex-shrink-0 cursor-pointer">
          {rank.icon}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950">
            <div className="h-full bg-indigo-500" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <div className="absolute left-16 bg-[#0f1420] border border-slate-800 rounded px-3 py-2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 shadow-xl whitespace-nowrap">
          <div className="flex flex-col gap-1">
            <span className={rank.color}>{rank.name} (Lv.{level})</span>
            <span className="text-slate-400">{xp} XP • {unlockedAchievements.length} Badges</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/profile" className="flex items-center gap-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 p-2 rounded-xl transition-colors cursor-pointer w-full sm:w-auto">
      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl shadow-inner relative overflow-hidden flex-shrink-0">
        {rank.icon}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950">
          <div className="h-full bg-indigo-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <div className="flex flex-col flex-grow sm:flex-grow-0 pr-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase tracking-wider ${rank.color}`}>{rank.name}</span>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded-md">LVL {level}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {xp} XP</span>
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-fuchsia-400" /> {unlockedAchievements.length}</span>
        </div>
      </div>
    </Link>
  );
}
