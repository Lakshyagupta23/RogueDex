'use client';

import React, { useMemo } from 'react';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { classifyRole, getSpeedTier, SPEED_TIERS, SpeedTier } from '@/lib/pokemon/recommendation';
import { Zap, Shield, Sword, Gauge, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { TYPE_COLORS } from '@/lib/pokemon/constants';

interface SpeedAndRoleBreakdownProps {
  team: (PokemonIndexItem | null)[];
}

export default function SpeedAndRoleBreakdown({ team }: SpeedAndRoleBreakdownProps) {
  const validTeam = useMemo(() => team.filter((p): p is PokemonIndexItem => p !== null), [team]);

  // Speed Calculations
  const speedStats = useMemo(() => {
    if (validTeam.length === 0) return { avg: 0, min: 0, max: 0, members: [] };

    const members = validTeam.map(p => ({
      pokemon: p,
      speed: p.stats.spe,
      tier: getSpeedTier(p.stats.spe),
      role: classifyRole(p),
    })).sort((a, b) => b.speed - a.speed);

    const sum = members.reduce((acc, m) => acc + m.speed, 0);
    const avg = Math.round(sum / members.length);
    const min = members[members.length - 1].speed;
    const max = members[0].speed;

    return { avg, min, max, members };
  }, [validTeam]);

  // Role Breakdown & Balance
  const roleAnalysis = useMemo(() => {
    let physicalAttackers = 0;
    let specialAttackers = 0;
    let physicalWalls = 0;
    let specialWalls = 0;
    let speedDemons = 0;
    let pivots = 0;

    for (const member of validTeam) {
      const { atk, def, spAtk, spDef, spe } = member.stats;
      if (spe >= 110) speedDemons++;
      if (atk >= 100) physicalAttackers++;
      if (spAtk >= 100) specialAttackers++;
      if (def >= 100) physicalWalls++;
      if (spDef >= 100) specialWalls++;
      if (classifyRole(member) === 'Bulky Pivot') pivots++;
    }

    const advice: { type: 'warning' | 'success'; message: string }[] = [];

    if (validTeam.length >= 3) {
      if (physicalAttackers > 0 && specialAttackers === 0) {
        advice.push({
          type: 'warning',
          message: 'Heavily Physical: Vulnerable to physical walls like Corviknight or Dondozo.',
        });
      } else if (specialAttackers > 0 && physicalAttackers === 0) {
        advice.push({
          type: 'warning',
          message: 'Heavily Special: Vulnerable to special sponges like Blissey or Clodsire.',
        });
      } else if (physicalAttackers > 0 && specialAttackers > 0) {
        advice.push({
          type: 'success',
          message: 'Balanced Offense: Great mix of Physical and Special damage threats.',
        });
      }

      if (physicalWalls === 0 && specialWalls === 0 && pivots === 0) {
        advice.push({
          type: 'warning',
          message: 'Glass Cannon squad: Lacks a defensive pivot to safely switch in.',
        });
      }

      if (speedDemons === 0 && speedStats.avg < 80) {
        advice.push({
          type: 'warning',
          message: 'Low Speed Tier: Team risks getting outsped by opposing hyper-offense.',
        });
      }
    }

    return {
      physicalAttackers,
      specialAttackers,
      physicalWalls,
      specialWalls,
      speedDemons,
      pivots,
      advice,
    };
  }, [validTeam, speedStats]);

  if (validTeam.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Speed Tiers Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-850 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-white">Speed Tier Distribution</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Team Avg:</span>
            <span className="font-extrabold font-mono text-pink-400 text-sm">{speedStats.avg} Spe</span>
          </div>
        </div>

        {/* Speed Bars */}
        <div className="flex flex-col gap-2.5">
          {speedStats.members.map(({ pokemon, speed, tier }) => {
            const pct = Math.min(100, Math.round((speed / 160) * 100));
            const primaryColor = TYPE_COLORS[pokemon.types[0]] || '#3b82f6';

            return (
              <div key={pokemon.id} className="flex items-center gap-3 text-xs">
                {/* Pokemon identity */}
                <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0">
                  <img src={pokemon.sprite} alt={pokemon.displayName} className="w-6 h-6 object-contain" />
                  <span className="font-semibold text-slate-200 truncate text-[11px]">{pokemon.displayName}</span>
                </div>

                {/* Progress bar */}
                <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800 relative">
                  <div
                    style={{ width: `${pct}%`, backgroundColor: tier.color }}
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                  />
                </div>

                {/* Speed number & tier label */}
                <div className="w-16 shrink-0 flex items-center justify-end gap-1 font-mono">
                  <span className="font-bold text-white">{speed}</span>
                  <span className="text-[10px] text-slate-500 font-sans">Spe</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900 text-[10px] font-bold">
          {Object.values(SPEED_TIERS).map(t => (
            <span key={t.tier} className="flex items-center gap-1.5 text-slate-400">
              <span style={{ backgroundColor: t.color }} className="w-2 h-2 rounded-full" />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Role Breakdown Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-850 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Role & Damage Profile</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Competitive Split
          </span>
        </div>

        {/* Role Cards List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {speedStats.members.map(({ pokemon, role }) => (
            <div
              key={pokemon.id}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-850 flex flex-col items-center text-center gap-1"
            >
              <img src={pokemon.sprite} alt={pokemon.displayName} className="w-8 h-8 object-contain" />
              <span className="text-[10px] font-bold text-slate-200 truncate w-full">{pokemon.displayName}</span>
              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded-md truncate w-full">
                {role}
              </span>
            </div>
          ))}
        </div>

        {/* Split Stats */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-900 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Physical</span>
            <span className="text-base font-black text-rose-400 font-mono">{roleAnalysis.physicalAttackers}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Special</span>
            <span className="text-base font-black text-blue-400 font-mono">{roleAnalysis.specialAttackers}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Defensive</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {roleAnalysis.physicalWalls + roleAnalysis.specialWalls + roleAnalysis.pivots}
            </span>
          </div>
        </div>

        {/* Strategic Advice */}
        {roleAnalysis.advice.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {roleAnalysis.advice.map((adv, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                  adv.type === 'warning'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                }`}
              >
                {adv.type === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                )}
                <span className="text-[11px] leading-tight">{adv.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
