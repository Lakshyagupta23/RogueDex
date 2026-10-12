'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert, Scale, HelpCircle } from 'lucide-react';
import { TYPE_COLORS } from '@/lib/pokemon/constants';

const TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// Attack-to-Defense multipliers map: [attacking][defending] = multiplier
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export default function TypeChartPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'quick' | 'matrix'>('quick');
  const [selectedLookupType, setSelectedLookupType] = useState<string>('fire');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  const getCellMultiplier = (attacker: string, defender: string) => {
    const row = TYPE_CHART[attacker];
    if (row && row[defender] !== undefined) {
      return row[defender];
    }
    return 1.0; // neutral
  };

  const getMultiplierStyle = (mult: number) => {
    if (mult === 2) return 'bg-green-600/10 border-green-500 text-green-400 font-extrabold';
    if (mult === 0.5) return 'bg-orange-500/10 border-orange-500 text-orange-400';
    if (mult === 0) return 'bg-slate-900 border-slate-800 text-slate-500';
    return 'text-slate-500 border-transparent';
  };

  const getMultiplierLabel = (mult: number) => {
    if (mult === 2) return '2x';
    if (mult === 0.5) return '½';
    if (mult === 0) return '0';
    return '';
  };

  // Quick lookup calculations for selected type
  const attackSuperEffective = TYPES.filter(t => getCellMultiplier(selectedLookupType, t) === 2);
  const attackNotVery = TYPES.filter(t => getCellMultiplier(selectedLookupType, t) === 0.5);
  const attackNoEffect = TYPES.filter(t => getCellMultiplier(selectedLookupType, t) === 0);

  const defendWeakTo = TYPES.filter(t => getCellMultiplier(t, selectedLookupType) === 2);
  const defendResists = TYPES.filter(t => getCellMultiplier(t, selectedLookupType) === 0.5);
  const defendImmuneTo = TYPES.filter(t => getCellMultiplier(t, selectedLookupType) === 0);

  return (
    <div className="flex-grow w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold bg-[#111622] hover:bg-[#181e2b] px-4 py-2 border border-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <span className="text-xs font-bold text-slate-550 flex items-center gap-1.5 uppercase">
          <Scale className="w-4 h-4 text-blue-500" />
          Type Effectiveness Chart
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Type <span className="text-blue-500">Chart</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Instant damage multipliers detailing strengths, weaknesses, and immunities.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto self-center sm:self-auto">
          <button
            onClick={() => setViewMode('quick')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'quick' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Quick Lookup
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'matrix' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 18×18 Matrix
          </button>
        </div>
      </div>

      {/* Quick Lookup View */}
      {viewMode === 'quick' && (
        <div className="flex flex-col gap-6">
          {/* Type Selectors Grid */}
          <div className="glass-panel border-slate-850 p-4 rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select a Type to Inspect:</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedLookupType(type)}
                  style={{
                    backgroundColor: selectedLookupType === type ? TYPE_COLORS[type] : `${TYPE_COLORS[type]}15`,
                    borderColor: TYPE_COLORS[type],
                    color: selectedLookupType === type ? '#ffffff' : TYPE_COLORS[type],
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    selectedLookupType === type ? 'shadow-lg scale-105' : 'hover:scale-102 opacity-80 hover:opacity-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Type Matchup Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attacking Card */}
            <div className="glass-panel border-slate-850 p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  ⚔️ Attacking with <span style={{ color: TYPE_COLORS[selectedLookupType] }} className="capitalize">{selectedLookupType}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Damage Output</span>
              </div>

              {/* Super Effective */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-green-500/20 border border-green-500/40 text-[10px] flex items-center justify-center font-black">2x</span>
                  Super Effective Against ({attackSuperEffective.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {attackSuperEffective.length > 0 ? attackSuperEffective.map(t => (
                    <span
                      key={t}
                      style={{ backgroundColor: `${TYPE_COLORS[t]}20`, borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}
                      className="px-2.5 py-1 rounded-md text-xs font-bold uppercase border"
                    >
                      {t}
                    </span>
                  )) : (
                    <span className="text-xs text-slate-600 italic">None</span>
                  )}
                </div>
              </div>

              {/* Not Very Effective */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/40 text-[10px] flex items-center justify-center font-black">½</span>
                  Not Very Effective Against ({attackNotVery.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {attackNotVery.length > 0 ? attackNotVery.map(t => (
                    <span
                      key={t}
                      style={{ backgroundColor: `${TYPE_COLORS[t]}20`, borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}
                      className="px-2.5 py-1 rounded-md text-xs font-bold uppercase border"
                    >
                      {t}
                    </span>
                  )) : (
                    <span className="text-xs text-slate-600 italic">None</span>
                  )}
                </div>
              </div>

              {/* No Effect */}
              {attackNoEffect.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700 text-[10px] flex items-center justify-center font-black">0</span>
                    No Effect Against ({attackNoEffect.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {attackNoEffect.map(t => (
                      <span
                        key={t}
                        style={{ backgroundColor: `${TYPE_COLORS[t]}20`, borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}
                        className="px-2.5 py-1 rounded-md text-xs font-bold uppercase border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Defending Card */}
            <div className="glass-panel border-slate-850 p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  🛡️ Defending as <span style={{ color: TYPE_COLORS[selectedLookupType] }} className="capitalize">{selectedLookupType}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Damage Taken</span>
              </div>

              {/* Weak To */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500/40 text-[10px] flex items-center justify-center font-black">2x</span>
                  Weak to ({defendWeakTo.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {defendWeakTo.length > 0 ? defendWeakTo.map(t => (
                    <span
                      key={t}
                      style={{ backgroundColor: `${TYPE_COLORS[t]}20`, borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}
                      className="px-2.5 py-1 rounded-md text-xs font-bold uppercase border"
                    >
                      {t}
                    </span>
                  )) : (
                    <span className="text-xs text-slate-600 italic">None</span>
                  )}
                </div>
              </div>

              {/* Resists */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
                <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-green-500/20 border border-green-500/40 text-[10px] flex items-center justify-center font-black">½</span>
                  Resists ({defendResists.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {defendResists.length > 0 ? defendResists.map(t => (
                    <span
                      key={t}
                      style={{ backgroundColor: `${TYPE_COLORS[t]}20`, borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}
                      className="px-2.5 py-1 rounded-md text-xs font-bold uppercase border"
                    >
                      {t}
                    </span>
                  )) : (
                    <span className="text-xs text-slate-600 italic">None</span>
                  )}
                </div>
              </div>

              {/* Immunities */}
              {defendImmuneTo.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-900">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-indigo-500/20 border border-indigo-500/40 text-[10px] flex items-center justify-center font-black">0</span>
                    Immune to ({defendImmuneTo.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {defendImmuneTo.map(t => (
                      <span
                        key={t}
                        style={{ backgroundColor: `${TYPE_COLORS[t]}20`, borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}
                        className="px-2.5 py-1 rounded-md text-xs font-bold uppercase border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid wrapper */}
      <div className={`glass-panel border-slate-850 p-4 rounded-3xl overflow-x-auto shadow-2xl mt-2 select-none ${viewMode === 'quick' ? 'hidden sm:block' : 'block'}`}>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 sm:hidden">
          <span>👈 Swipe table horizontally 👉</span>
        </div>
        
        <div className="min-w-[850px] flex flex-col gap-1">
          
          {/* Header row (Defending types) */}
          <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider mb-1.5">
            <div className="w-20 text-center font-bold text-slate-500 text-[9px] self-end pb-1.5">
              Attack \ Def
            </div>
            {TYPES.map(type => (
              <div
                key={type}
                style={{ color: TYPE_COLORS[type] }}
                className="w-10 text-center truncate py-1 border border-slate-900 bg-slate-950/40 rounded rotate-[-25deg] origin-bottom-left"
              >
                {type.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {TYPES.map(attacker => {
            const isRowHovered = hoveredRow === attacker;
            return (
              <div
                key={attacker}
                onMouseEnter={() => setHoveredRow(attacker)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`flex items-center gap-1 rounded py-0.5 transition-colors ${
                  isRowHovered ? 'bg-slate-900/30' : ''
                }`}
              >
                
                {/* Attacking label */}
                <div
                  style={{
                    backgroundColor: `${TYPE_COLORS[attacker]}15`,
                    borderColor: TYPE_COLORS[attacker],
                    color: TYPE_COLORS[attacker],
                  }}
                  className="w-20 text-center text-[9px] uppercase font-bold py-1.5 rounded border"
                >
                  {attacker}
                </div>

                {/* Cells mapping */}
                {TYPES.map(defender => {
                  const mult = getCellMultiplier(attacker, defender);
                  const isColHovered = hoveredCol === defender;
                  const cellStyle = getMultiplierStyle(mult);

                  return (
                    <div
                      key={defender}
                      onMouseEnter={() => setHoveredCol(defender)}
                      onMouseLeave={() => setHoveredCol(null)}
                      className={`w-10 h-8 flex items-center justify-center border text-xs font-mono rounded transition-colors ${cellStyle} ${
                        isColHovered ? 'bg-slate-850/40 border-slate-800' : ''
                      }`}
                      title={`${attacker.toUpperCase()} vs ${defender.toUpperCase()}: ${mult}x`}
                    >
                      {getMultiplierLabel(mult)}
                    </div>
                  );
                })}

              </div>
            );
          })}

        </div>

      </div>

      {/* Legend guide */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold justify-center md:justify-start mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 bg-green-600/10 border border-green-500 rounded text-green-400 flex items-center justify-center font-bold text-[10px]">2x</span>
          Super Effective (Double Damage)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 bg-orange-500/10 border border-orange-500 rounded text-orange-400 flex items-center justify-center font-bold text-[10px]">½</span>
          Not Very Effective (Half Damage)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 bg-slate-900 border border-slate-800 rounded text-slate-500 flex items-center justify-center font-bold text-[10px]">0</span>
          No Effect (Immunity)
        </span>
      </div>

    </div>
  );
}
