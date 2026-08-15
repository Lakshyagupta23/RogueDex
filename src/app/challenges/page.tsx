'use client';

import React, { useState, useMemo } from 'react';
import { RefreshCw, Trophy, Share2, Shield, Info, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { getRandomTeam } from '@/lib/pokemon/data';
import { TYPE_COLORS } from '@/lib/pokemon/constants';
import confetti from 'canvas-confetti';

interface ChallengeType {
  id: string;
  name: string;
  description: string;
  rules: string[];
  generateCriteria: (pokemonList: PokemonIndexItem[]) => {
    criteria: any;
    label: string;
  };
}

const CHALLENGES: ChallengeType[] = [
  {
    id: 'random',
    name: 'Chaos Draft Challenge',
    description: 'Six completely random Pokémon. No restrictions, pure chaos. Test your adaptation skills.',
    rules: [
      'Generate six completely random Pokémon.',
      'No duplicate species allowed.',
      'Use the generated roster to beat the Elite Four.'
    ],
    generateCriteria: () => ({
      criteria: {},
      label: 'Chaos Draft'
    })
  },
  {
    id: 'monotype',
    name: 'Monotype Specialist',
    description: 'Pick a single random type and construct a team sharing that type. Master typing strengths.',
    rules: [
      'A single random type is chosen for you.',
      'All 6 Pokémon in your team must share this type (either primary or secondary).',
      'Learn to cover your type weaknesses with dual-type coverage.'
    ],
    generateCriteria: () => {
      const types = Object.keys(TYPE_COLORS);
      const chosenType = types[Math.floor(Math.random() * types.length)];
      return {
        criteria: { types: [chosenType] },
        label: `${chosenType.toUpperCase()} Specialist`
      };
    }
  },
  {
    id: 'generation',
    name: 'Time Capsule Challenge',
    description: 'Draft a team exclusively from a single random generation. Revisit historical eras.',
    rules: [
      'A single random generation (Gen 1 to 9) is selected.',
      'Your entire team must belong exclusively to that generation.',
      'No alternate forms introduced in later generations (e.g. Alolan forms in a Gen 1 run).'
    ],
    generateCriteria: () => {
      const gen = Math.floor(Math.random() * 9) + 1;
      return {
        criteria: { generations: [gen], formsMode: 'base_only' },
        label: `Generation ${gen} Legacy`
      };
    }
  },
  {
    id: 'legendary',
    name: 'Clash of Gods',
    description: 'Generate a squad consisting solely of Legendary and Mythical titans. Maximum firepower.',
    rules: [
      'Only Legendary or Mythical Pokémon are allowed.',
      'No baby Pokémon, starters, or standard pseudo-legendaries.',
      'Unleash devastating base stat totals on your opponents.'
    ],
    generateCriteria: () => ({
      criteria: { categories: ['legendary'] }, // our custom filters handle legendary or mythical
      label: 'Titan Squad'
    })
  },
  {
    id: 'weak',
    name: 'Underdog Nuzlocke',
    description: 'Generate Pokémon below a selected Base Stat Total threshold. Win with the weak.',
    rules: [
      'All generated Pokémon must have a Base Stat Total (BST) below 380.',
      'You cannot evolve any members of your team.',
      'Strategize with item boosts and status conditions to defeat superior opponents.'
    ],
    generateCriteria: () => ({
      criteria: { maxBst: 380, formsMode: 'base_only' },
      label: 'Underdog Roster'
    })
  },
  {
    id: 'no_evolution',
    name: 'Lone Wolf Challenge',
    description: 'Draft Pokémon that cannot evolve under any circumstances. No evolutionary chains.',
    rules: [
      'Only Pokémon that are completely single-stage (no pre-evolutions, no further evolutions) are allowed.',
      'Includes standalone Pokémon like Lapras, Skarmory, Mimikyu, or Dunsprace.',
      'Benefit from early-game power stats without needing grinding levels.'
    ],
    generateCriteria: () => ({
      // single stage: canEvolve is false and isFullyEvolved is true AND species doesn't have baby or starter flags (meaning it stands alone)
      criteria: { categories: ['fully_evolved'], maxBst: 500 }, // We filter single stage or fully evolved standalone
      label: 'Lone Survivors'
    })
  },
  {
    id: 'smallest',
    name: 'Pocket-Sized Roster',
    description: 'Generate a team containing only the smallest creatures. Speed and utility over size.',
    rules: [
      'Only Pokémon under 0.6m (2 feet) in height are allowed.',
      'Includes small birds, rodents, baby forms, and small fairies.',
      'Speed and evasion stats are usually your best weapons.'
    ],
    generateCriteria: () => ({
      criteria: { categories: ['baby'] }, // Baby Pokémon are small and cute!
      label: 'Micro Squad'
    })
  },
  {
    id: 'heavyweight',
    name: 'Colossal Heavyweights',
    description: 'Draft only the heaviest colossal beasts. Raw defensive physical bulk.',
    rules: [
      'Only Pokémon of massive physical scale and weight are selected.',
      'Includes large steel, rock, ground, or dragon types.',
      'Leverage massive defense, HP, and heavy-slam moves.'
    ],
    generateCriteria: () => ({
      criteria: { minBst: 520, categories: ['fully_evolved'] }, // Strong heavy fully evolved beasts
      label: 'Iron Colossus'
    })
  }
];

export default function ChallengesPage() {
  const { pokemonList, loading, error } = usePokemon();
  const [activeChallenge, setActiveChallenge] = useState<ChallengeType | null>(null);
  
  const [challengeTeam, setChallengeTeam] = useState<PokemonIndexItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [challengeLabel, setChallengeLabel] = useState('');

  // Start Rerolling Challenge Team
  const handleStartChallenge = (challenge: ChallengeType) => {
    if (pokemonList.length === 0 || isSpinning) return;
    
    setActiveChallenge(challenge);
    setIsSpinning(true);
    setChallengeTeam([]);

    const { criteria, label } = challenge.generateCriteria(pokemonList);
    setChallengeLabel(label);

    let ticks = 0;
    const maxTicks = 10;
    const interval = setInterval(() => {
      // Show random spinners
      const tempTeam = Array.from({ length: 6 }, () => 
        pokemonList[Math.floor(Math.random() * pokemonList.length)]
      );
      setChallengeTeam(tempTeam);
      ticks++;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        
        // Final Draft
        let finalTeam = getRandomTeam(pokemonList, 6, criteria);
        if (finalTeam.length < 6) {
          // fallback if criteria is too strict
          finalTeam = getRandomTeam(pokemonList, 6, {});
        }
        setChallengeTeam(finalTeam);
        setIsSpinning(false);
        
        // Trigger celebratory confetti burst!
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }, 75);
  };

  const handleShareChallenge = () => {
    if (challengeTeam.length === 0) return;
    const ids = challengeTeam.map(pk => pk.id).join(',');
    const url = `${window.location.origin}/team-builder?team=${ids}`;
    navigator.clipboard.writeText(url);
    
    // Simple custom alert
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      const origText = shareBtn.innerHTML;
      shareBtn.innerHTML = 'COPIED TO CLIPBOARD!';
      setTimeout(() => {
        shareBtn.innerHTML = origText;
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-450 font-semibold animate-pulse">Loading Challenge Chambers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-slate-200 mb-2">Error Loading Challenges</h2>
        <p className="text-slate-450 text-sm max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      
      {/* Header section */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
          RogueDex <span className="text-blue-500">Challenges</span>
        </h1>
        <p className="text-slate-450 text-sm">
          Select a custom challenge mode, generate your specific constraints, and test your skills.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Selection Cards Grid Left */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Available Challenges</h2>
          
          <div className="flex flex-col gap-4">
            {CHALLENGES.map(ch => {
              const isActive = activeChallenge?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => handleStartChallenge(ch)}
                  className={`glass-panel rounded-2xl p-5 border cursor-pointer text-left transition-all ${
                    isActive
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10'
                      : 'border-slate-850 hover:border-slate-750 hover:bg-[#181e2b]/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-extrabold text-sm text-slate-250 flex items-center gap-2">
                      <Trophy className={`w-4 h-4 ${isActive ? 'text-yellow-500' : 'text-slate-500'}`} />
                      {ch.name}
                    </h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      Reroll Roster
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {ch.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generator Output Right Area */}
        <div className="lg:col-span-7">
          {activeChallenge ? (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-850 shadow-xl flex flex-col gap-6 relative overflow-hidden">
              
              {/* Spinning Overlay Background Sparkles */}
              <div className="absolute top-0 right-0 p-4 opacity-15">
                <Trophy className="w-48 h-48 text-blue-500 rotate-12" />
              </div>

              {/* Title & Badge */}
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4 relative z-10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Active Challenge Run
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{activeChallenge.name}</h3>
                </div>
                {challengeLabel && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-600/10 border border-blue-500/25 text-blue-400">
                    {challengeLabel}
                  </span>
                )}
              </div>

              {/* Rules Sheet */}
              <div className="bg-slate-950/20 border border-slate-900/60 rounded-2xl p-4 flex flex-col gap-2.5 relative z-10">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-1">
                  <Info className="w-4 h-4 text-blue-500" />
                  Challenge Rules
                </h4>
                <ul className="flex flex-col gap-2 text-slate-350 text-xs">
                  {activeChallenge.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="text-blue-500 font-bold">&bull;</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Result Grid Roster */}
              {challengeTeam.length > 0 && (
                <div className="flex flex-col gap-4 relative z-10">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Generated Roster</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {challengeTeam.map((pk, idx) => {
                      const primaryType = pk.types[0] || 'normal';
                      const typeColor = TYPE_COLORS[primaryType];
                      
                      return (
                        <div
                          key={idx}
                          style={{ borderLeftColor: typeColor }}
                          className="flex items-center gap-3 bg-[#0b0e16] border border-slate-850 border-l-4 px-3 py-2.5 rounded-xl hover:bg-[#111622] transition-colors cursor-pointer group"
                          onClick={() => window.open(`/pokemon/${pk.name}`, '_blank')}
                        >
                          <img
                            src={pk.sprite}
                            alt={pk.displayName}
                            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
                          />
                          <div className="overflow-hidden">
                            <h5 className="font-bold text-slate-200 text-xs truncate group-hover:text-blue-400 transition-colors">
                              {pk.displayName}
                            </h5>
                            <span className="text-[9px] font-mono text-slate-550 block">
                              #{pk.id.toString().padStart(3, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4 relative z-10">
                <button
                  onClick={() => handleStartChallenge(activeChallenge)}
                  disabled={isSpinning}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/40 hover:shadow-blue-500/20 active:scale-98 flex items-center justify-center gap-2 border border-blue-400/20 text-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  {isSpinning ? 'SPINNING CHAMBER...' : '🎲 GENERATE ROSTER'}
                </button>

                {challengeTeam.length > 0 && !isSpinning && (
                  <>
                    <button
                      id="share-btn"
                      onClick={handleShareChallenge}
                      className="px-5 py-3 bg-[#111622] hover:bg-[#181e2c] border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      SHARE
                    </button>
                    
                    <a
                      href={`/team-builder?team=${challengeTeam.map(pk => pk.id).join(',')}`}
                      className="px-5 py-3 bg-[#111622] hover:bg-[#181e2c] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      TEAM BUILDER
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    </a>
                  </>
                )}
              </div>

            </div>
          ) : (
            /* Challenge Chambers Selection Screen */
            <div className="glass-panel rounded-3xl p-12 border border-slate-900 text-center flex flex-col items-center justify-center gap-6 min-h-[450px]">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500">
                <Trophy className="w-8 h-8 text-slate-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-1.5">Enter the Challenge Chambers</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Select a challenge from the left pane to draft a roster matching specific constraints and test your battle abilities.
                </p>
              </div>
              <button
                onClick={() => handleStartChallenge(CHALLENGES[0])}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full transition-all duration-200"
              >
                Launch Chaos Draft
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
