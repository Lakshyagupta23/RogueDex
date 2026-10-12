import { PokemonIndexItem } from './types';
import { TYPE_CHART, getDefensiveEffectiveness } from './analysis';

export type SpeedTier = 'blazing' | 'fast' | 'mid' | 'slow';

export interface SpeedTierInfo {
  tier: SpeedTier;
  label: string;
  color: string;
  min: number;
  max: number;
}

export const SPEED_TIERS: Record<SpeedTier, SpeedTierInfo> = {
  blazing: { tier: 'blazing', label: 'Blazing (110+)', color: '#ec4899', min: 110, max: 255 },
  fast: { tier: 'fast', label: 'Fast (85-109)', color: '#3b82f6', min: 85, max: 109 },
  mid: { tier: 'mid', label: 'Mid Tier (60-84)', color: '#eab308', min: 60, max: 84 },
  slow: { tier: 'slow', label: 'Bulky / Tank (<60)', color: '#10b981', min: 0, max: 59 },
};

export function getSpeedTier(spe: number): SpeedTierInfo {
  if (spe >= 110) return SPEED_TIERS.blazing;
  if (spe >= 85) return SPEED_TIERS.fast;
  if (spe >= 60) return SPEED_TIERS.mid;
  return SPEED_TIERS.slow;
}

export type CompetitiveRole =
  | 'Physical Sweeper'
  | 'Special Sweeper'
  | 'Physical Wall'
  | 'Special Wall'
  | 'Bulky Pivot'
  | 'Speed Demon'
  | 'Balanced Battler';

export function classifyRole(pk: PokemonIndexItem): CompetitiveRole {
  const { atk, def, spAtk, spDef, spe, hp } = pk.stats;

  if (spe >= 115 && Math.max(atk, spAtk) >= 95) {
    return 'Speed Demon';
  }
  if (atk >= 100 && spe >= 80 && atk >= spAtk) {
    return 'Physical Sweeper';
  }
  if (spAtk >= 100 && spe >= 80 && spAtk > atk) {
    return 'Special Sweeper';
  }
  if (def >= 100 && hp >= 75 && def >= spDef) {
    return 'Physical Wall';
  }
  if (spDef >= 100 && hp >= 75 && spDef > def) {
    return 'Special Wall';
  }
  if ((hp >= 80 || def >= 80 || spDef >= 80) && Math.max(atk, spAtk) >= 80) {
    return 'Bulky Pivot';
  }
  return 'Balanced Battler';
}

export interface RecommendationScore {
  pokemon: PokemonIndexItem;
  score: number; // 0 to 100
  isTopPick: boolean;
  role: CompetitiveRole;
  speedTier: SpeedTierInfo;
  reasonBadges: string[];
  reasons: string[];
}

/**
 * Evaluates candidate options against the current squad to recommend the best synergy addition.
 */
