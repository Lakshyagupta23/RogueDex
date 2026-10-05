import React from 'react';
import { DraftTeamMember } from '@/lib/pokemon/types';

import { TYPE_COLORS } from '@/lib/pokemon/constants';

// Simplified Type Chart for defensive calculations
// value > 1 means weakness, value < 1 means resistance, 0 means immunity
const TYPE_MATCHUP: Record<string, Record<string, number>> = {
  normal: { fighting: 2, ghost: 0 },
  fire: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
  water: { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
  grass: { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, electric: 0.5, grass: 0.5, ground: 0.5 },
  ice: { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
  fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
  poison: { ground: 2, psychic: 2, fighting: 0.5, poison: 0.5, bug: 0.5, grass: 0.5, fairy: 0.5 },
  ground: { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
  flying: { electric: 2, ice: 2, rock: 2, grass: 0.5, fighting: 0.5, bug: 0.5, ground: 0 },
  psychic: { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
  bug: { fire: 2, flying: 2, rock: 2, fighting: 0.5, ground: 0.5, grass: 0.5 },
  rock: { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
  ghost: { ghost: 2, dark: 2, poison: 0.5, bug: 0.5, normal: 0, fighting: 0 },
  dragon: { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5 },
  dark: { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
  steel: { fire: 2, fighting: 2, ground: 2, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5, poison: 0 },
  fairy: { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 }
};

export default function SynergyHUD({ team }: { team: DraftTeamMember[] }) {
  if (team.length === 0) return null;

  const weaknesses = new Map<string, number>();
  const resistances = new Map<string, number>();
  const immunities = new Set<string>();

  // Calculate team coverage
  team.forEach(member => {
    const types = member.actualPk.types;
    Object.keys(TYPE_MATCHUP).forEach(attackingType => {
      let multiplier = 1;
      types.forEach(defendingType => {
        const typeData = TYPE_MATCHUP[defendingType];
        if (typeData && typeData[attackingType] !== undefined) {
          multiplier *= typeData[attackingType];
        }
      });

      if (multiplier > 1) {
        weaknesses.set(attackingType, (weaknesses.get(attackingType) || 0) + 1);
      } else if (multiplier === 0) {
        immunities.add(attackingType);
      } else if (multiplier < 1) {
        resistances.set(attackingType, (resistances.get(attackingType) || 0) + 1);
      }
    });
  });

  const topWeaknesses = Array.from(weaknesses.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 1)
    .slice(0, 3);
    
  const topResistances = Array.from(resistances.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 1)
    .slice(0, 3);

  if (topWeaknesses.length === 0 && topResistances.length === 0 && immunities.size === 0) {
    return null;
  }

  return (
    <div className="absolute top-20 right-4 w-64 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl z-40 hidden md:block">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-800 pb-1">Team Synergy HUD</h3>
      
      {topWeaknesses.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] text-red-400 font-bold mb-1 uppercase">Major Weaknesses (x{`>`}1)</p>
          <div className="flex flex-wrap gap-1">
            {topWeaknesses.map(([type, count]) => (
              <span key={type} className="px-2 py-0.5 rounded text-[10px] font-bold capitalize border"
                style={{ backgroundColor: `${TYPE_COLORS[type]}33`, color: TYPE_COLORS[type], borderColor: `${TYPE_COLORS[type]}80` }}>
                {type} <span className="opacity-60 ml-1">x{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {topResistances.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] text-emerald-400 font-bold mb-1 uppercase">Key Resistances</p>
          <div className="flex flex-wrap gap-1">
            {topResistances.map(([type, count]) => (
              <span key={type} className="px-2 py-0.5 rounded text-[10px] font-bold capitalize border"
                style={{ backgroundColor: `${TYPE_COLORS[type]}33`, color: TYPE_COLORS[type], borderColor: `${TYPE_COLORS[type]}80` }}>
                {type} <span className="opacity-60 ml-1">x{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {immunities.size > 0 && (
        <div>
          <p className="text-[10px] text-cyan-400 font-bold mb-1 uppercase">Immunities</p>
          <div className="flex flex-wrap gap-1">
            {Array.from(immunities).map(type => (
              <span key={type} className="px-2 py-0.5 rounded text-[10px] font-bold capitalize border"
                style={{ backgroundColor: `${TYPE_COLORS[type]}33`, color: TYPE_COLORS[type], borderColor: `${TYPE_COLORS[type]}80` }}>
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
