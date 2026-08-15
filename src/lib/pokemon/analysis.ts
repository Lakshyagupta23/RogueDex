import { PokemonIndexItem } from './types';

// Attacker Type -> { Defender Type -> Multiplier }
export const TYPE_CHART: Record<string, Record<string, number>> = {
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
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Calculate defensive effectiveness multiplier for a set of types
export function getDefensiveEffectiveness(types: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  const allTypes = Object.keys(TYPE_CHART);
  
  for (const attackType of allTypes) {
    let multiplier = 1;
    for (const defType of types) {
      const effect = TYPE_CHART[attackType]?.[defType];
      if (effect !== undefined) {
        multiplier *= effect;
      }
    }
    result[attackType] = multiplier;
  }
  
  return result;
}

// Interface for type analysis output
export interface TeamAnalysis {
  typeCoverage: {
    coveredTypes: string[];
    uncoveredTypes: string[];
    percentage: number;
  };
  weaknesses: {
    type: string;
    count: number; // Number of weak Pokemon
    members: string[]; // Names of weak Pokemon
  }[];
  strengths: {
    type: string;
    count: number; // Number of resistant/immune Pokemon
    members: string[]; // Names of resistant/immune Pokemon
  }[];
}

// Perform team type analysis
export function analyzeTeam(team: PokemonIndexItem[]): TeamAnalysis {
  const allTypes = Object.keys(TYPE_CHART);
  
  if (team.length === 0) {
    return {
      typeCoverage: { coveredTypes: [], uncoveredTypes: allTypes, percentage: 0 },
      weaknesses: [],
      strengths: [],
    };
  }

  // 1. Calculate Offensive Type Coverage
  // Find which types the team's STAB types can hit for super-effective damage
  const coveredSet = new Set<string>();
  const teamTypes = new Set<string>(team.flatMap(p => p.types));

  for (const attackType of teamTypes) {
    const defenders = TYPE_CHART[attackType] || {};
    for (const [defType, multiplier] of Object.entries(defenders)) {
      if (multiplier > 1) {
        coveredSet.add(defType);
      }
    }
  }

  const coveredTypes = Array.from(coveredSet);
  const uncoveredTypes = allTypes.filter(t => !coveredSet.has(t));
  const percentage = Math.round((coveredTypes.length / allTypes.length) * 100);

  // 2. Calculate Defensive Weaknesses and Strengths
  const weaknessMap: Record<string, { count: number; members: string[] }> = {};
  const strengthMap: Record<string, { count: number; members: string[] }> = {};

  for (const type of allTypes) {
    weaknessMap[type] = { count: 0, members: [] };
    strengthMap[type] = { count: 0, members: [] };
  }

  for (const p of team) {
    const effectiveness = getDefensiveEffectiveness(p.types);
    for (const [attackType, multiplier] of Object.entries(effectiveness)) {
      if (multiplier > 1) {
        weaknessMap[attackType].count++;
        weaknessMap[attackType].members.push(p.displayName);
      } else if (multiplier < 1) {
        strengthMap[attackType].count++;
        strengthMap[attackType].members.push(p.displayName);
      }
    }
  }

  // Filter and sort weaknesses (types that deal super-effective to at least 2 team members, or net threat > 0)
  const weaknesses = allTypes
    .map(type => ({
      type,
      count: weaknessMap[type].count,
      members: weaknessMap[type].members,
    }))
    .filter(w => w.count >= 2)
    .sort((a, b) => b.count - a.count);

  // Filter and sort strengths (types resisted by at least 2 team members)
  const strengths = allTypes
    .map(type => ({
      type,
      count: strengthMap[type].count,
      members: strengthMap[type].members,
    }))
    .filter(s => s.count >= 2)
    .sort((a, b) => b.count - a.count);

  return {
    typeCoverage: {
      coveredTypes,
      uncoveredTypes,
      percentage,
    },
    weaknesses,
    strengths,
  };
}
