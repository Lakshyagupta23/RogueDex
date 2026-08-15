'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, RefreshCw, Layers, Scale, Ruler, Sparkles, HelpCircle, Volume2, Sparkle } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { fetchPokemonDetails } from '@/lib/pokemon/api';
import { PokemonDetails } from '@/lib/pokemon/types';
import { getDefensiveEffectiveness } from '@/lib/pokemon/analysis';
import { TYPE_COLORS, TYPE_GLOWS, TYPE_GRADIENTS } from '@/lib/pokemon/constants';
import StatBar from '@/components/StatBar';

function DetailContent({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const name = decodeURIComponent(resolvedParams.name);

  const { pokemonList, loading: indexLoading, error: indexError, toggleFavorite, isFavorite } = usePokemon();
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewShiny, setViewShiny] = useState(false);

  const playCry = () => {
    if (!details) return;
    const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/cries/latest/${details.speciesId}.ogg`);
    audio.volume = 0.45;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  // 1. Locate baseline Pokemon in cached index list
  const basePokemon = pokemonList.find(
    pk => pk.name.toLowerCase() === name.toLowerCase() || pk.displayName.toLowerCase() === name.toLowerCase()
  );

  // 2. Fetch detailed info from PokéAPI once index is loaded
  useEffect(() => {
    if (indexLoading || pokemonList.length === 0) return;
    if (!basePokemon) {
      setError(`Pokémon "${name}" could not be found in the current Pokédex index.`);
      setLoading(false);
      return;
    }

    async function loadDetails() {
      try {
        setLoading(true);
        const data = await fetchPokemonDetails(basePokemon!, pokemonList);
        setDetails(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching details:', err);
        setError(err.message || 'Failed to fetch detailed profile from PokéAPI.');
        setLoading(false);
      }
    }

    loadDetails();
  }, [name, indexLoading, pokemonList]);

  // Handle Loading Baseline Index
  if (indexLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-450 font-semibold animate-pulse">Loading index...</p>
      </div>
    );
  }

  // Handle Detail Load States
  if (loading) {
    const defaultColor = basePokemon ? TYPE_COLORS[basePokemon.types[0]] : '#3b82f6';
    return (
      <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-16 flex flex-col gap-6 items-center justify-center">
        <RefreshCw
          className="w-10 h-10 animate-spin mb-3"
          style={{ color: defaultColor }}
        />
        <p className="text-slate-400 text-sm font-semibold animate-pulse">
          Fetching PokéAPI details for {basePokemon?.displayName || name}...
        </p>
      </div>
    );
  }

  // Handle errors
  if (error || !details) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-200 mb-2">Pokémon Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={() => router.push('/pokemon')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all"
        >
          Back to Pokédex
        </button>
      </div>
    );
  }

  // Calculate Defensive Multipliers
  const effectiveness = getDefensiveEffectiveness(details.types);
  const groupedEffectiveness = {
    weak4x: [] as string[],
    weak2x: [] as string[],
    resist05x: [] as string[],
    resist025x: [] as string[],
    immune0x: [] as string[],
  };

  for (const [type, mult] of Object.entries(effectiveness)) {
    if (mult === 4) groupedEffectiveness.weak4x.push(type);
    else if (mult === 2) groupedEffectiveness.weak2x.push(type);
    else if (mult === 0.5) groupedEffectiveness.resist05x.push(type);
    else if (mult === 0.25) groupedEffectiveness.resist025x.push(type);
    else if (mult === 0) groupedEffectiveness.immune0x.push(type);
  }

  const primaryType = details.types[0];
  const typeColor = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
  const gradientClass = TYPE_GRADIENTS[primaryType] || TYPE_GRADIENTS.normal;
  const glowClass = TYPE_GLOWS[primaryType] || TYPE_GLOWS.normal;

  // Convert dimensions
  const heightMeters = details.height / 10;
  const heightFeet = Math.round(heightMeters * 3.28084 * 10) / 10;
  const weightKg = details.weight / 10;
  const weightLbs = Math.round(weightKg * 2.20462 * 10) / 10;

  return (
    <div className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
      
      {/* Navigation top */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors bg-[#111622] hover:bg-[#181e2b] px-4 py-2 border border-slate-800 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => toggleFavorite(details.id)}
          className="p-2 bg-[#111622] border border-slate-800 rounded-full text-slate-200 hover:bg-[#181e2b] transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite(details.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
            }`}
          />
        </button>
      </div>

      {/* Main card */}
      <div className={`glass-panel rounded-3xl border relative bg-gradient-to-b ${gradientClass} ${glowClass} p-6 sm:p-10 flex flex-col gap-10`}>
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Artwork thumbnail */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center relative">
              <div
                style={{ backgroundColor: `${typeColor}15` }}
                className="absolute inset-0 rounded-full blur-2xl animate-pulse scale-90"
              />
              <img
                src={viewShiny ? (details as any).shinySprite || details.sprite : details.sprite}
                alt={details.displayName}
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
              />
            </div>
            {/* View Shiny Form Toggle Button */}
            <button
              onClick={() => setViewShiny(!viewShiny)}
              className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border transition-all ${
                viewShiny 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {viewShiny ? '✨ View Default Form' : '✨ View Shiny Form'}
            </button>
          </div>

          {/* Core metadata details */}
          <div className="flex-grow flex flex-col gap-4 text-center md:text-left">
            <div>
              <span className="font-mono text-sm font-bold text-slate-500">
                #{details.id.toString().padStart(3, '0')}
              </span>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-0.5">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white capitalize">
                  {details.displayName}
                </h1>
                <button
                  onClick={playCry}
                  className="p-1.5 rounded-lg bg-slate-950/45 border border-slate-850/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                  title="Listen to Cry"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center mt-2.5">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400">
                  GEN {details.generation}
                </span>

                {viewShiny && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-400/25 text-amber-400 flex items-center gap-1 animate-pulse">
                    <Sparkle className="w-3 h-3 fill-amber-400" />
                    SHINY
                  </span>
                )}

                {details.types.map(t => (
                  <span
                    key={t}
                    style={{
                      backgroundColor: `${TYPE_COLORS[t]}1a`,
                      color: TYPE_COLORS[t],
                      borderColor: `${TYPE_COLORS[t]}2c`,
                    }}
                    className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded border"
                  >
                    {t}
                  </span>
                ))}

                {details.isMega && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-purple-400">
                    MEGA
                  </span>
                )}
                {details.isRegional && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    REGIONAL
                  </span>
                )}
                {details.isLegendary && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25 text-indigo-400">
                    LEGENDARY
                  </span>
                )}
                {details.isMythical && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                    MYTHICAL
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              {details.description}
            </p>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto md:mx-0 mt-2 bg-slate-950/20 rounded-xl p-3 border border-slate-900/60">
              <div className="flex items-center gap-3">
                <Ruler className="w-5 h-5 text-slate-500" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-550 block">Height</span>
                  <span className="text-sm font-semibold text-slate-200">{heightMeters} m <span className="text-[10px] text-slate-450">({heightFeet}')</span></span>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-slate-900/60 pl-3">
                <Scale className="w-5 h-5 text-slate-500" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-550 block">Weight</span>
                  <span className="text-sm font-semibold text-slate-200">{weightKg} kg <span className="text-[10px] text-slate-450">({weightLbs} lbs)</span></span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Details and Stats section split grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Stats bar column */}
          <div className="flex flex-col gap-4">
            <h3 className="font-extrabold text-slate-200 text-base border-b border-slate-900 pb-2">Base Stats</h3>
            <div className="flex flex-col gap-3.5 bg-slate-950/20 rounded-2xl p-5 border border-slate-900/60">
              <StatBar statKey="hp" value={details.stats.hp} />
              <StatBar statKey="atk" value={details.stats.atk} />
              <StatBar statKey="def" value={details.stats.def} />
              <StatBar statKey="spAtk" value={details.stats.spAtk} />
              <StatBar statKey="spDef" value={details.stats.spDef} />
              <StatBar statKey="spe" value={details.stats.spe} />
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs font-bold font-mono text-slate-400">
                <span>BASE STAT TOTAL</span>
                <span className="text-sm font-extrabold text-blue-450">{details.stats.total}</span>
              </div>
            </div>
          </div>

          {/* Profile details column */}
          <div className="flex flex-col gap-4">
            <h3 className="font-extrabold text-slate-200 text-base border-b border-slate-900 pb-2">Training & Breeding</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs py-2">
              <div>
                <span className="text-slate-550 uppercase font-bold block text-[10px]">Abilities</span>
                <div className="flex flex-col gap-1 mt-1">
                  {details.abilities.map(abil => (
                    <div key={abil.name} className="flex flex-col">
                      <span className="font-semibold text-slate-250">
                        {abil.name}{' '}
                        {abil.isHidden && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            HA
                          </span>
                        )}
                      </span>
                      {abil.description && (
                        <span className="text-[10px] text-slate-500">{abil.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-550 uppercase font-bold block text-[10px]">Egg Groups</span>
                <span className="font-semibold text-slate-250 block mt-1">
                  {details.eggGroups.join(', ') || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-slate-550 uppercase font-bold block text-[10px]">Catch Rate</span>
                <span className="font-semibold text-slate-250 block mt-1">
                  {details.catchRate} <span className="text-[10px] text-slate-500">({Math.round((details.catchRate / 255) * 100)}% with full HP Pokéball)</span>
                </span>
              </div>
              <div>
                <span className="text-slate-550 uppercase font-bold block text-[10px]">Growth Rate</span>
                <span className="font-semibold text-slate-250 block mt-1">
                  {details.growthRate}
                </span>
              </div>
              <div>
                <span className="text-slate-550 uppercase font-bold block text-[10px]">Base Exp</span>
                <span className="font-semibold text-slate-250 block mt-1">
                  {details.baseExperience}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Type effectiveness multipliers list */}
        <div className="flex flex-col gap-4">
          <h3 className="font-extrabold text-slate-200 text-base border-b border-slate-900 pb-2">Defensive Effectiveness</h3>
          <div className="flex flex-col gap-3.5 bg-slate-950/20 rounded-2xl p-5 border border-slate-900/60 text-xs">
            {groupedEffectiveness.weak4x.length > 0 && (
              <div className="flex items-start gap-4 py-1.5 border-b border-slate-900/40">
                <span className="w-16 font-extrabold text-rose-500 font-mono tracking-wide">4x Weak</span>
                <div className="flex flex-wrap gap-1.5">
                  {groupedEffectiveness.weak4x.map(t => (
                    <span key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold text-slate-950">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {groupedEffectiveness.weak2x.length > 0 && (
              <div className="flex items-start gap-4 py-1.5 border-b border-slate-900/40">
                <span className="w-16 font-semibold text-amber-500 font-mono tracking-wide">2x Weak</span>
                <div className="flex flex-wrap gap-1.5">
                  {groupedEffectiveness.weak2x.map(t => (
                    <span key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold text-slate-950">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {groupedEffectiveness.resist05x.length > 0 && (
              <div className="flex items-start gap-4 py-1.5 border-b border-slate-900/40">
                <span className="w-16 font-semibold text-emerald-500 font-mono tracking-wide">0.5x Resist</span>
                <div className="flex flex-wrap gap-1.5">
                  {groupedEffectiveness.resist05x.map(t => (
                    <span key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold text-slate-950">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {groupedEffectiveness.resist025x.length > 0 && (
              <div className="flex items-start gap-4 py-1.5 border-b border-slate-900/40">
                <span className="w-16 font-extrabold text-teal-400 font-mono tracking-wide">0.25x Resist</span>
                <div className="flex flex-wrap gap-1.5">
                  {groupedEffectiveness.resist025x.map(t => (
                    <span key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold text-slate-950">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {groupedEffectiveness.immune0x.length > 0 && (
              <div className="flex items-start gap-4 py-1.5">
                <span className="w-16 font-extrabold text-blue-400 font-mono tracking-wide">0x Immune</span>
                <div className="flex flex-wrap gap-1.5">
                  {groupedEffectiveness.immune0x.map(t => (
                    <span key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold text-slate-950">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Evolution Chain details */}
        {details.evolutionChain && details.evolutionChain.length > 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-extrabold text-slate-200 text-base border-b border-slate-900 pb-2">Evolutionary Line</h3>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 py-4">
              {details.evolutionChain.map((node, index) => {
                const primaryEvoType = node.types[0];
                const evoColor = TYPE_COLORS[primaryEvoType] || TYPE_COLORS.normal;
                
                return (
                  <React.Fragment key={node.name}>
                    {index > 0 && (
                      <div className="flex flex-col items-center justify-center text-slate-500 font-mono text-[10px]">
                        <span className="hidden md:inline text-lg">&rarr;</span>
                        <span className="md:hidden text-lg">&darr;</span>
                        {node.trigger && (
                          <span className="font-semibold mt-0.5 text-center text-slate-450 max-w-[80px]">
                            {node.trigger} {node.minLevel ? `Lvl ${node.minLevel}` : ''} {node.item ? `(${node.item})` : ''}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div
                      onClick={() => router.push(`/pokemon/${node.name}`)}
                      style={{ borderColor: node.name === details.name ? evoColor : 'rgba(245, 247, 250, 0.05)' }}
                      className={`flex flex-row md:flex-col items-center gap-4 bg-slate-950/20 hover:bg-slate-900/40 p-4 px-6 rounded-2xl border transition-all cursor-pointer group w-full md:w-36`}
                    >
                      <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center relative flex-shrink-0">
                        <div
                          style={{ backgroundColor: `${evoColor}08` }}
                          className="absolute inset-0 rounded-full blur-xl animate-pulse scale-90"
                        />
                        <img
                          src={node.sprite}
                          alt={node.displayName}
                          className="w-full h-full object-contain relative z-10 transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="text-left md:text-center overflow-hidden">
                        <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-blue-400 transition-colors">
                          {node.displayName}
                        </h4>
                        <div className="flex gap-1 mt-1 justify-start md:justify-center">
                          {node.types.map(t => (
                            <span key={t} className="text-[8px] uppercase font-bold tracking-wider px-1 text-slate-450">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default function PokemonDetailPage({ params }: { params: Promise<{ name: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      }
    >
      <DetailContent params={params} />
    </Suspense>
  );
}