export function scoreCandidates(
  currentTeam: (PokemonIndexItem | null)[],
  candidates: PokemonIndexItem[]
): RecommendationScore[] {
  const validTeam = currentTeam.filter((p): p is PokemonIndexItem => p !== null);
  const allTypes = Object.keys(TYPE_CHART);

  // 1. Identify current team's defensive vulnerabilities (types dealt > 1x to multiple members)
  const weaknessCount: Record<string, number> = {};
  for (const t of allTypes) weaknessCount[t] = 0;

  for (const member of validTeam) {
    const eff = getDefensiveEffectiveness(member.types);
    for (const [atkType, mult] of Object.entries(eff)) {
      if (mult > 1) {
        weaknessCount[atkType] = (weaknessCount[atkType] || 0) + 1;
      }
    }
  }

  // Types where team is vulnerable (>= 2 members weak, or >= 1 member if team size <= 2)
  const threatThreshold = validTeam.length <= 2 ? 1 : 2;
  const criticalThreats = Object.entries(weaknessCount)
    .filter(([_, count]) => count >= threatThreshold)
    .map(([type]) => type);

  // 2. Identify offensive coverage of current team
  const currentCoveredDefenders = new Set<string>();
  for (const member of validTeam) {
    for (const stabType of member.types) {
      const defenders = TYPE_CHART[stabType] || {};
      for (const [defType, mult] of Object.entries(defenders)) {
        if (mult > 1) currentCoveredDefenders.add(defType);
      }
    }
  }

  // 3. Team speed distribution & role counts
  const avgTeamSpeed = validTeam.length > 0
    ? validTeam.reduce((sum, p) => sum + p.stats.spe, 0) / validTeam.length
    : 80;
  
  const hasFastMember = validTeam.some(p => p.stats.spe >= 100);
  const hasPhysicalAttacker = validTeam.some(p => p.stats.atk >= 100);
  const hasSpecialAttacker = validTeam.some(p => p.stats.spAtk >= 100);
  const hasDefensiveAnchor = validTeam.some(p => p.stats.def >= 100 || p.stats.spDef >= 100);

  // 4. Score each candidate
  const scored = candidates.map(cand => {
    let score = 50; // base score
    const reasonBadges: string[] = [];
    const reasons: string[] = [];

    const candRole = classifyRole(cand);
    const candSpeedTier = getSpeedTier(cand.stats.spe);
    const candEff = getDefensiveEffectiveness(cand.types);

    // Defensive patch evaluation (up to +35 pts)
    const patchedThreats: string[] = [];
    for (const threat of criticalThreats) {
      const multiplier = candEff[threat] ?? 1;
      if (multiplier === 0) {
        score += 15;
        patchedThreats.push(`${threat} (immune)`);
      } else if (multiplier < 1) {
        score += 10;
        patchedThreats.push(threat);
      } else if (multiplier > 1) {
        score -= 6; // compounds an existing team weakness
      }
    }

    if (patchedThreats.length > 0) {
      reasonBadges.push(`Resists ${patchedThreats.slice(0, 2).join(', ')}`);
      reasons.push(`Patches team weakness to ${patchedThreats.join(', ')}`);
    }

    // Offensive diversity evaluation (up to +25 pts)
    const newlyCovered: string[] = [];
    for (const stabType of cand.types) {
      const defenders = TYPE_CHART[stabType] || {};
      for (const [defType, mult] of Object.entries(defenders)) {
        if (mult > 1 && !currentCoveredDefenders.has(defType)) {
          newlyCovered.push(defType);
          score += 6;
        }
      }
    }

    if (newlyCovered.length > 0) {
      reasonBadges.push(`New Super-Effective vs ${newlyCovered.slice(0, 2).join(', ')}`);
      reasons.push(`Expands offensive coverage against ${newlyCovered.slice(0, 3).join(', ')}`);
    }

    // Speed curve balance (up to +15 pts)
    if (!hasFastMember && cand.stats.spe >= 100) {
      score += 14;
      reasonBadges.push(`${cand.stats.spe} Base Speed`);
      reasons.push(`Adds crucial high-speed offensive pace (${cand.stats.spe} Spe)`);
    } else if (avgTeamSpeed >= 95 && (cand.stats.def >= 100 || cand.stats.spDef >= 100)) {
      score += 10;
      reasonBadges.push('Defensive Anchor');
      reasons.push('Adds defensive bulk to balance a frail offensive core');
    }

    // Missing role complement (up to +15 pts)
    if (!hasPhysicalAttacker && cand.stats.atk >= 105) {
      score += 10;
      reasonBadges.push('Physical Threat');
      reasons.push(`Provides heavy physical attack power (${cand.stats.atk} Atk)`);
    }
    if (!hasSpecialAttacker && cand.stats.spAtk >= 105) {
      score += 10;
      reasonBadges.push('Special Threat');
      reasons.push(`Provides heavy special attack power (${cand.stats.spAtk} SpA)`);
    }
    if (!hasDefensiveAnchor && (cand.stats.def >= 105 || cand.stats.spDef >= 105)) {
      score += 10;
      reasonBadges.push('Wall / Pivot');
      reasons.push('Provides high defensive staying power');
    }

    // BST Quality bonus (normalized)
    const bstBonus = Math.min(15, Math.max(-10, Math.round((cand.stats.total - 480) / 20)));
    score += bstBonus;

    // Type repetition penalty (avoid stacking 3+ of same type unless early)
    const duplicateTypes = cand.types.filter(t => validTeam.filter(m => m.types.includes(t)).length >= 2);
    if (duplicateTypes.length > 0) {
      score -= 14;
      reasons.push(`Duplicates existing team type (${duplicateTypes.join(', ')})`);
    }

    // Clamp score
    const finalScore = Math.max(10, Math.min(99, Math.round(score)));

    if (reasonBadges.length === 0) {
      reasonBadges.push(candRole);
    }

    return {
      pokemon: cand,
      score: finalScore,
      isTopPick: false,
      role: candRole,
      speedTier: candSpeedTier,
      reasonBadges: reasonBadges.slice(0, 2),
      reasons,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Mark top pick
  if (scored.length > 0) {
    scored[0].isTopPick = true;
  }

  return scored;
}
