'use client';

import React, { useState, useMemo } from 'react';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { TYPE_CHART, getDefensiveEffectiveness } from '@/lib/pokemon/analysis';
import { TYPE_COLORS } from '@/lib/pokemon/constants';
import { ShieldAlert, ShieldCheck, Zap, Info, ChevronRight, X } from 'lucide-react';

interface DefensiveHeatmapProps {
  team: (PokemonIndexItem | null)[];
  title?: string;
  compact?: boolean;
}

interface TypeThreatData {
  type: string;
  weakCount: number;
  weakMembers: { name: string; mult: number; sprite: string }[];
  resistCount: number;
  resistMembers: { name: string; mult: number; sprite: string }[];
  immuneCount: number;
  immuneMembers: { name: string; sprite: string }[];
  netThreat: number; // positive = threat, negative = resistance
}

export default function DefensiveHeatmap({ team, title = 'Defensive Weakness Heatmap', compact = false }: DefensiveHeatmapProps) {
  const [selectedTypeData, setSelectedTypeData] = useState<TypeThreatData | null>(null);

  const validTeam = useMemo(() => team.filter((p): p is PokemonIndexItem => p !== null), [team]);
  const allTypes = useMemo(() => Object.keys(TYPE_CHART), []);

  const heatmapData = useMemo(() => {
    return allTypes.map(attackType => {
      let weakCount = 0;
      let resistCount = 0;
      let immuneCount = 0;
      const weakMembers: { name: string; mult: number; sprite: string }[] = [];
      const resistMembers: { name: string; mult: number; sprite: string }[] = [];
      const immuneMembers: { name: string; sprite: string }[] = [];

      for (const member of validTeam) {
        const eff = getDefensiveEffectiveness(member.types);
        const mult = eff[attackType] ?? 1;

        if (mult === 0) {
          immuneCount++;
          immuneMembers.push({ name: member.displayName, sprite: member.sprite });
        } else if (mult > 1) {
          weakCount++;
          weakMembers.push({ name: member.displayName, mult, sprite: member.sprite });
        } else if (mult < 1) {
          resistCount++;
          resistMembers.push({ name: member.displayName, mult, sprite: member.sprite });
        }
      }

      const netThreat = weakCount - resistCount - (immuneCount * 1.5);

      return {
        type: attackType,
        weakCount,
        weakMembers,
        resistCount,
        resistMembers,
        immuneCount,
        immuneMembers,
        netThreat,
      };
    });
  }, [validTeam, allTypes]);

  // Summary counts
  const criticalCount = heatmapData.filter(d => d.weakCount >= 3).length;
  const vulnerableCount = heatmapData.filter(d => d.weakCount === 2).length;

  if (validTeam.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-slate-850 text-center text-slate-500 text-xs">
        Add Pokémon to your team to inspect defensive vulnerabilities.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-850 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {title}
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-time defensive threats across all 18 Pokémon types for your current squad ({validTeam.length}/6).
          </p>
        </div>

        {/* Threat summary badges */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
              ⚠️ {criticalCount} Critical Threats
            </span>
          )}
          {vulnerableCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {vulnerableCount} Vulnerabilities
            </span>
          )}
          {criticalCount === 0 && vulnerableCount === 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Well-Balanced Squad
            </span>
          )}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
        {heatmapData.map(item => {
          const typeColor = TYPE_COLORS[item.type] || '#64748b';
          const isCritical = item.weakCount >= 3;
          const isVulnerable = item.weakCount === 2;
          const isImmune = item.immuneCount > 0;
          const isWellResisted = item.resistCount >= 2 && item.weakCount <= 1;

          let badgeColorClass = 'bg-slate-900/60 border-slate-800 text-slate-400';
          let statusText = 'Neutral';

          if (isCritical) {
            badgeColorClass = 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse';
            statusText = `⚠️ ${item.weakCount}x Weak`;
          } else if (isVulnerable) {
            badgeColorClass = 'bg-amber-500/15 border-amber-500/50 text-amber-300';
            statusText = `${item.weakCount}x Weak`;
          } else if (isImmune) {
            badgeColorClass = 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300';
            statusText = `⚡ ${item.immuneCount} Immune`;
          } else if (isWellResisted) {
            badgeColorClass = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
            statusText = `🛡️ ${item.resistCount} Resists`;
          }

          return (
            <button
              key={item.type}
              type="button"
              onClick={() => setSelectedTypeData(item)}
              className={`p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer hover:scale-102 ${badgeColorClass}`}
            >
              <div className="flex items-center gap-1 mb-1">
                <span
                  style={{ backgroundColor: typeColor }}
                  className="w-2 h-2 rounded-full inline-block"
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                  {item.type}
                </span>
              </div>

              <span className="text-[9px] font-extrabold truncate w-full">
                {statusText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Type Detail Modal / Drawer */}
      {selectedTypeData && (
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: TYPE_COLORS[selectedTypeData.type] }}
                className="w-3 h-3 rounded-full"
              />
              <span className="text-xs font-bold uppercase text-white tracking-wider">
                Defending Against {selectedTypeData.type.toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTypeData(null)}
              className="text-slate-500 hover:text-white p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Weaknesses */}
            <div className="flex flex-col gap-1.5 p-2 bg-rose-500/5 rounded-lg border border-rose-500/20">
              <span className="text-[10px] font-bold uppercase text-rose-400">
                Weak ({selectedTypeData.weakMembers.length})
              </span>
              {selectedTypeData.weakMembers.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {selectedTypeData.weakMembers.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <img src={m.sprite} alt={m.name} className="w-5 h-5 object-contain" />
                      <span className="text-slate-200 text-[11px] truncate">{m.name}</span>
                      <span className="ml-auto text-[10px] font-bold text-rose-400 font-mono">{m.mult}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 italic">None</span>
              )}
            </div>

            {/* Resistances */}
            <div className="flex flex-col gap-1.5 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <span className="text-[10px] font-bold uppercase text-emerald-400">
                Resist ({selectedTypeData.resistMembers.length})
              </span>
              {selectedTypeData.resistMembers.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {selectedTypeData.resistMembers.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <img src={m.sprite} alt={m.name} className="w-5 h-5 object-contain" />
                      <span className="text-slate-200 text-[11px] truncate">{m.name}</span>
                      <span className="ml-auto text-[10px] font-bold text-emerald-400 font-mono">{m.mult}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 italic">None</span>
              )}
            </div>

            {/* Immunities */}
            <div className="flex flex-col gap-1.5 p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/20">
              <span className="text-[10px] font-bold uppercase text-indigo-400">
                Immune ({selectedTypeData.immuneMembers.length})
              </span>
              {selectedTypeData.immuneMembers.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {selectedTypeData.immuneMembers.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <img src={m.sprite} alt={m.name} className="w-5 h-5 object-contain" />
                      <span className="text-slate-200 text-[11px] truncate">{m.name}</span>
                      <span className="ml-auto text-[10px] font-bold text-indigo-400 font-mono">0x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 italic">None</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
