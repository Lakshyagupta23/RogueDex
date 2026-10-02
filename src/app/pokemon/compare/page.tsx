'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Scale, ShieldAlert, Sparkles, HelpCircle, Check, Search } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem, PokemonDetails } from '@/lib/pokemon/types';
import { fetchPokemonDetails } from '@/lib/pokemon/api';
import { getDefensiveEffectiveness } from '@/lib/pokemon/analysis';
import { generateShowdownTeam } from '@/lib/pokemon/showdown';
import { TYPE_COLORS, TYPE_GRADIENTS } from '@/lib/pokemon/constants';

export default function ComparePage() {
  const router = useRouter();
  const { pokemonList, loading: listLoading, error: listError } = usePokemon();

  // Selected Pokémon Index Items
  const [pkA, setPkA] = useState<PokemonIndexItem | null>(null);
  const [pkB, setPkB] = useState<PokemonIndexItem | null>(null);

  // Autocomplete search states
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [showSuggestA, setShowSuggestA] = useState(false);
  const [showSuggestB, setShowSuggestB] = useState(false);

  // Loaded Details states
  const [detailsA, setDetailsA] = useState<PokemonDetails | null>(null);
  const [detailsB, setDetailsB] = useState<PokemonDetails | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  // Suggestions lists
  const suggestionsA = useMemo(() => {
    if (!searchA.trim()) return [];
    const q = searchA.toLowerCase().trim();
    return pokemonList
      .filter(p => p.displayName.toLowerCase().includes(q) || p.id.toString() === q)
      .slice(0, 5);
  }, [pokemonList, searchA]);

  const suggestionsB = useMemo(() => {
    if (!searchB.trim()) return [];
    const q = searchB.toLowerCase().trim();
    return pokemonList
      .filter(p => p.displayName.toLowerCase().includes(q) || p.id.toString() === q)
      .slice(0, 5);
  }, [pokemonList, searchB]);

  // Fetch details for A
  useEffect(() => {
    if (!pkA) {
      setDetailsA(null);
      return;
    }
    async function loadA() {
      try {
        setLoadingA(true);
        setErrorA(null);
        const data = await fetchPokemonDetails(pkA!, pokemonList);
        setDetailsA(data);
      } catch (err: any) {
        setErrorA(err.message || 'Failed to fetch details.');
      } finally {
        setLoadingA(false);
      }
    }
    loadA();
  }, [pkA, pokemonList]);

  // Fetch details for B
  useEffect(() => {
    if (!pkB) {
      setDetailsB(null);
      return;
    }
    async function loadB() {
      try {
        setLoadingB(true);
        setErrorB(null);
        const data = await fetchPokemonDetails(pkB!, pokemonList);
        setDetailsB(data);
      } catch (err: any) {
        setErrorB(err.message || 'Failed to fetch details.');
      } finally {
        setLoadingB(false);
      }
    }
    loadB();
  }, [pkB, pokemonList]);

  // Defensive effectiveness calculations
  const effA = useMemo(() => detailsA ? getDefensiveEffectiveness(detailsA.types) : null, [detailsA]);
  const effB = useMemo(() => detailsB ? getDefensiveEffectiveness(detailsB.types) : null, [detailsB]);

  // Showdown set exports
  const [showdownA, setShowdownA] = useState('');
  const [showdownB, setShowdownB] = useState('');

  useEffect(() => {
    if (detailsA && pkA) generateShowdownTeam([pkA]).then(setShowdownA);
    else setShowdownA('');
  }, [detailsA, pkA]);

  useEffect(() => {
    if (detailsB && pkB) generateShowdownTeam([pkB]).then(setShowdownB);
    else setShowdownB('');
  }, [detailsB, pkB]);

  if (listLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-450 font-semibold animate-pulse">Loading database index...</p>
      </div>
    );
  }

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
          Pokémon Comparison Tool
        </span>
      </div>

      <div className="text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          Compare <span className="text-blue-500">Pokémon</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Select any two Pokémon to compare their baseline stats, type matchups, dimensions, and competitive sets side-by-side.
        </p>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
        
        {/* Selector A */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Pokémon A</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Type name or Pokedex ID..."
              value={searchA}
              onChange={(e) => {
                setSearchA(e.target.value);
                setShowSuggestA(true);
              }}
              onFocus={() => setShowSuggestA(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111622] border border-slate-800 rounded-xl text-slate-250 placeholder-slate-550 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>

          {showSuggestA && suggestionsA.length > 0 && (
            <div className="absolute top-[72px] left-0 right-0 bg-[#0f1420] border border-slate-800 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto">
              {suggestionsA.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPkA(p);
                    setSearchA(p.displayName);
                    setShowSuggestA(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#181e2b] text-left text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  <img src={p.sprite} alt={p.displayName} className="w-8 h-8 object-contain" />
                  <span>{p.displayName}</span>
                  <span className="text-[10px] text-slate-550 ml-auto font-mono">#{p.id.toString().padStart(3, '0')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selector B */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Pokémon B</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Type name or Pokedex ID..."
              value={searchB}
              onChange={(e) => {
                setSearchB(e.target.value);
                setShowSuggestB(true);
              }}
              onFocus={() => setShowSuggestB(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111622] border border-slate-800 rounded-xl text-slate-250 placeholder-slate-550 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>

          {showSuggestB && suggestionsB.length > 0 && (
            <div className="absolute top-[72px] left-0 right-0 bg-[#0f1420] border border-slate-800 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto">
              {suggestionsB.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPkB(p);
                    setSearchB(p.displayName);
                    setShowSuggestB(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#181e2b] text-left text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  <img src={p.sprite} alt={p.displayName} className="w-8 h-8 object-contain" />
                  <span>{p.displayName}</span>
                  <span className="text-[10px] text-slate-550 ml-auto font-mono">#{p.id.toString().padStart(3, '0')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Comparisons Area */}
      {pkA && pkB ? (
        <div className="flex flex-col gap-8 mt-4">
          
          {/* Load indicator */}
          {(loadingA || loadingB) ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-xs font-bold text-slate-400">Loading details profiles...</span>
            </div>
          ) : (
            <>
              {/* Profile Card Header comparisons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile Card A */}
                <div className={`glass-panel border-slate-850 p-6 rounded-3xl flex items-center gap-6 bg-gradient-to-b ${TYPE_GRADIENTS[pkA.types[0]] || ''}`}>
                  <img src={pkA.sprite} alt={pkA.displayName} className="w-28 h-28 object-contain drop-shadow-lg" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-slate-500">#{pkA.id.toString().padStart(3, '0')}</span>
                    <h2 className="text-xl font-black text-white capitalize">{pkA.displayName}</h2>
                    <div className="flex gap-1 mt-2">
                      {pkA.types.map(t => (
                        <span
                          key={t}
                          style={{ backgroundColor: `${TYPE_COLORS[t]}1a`, color: TYPE_COLORS[t], borderColor: `${TYPE_COLORS[t]}25` }}
                          className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profile Card B */}
                <div className={`glass-panel border-slate-850 p-6 rounded-3xl flex items-center gap-6 bg-gradient-to-b ${TYPE_GRADIENTS[pkB.types[0]] || ''}`}>
                  <img src={pkB.sprite} alt={pkB.displayName} className="w-28 h-28 object-contain drop-shadow-lg" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-slate-500">#{pkB.id.toString().padStart(3, '0')}</span>
                    <h2 className="text-xl font-black text-white capitalize">{pkB.displayName}</h2>
                    <div className="flex gap-1 mt-2">
                      {pkB.types.map(t => (
                        <span
                          key={t}
                          style={{ backgroundColor: `${TYPE_COLORS[t]}1a`, color: TYPE_COLORS[t], borderColor: `${TYPE_COLORS[t]}25` }}
                          className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Stats Comparison Grid */}
              <div className="glass-panel border-slate-850 p-6 sm:p-8 rounded-3xl flex flex-col gap-6">
                <h3 className="text-sm font-bold uppercase text-slate-200 border-b border-slate-900 pb-2.5 tracking-wider">Base Stats Comparison</h3>
                <div className="flex flex-col gap-5">
                  {[
                    { label: 'HP', valA: pkA.stats.hp, valB: pkB.stats.hp, color: '#FF5959' },
                    { label: 'Attack', valA: pkA.stats.atk, valB: pkB.stats.atk, color: '#F5AC78' },
                    { label: 'Defense', valA: pkA.stats.def, valB: pkB.stats.def, color: '#FAE078' },
                    { label: 'Sp. Atk', valA: pkA.stats.spAtk, valB: pkB.stats.spAtk, color: '#9DB7F5' },
                    { label: 'Sp. Def', valA: pkA.stats.spDef, valB: pkB.stats.spDef, color: '#A7DB8D' },
                    { label: 'Speed', valA: pkA.stats.spe, valB: pkB.stats.spe, color: '#FA92B2' },
                  ].map(stat => {
                    const diff = stat.valA - stat.valB;
                    const maxStat = 255;
                    const pctA = (stat.valA / maxStat) * 100;
                    const pctB = (stat.valB / maxStat) * 100;

                    return (
                      <div key={stat.label} className="grid grid-cols-12 gap-3 items-center text-xs">
                        
                        {/* A value */}
                        <div className="col-span-2 text-right pr-2">
                          <span className={`font-mono font-bold ${diff > 0 ? 'text-green-400 font-extrabold' : diff < 0 ? 'text-slate-400' : 'text-slate-300'}`}>
                            {stat.valA}
                          </span>
                        </div>

                        {/* Visual Sliders bars comparison */}
                        <div className="col-span-8 flex flex-col gap-1 items-center justify-center relative">
                          <div className="w-full flex justify-between items-center text-[10px] text-slate-500 font-bold mb-0.5 select-none">
                            <span>{pkA.displayName}</span>
                            <span className="text-slate-400 uppercase tracking-wider">{stat.label}</span>
                            <span>{pkB.displayName}</span>
                          </div>
                          
                          {/* Split Dual Progress Bar */}
                          <div className="w-full grid grid-cols-2 gap-1.5 h-2">
                            {/* Bar A (Renders from right to left) */}
                            <div className="w-full bg-slate-950/40 rounded-l h-full flex justify-end">
                              <div
                                style={{ width: `${pctA}%`, backgroundColor: stat.color }}
                                className="h-full rounded-l transition-all duration-500"
                              />
                            </div>
                            {/* Bar B (Renders from left to right) */}
                            <div className="w-full bg-slate-950/40 rounded-r h-full flex justify-start">
                              <div
                                style={{ width: `${pctB}%`, backgroundColor: stat.color }}
                                className="h-full rounded-r transition-all duration-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* B value */}
                        <div className="col-span-2 text-left pl-2">
                          <span className={`font-mono font-bold ${diff < 0 ? 'text-green-400 font-extrabold' : diff > 0 ? 'text-slate-400' : 'text-slate-300'}`}>
                            {stat.valB}
                          </span>
                        </div>

                      </div>
                    );
                  })}

                  {/* BST comparative summary */}
                  <div className="grid grid-cols-12 gap-3 items-center text-sm font-bold border-t border-slate-900 pt-4 font-mono text-slate-400">
                    <div className="col-span-2 text-right pr-2">
                      <span className={pkA.stats.total > pkB.stats.total ? 'text-green-400 font-extrabold text-base' : 'text-slate-400'}>
                        {pkA.stats.total}
                      </span>
                    </div>
                    <div className="col-span-8 text-center text-xs tracking-wider uppercase text-slate-550">
                      Base Stat Total (BST) Difference:{' '}
                      <span className="font-extrabold text-blue-400">
                        {Math.abs(pkA.stats.total - pkB.stats.total)}
                      </span>
                    </div>
                    <div className="col-span-2 text-left pl-2">
                      <span className={pkB.stats.total > pkA.stats.total ? 'text-green-400 font-extrabold text-base' : 'text-slate-400'}>
                        {pkB.stats.total}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Training and Dimension Details */}
              {detailsA && detailsB && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Dimensions compare */}
                  <div className="glass-panel border-slate-850 p-6 rounded-3xl flex flex-col gap-4">
                    <h3 className="text-sm font-bold uppercase text-slate-200 border-b border-slate-900 pb-2.5">Dimensions & Breeding</h3>
                    <div className="flex flex-col gap-3 text-xs">
                      
                      <div className="grid grid-cols-3 py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">Height</span>
                        <span className="text-slate-250 font-semibold text-right">{detailsA.height / 10} m</span>
                        <span className="text-slate-250 font-semibold text-right">{detailsB.height / 10} m</span>
                      </div>

                      <div className="grid grid-cols-3 py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">Weight</span>
                        <span className="text-slate-250 font-semibold text-right">{detailsA.weight / 10} kg</span>
                        <span className="text-slate-250 font-semibold text-right">{detailsB.weight / 10} kg</span>
                      </div>

                      <div className="grid grid-cols-3 py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">Egg Groups</span>
                        <span className="text-slate-250 font-semibold text-right truncate">{detailsA.eggGroups.join(', ')}</span>
                        <span className="text-slate-250 font-semibold text-right truncate">{detailsB.eggGroups.join(', ')}</span>
                      </div>

                      <div className="grid grid-cols-3 py-1 border-b border-slate-900/40">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">Catch Rate</span>
                        <span className="text-slate-250 font-semibold text-right">{detailsA.catchRate}</span>
                        <span className="text-slate-250 font-semibold text-right">{detailsB.catchRate}</span>
                      </div>

                      <div className="grid grid-cols-3 py-1">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">Abilities</span>
                        <span className="text-slate-250 font-semibold text-right text-[10px] leading-tight truncate">
                          {detailsA.abilities.map(a => a.name).join(', ')}
                        </span>
                        <span className="text-slate-250 font-semibold text-right text-[10px] leading-tight truncate">
                          {detailsB.abilities.map(a => a.name).join(', ')}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Defensive Weaknesses comparative table */}
                  {effA && effB && (
                    <div className="glass-panel border-slate-850 p-6 rounded-3xl flex flex-col gap-4">
                      <h3 className="text-sm font-bold uppercase text-slate-200 border-b border-slate-900 pb-2.5">Type Effectiveness Comparison</h3>
                      <div className="flex flex-col gap-3.5 text-xs max-h-64 overflow-y-auto pr-1">
                        {Object.keys(effA).map(t => {
                          const multA = effA[t];
                          const multB = effB[t];
                          if (multA === 1 && multB === 1) return null; // hide neutral type matches to keep it clean

                          return (
                            <div key={t} className="grid grid-cols-3 py-1 border-b border-slate-900/40 items-center">
                              <span
                                style={{ color: TYPE_COLORS[t] }}
                                className="text-[9px] uppercase font-bold tracking-wider"
                              >
                                {t}
                              </span>
                              
                              <span className={`text-right font-mono font-bold ${multA > 1 ? 'text-rose-400' : multA < 1 ? 'text-green-400' : 'text-slate-400'}`}>
                                {multA}x
                              </span>

                              <span className={`text-right font-mono font-bold ${multB > 1 ? 'text-rose-400' : multB < 1 ? 'text-green-400' : 'text-slate-400'}`}>
                                {multB}x
                              </span>
                            </div>
                          );
                        }).filter(Boolean)}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Showdown Sets comparative view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="glass-panel border-slate-850 p-6 rounded-3xl flex flex-col gap-3">
                  <h3 className="text-sm font-bold uppercase text-slate-200 border-b border-slate-900 pb-2.5">Set (A) Showdown</h3>
                  <pre className="text-[10px] font-mono text-slate-350 bg-[#070b12] p-4 border border-slate-900 rounded-2xl overflow-x-auto select-all leading-normal whitespace-pre-wrap">
                    {showdownA}
                  </pre>
                </div>

                <div className="glass-panel border-slate-850 p-6 rounded-3xl flex flex-col gap-3">
                  <h3 className="text-sm font-bold uppercase text-slate-200 border-b border-slate-900 pb-2.5">Set (B) Showdown</h3>
                  <pre className="text-[10px] font-mono text-slate-350 bg-[#070b12] p-4 border border-slate-900 rounded-2xl overflow-x-auto select-all leading-normal whitespace-pre-wrap">
                    {showdownB}
                  </pre>
                </div>

              </div>

            </>
          )}

        </div>
      ) : (
        /* Unselected State */
        <div className="glass-panel rounded-3xl p-16 border border-slate-900 text-center flex flex-col items-center justify-center gap-6 min-h-[350px] mt-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 shadow-xl">
            <Scale className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Select Two Pokémon to Compare</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Use the search inputs above to choose any two Pokémon varieties from all 9 generations.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
