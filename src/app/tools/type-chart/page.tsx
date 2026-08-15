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

      <div className="text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          Type <span className="text-blue-500">Chart</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          A damage multipliers matrix detailing strengths, weaknesses, and immunities. Rows represent attackers; columns represent defenders.
        </p>
      </div>

      {/* Grid wrapper */}
      <div className="glass-panel border-slate-850 p-4 rounded-3xl overflow-x-auto shadow-2xl mt-2 select-none">
        
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
