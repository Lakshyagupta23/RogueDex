'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, Lock, Unlock, Copy, Heart, Save, Eye, Clipboard, HelpCircle, Sparkles, Volume2, Sparkle } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { getRandomTeam, getRandomPokemon, FilterCriteria } from '@/lib/pokemon/data';
import { analyzeTeam } from '@/lib/pokemon/analysis';
import { generateShowdownTeam } from '@/lib/pokemon/showdown';
import { TYPE_COLORS, GENERATIONS, POKEMON_TYPES } from '@/lib/pokemon/constants';

function TeamBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pokemonList, loading, error, saveTeam, toggleFavorite, isFavorite } = usePokemon();

  // Settings state
  const [teamSize, setTeamSize] = useState<3 | 6>(6);
  const [selectedGens, setSelectedGens] = useState<number[]>([]);
  const [restrictType, setRestrictType] = useState<string>('any');
  const [legendaryRule, setLegendaryRule] = useState<'allow' | 'disallow' | 'only' | 'disallow_all' | 'only_all'>('allow');
  const [fullyEvolvedOnly, setFullyEvolvedOnly] = useState(false);
  const [isCompetitiveMode, setIsCompetitiveMode] = useState(false);
  const [allowDuplicateTypes, setAllowDuplicateTypes] = useState(true);

  // Stat minimum sliders
  const [minHp, setMinHp] = useState(0);
  const [minAtk, setMinAtk] = useState(0);
  const [minDef, setMinDef] = useState(0);
  const [minSpAtk, setMinSpAtk] = useState(0);
  const [minSpDef, setMinSpDef] = useState(0);
  const [minSpe, setMinSpe] = useState(0);
  const [isShinyMode, setIsShinyMode] = useState(false);

  // Active Team State
  const [team, setTeam] = useState<(PokemonIndexItem | null)[]>(Array(6).fill(null));
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(Array(6).fill(false));
  const [spinningSlots, setSpinningSlots] = useState<boolean[]>(Array(6).fill(false));

  // Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamNotes, setTeamNotes] = useState('');
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Initial State Sync (Check for shared team via ?team=1,4,7...)
  useEffect(() => {
    if (loading || pokemonList.length === 0) return;

    const urlTeam = searchParams.get('team');
    if (urlTeam) {
      const ids = urlTeam.split(',').map(Number).filter(Boolean);
      const loaded: (PokemonIndexItem | null)[] = ids
        .map(id => pokemonList.find(pk => pk.id === id) || null)
        .filter(Boolean);
      
      // Pad to length 6
      const padded = [...loaded, ...Array(6 - loaded.length).fill(null)].slice(0, 6);
      setTeam(padded);
      setTeamSize(loaded.length <= 3 ? 3 : 6);
    } else {
      // Auto-generate initial team
      handleGenerateTeam(6);
    }
  }, [loading, pokemonList]);

  // Adjust team array size when size settings toggle
  useEffect(() => {
    setTeam(prev => {
      if (teamSize === 3) {
        return prev.slice(0, 3);
      } else {
        const next = [...prev];
        while (next.length < 6) next.push(null);
        return next;
      }
    });
    setLockedSlots(prev => {
      if (teamSize === 3) return prev.slice(0, 3);
      const next = [...prev];
      while (next.length < 6) next.push(false);
      return next;
    });
    setSpinningSlots(prev => {
      if (teamSize === 3) return prev.slice(0, 3);
      const next = [...prev];
      while (next.length < 6) next.push(false);
      return next;
    });
  }, [teamSize]);

  // Compute filter criteria based on rules
  const filterCriteria = useMemo((): FilterCriteria => {
    const categories: string[] = [];
    if (fullyEvolvedOnly) categories.push('fully_evolved');

    const types = restrictType !== 'any' ? [restrictType] : [];

    return {
      generations: selectedGens,
      types,
      categories,
      minBst: isCompetitiveMode ? 450 : undefined,
      minHp: minHp > 0 ? minHp : undefined,
      minAtk: minAtk > 0 ? minAtk : undefined,
      minDef: minDef > 0 ? minDef : undefined,
      minSpAtk: minSpAtk > 0 ? minSpAtk : undefined,
      minSpDef: minSpDef > 0 ? minSpDef : undefined,
      minSpe: minSpe > 0 ? minSpe : undefined,
    };
  }, [selectedGens, restrictType, legendaryRule, fullyEvolvedOnly, isCompetitiveMode, minHp, minAtk, minDef, minSpAtk, minSpDef, minSpe]);

  // Custom filter helper applying legendary rules & duplicate types check
  const getEligibleList = (currentTeam: (PokemonIndexItem | null)[], excludeSlotIdx?: number) => {
    return pokemonList.filter(pk => {
      // 1. Core criteria
      const matchingGens = selectedGens.length === 0 || selectedGens.includes(pk.generation);
      if (!matchingGens) return false;

      const matchingType = restrictType === 'any' || pk.types.includes(restrictType);
      if (!matchingType) return false;

      if (fullyEvolvedOnly && !pk.isFullyEvolved) return false;
      if (isCompetitiveMode && pk.stats.total < 450) return false;

      // Stat filters
      if (minHp > 0 && pk.stats.hp < minHp) return false;
      if (minAtk > 0 && pk.stats.atk < minAtk) return false;
      if (minDef > 0 && pk.stats.def < minDef) return false;
      if (minSpAtk > 0 && pk.stats.spAtk < minSpAtk) return false;
      if (minSpDef > 0 && pk.stats.spDef < minSpDef) return false;
      if (minSpe > 0 && pk.stats.spe < minSpe) return false;

      // 2. Legendary Rule
      if (legendaryRule === 'disallow' && (pk.isLegendary || pk.isMythical)) return false;
      if (legendaryRule === 'disallow_all' && (pk.isLegendary || pk.isMythical || pk.isParadox || pk.isUltraBeast)) return false;
      if (legendaryRule === 'only' && !pk.isLegendary && !pk.isMythical) return false;
      if (legendaryRule === 'only_all' && !pk.isLegendary && !pk.isMythical && !pk.isParadox && !pk.isUltraBeast) return false;

      // 3. Duplicate species check (exclude checking the slot being rerolled)
      const isAlreadyInTeam = currentTeam.some((member, idx) => 
        idx !== excludeSlotIdx && member && member.speciesId === pk.speciesId
      );
      if (isAlreadyInTeam) return false;

      // 4. Duplicate Type check
      if (!allowDuplicateTypes) {
        const teamTypes = currentTeam
          .filter((member, idx) => idx !== excludeSlotIdx && member)
          .flatMap(member => member!.types);
        
        const sharesType = pk.types.some(t => teamTypes.includes(t));
        if (sharesType) return false;
      }

      return true;
    });
  };

  // Generate Entire Team (respecting locks)
  const handleGenerateTeam = (targetSize = teamSize) => {
    if (pokemonList.length === 0) return;

    setTeam(prev => {
      const newTeam = [...prev];
      const nextSpinning = Array(targetSize).fill(false);

      // Trigger spin animations for unlocked slots
      for (let i = 0; i < targetSize; i++) {
        if (!lockedSlots[i]) {
          nextSpinning[i] = true;
        }
      }
      setSpinningSlots(nextSpinning);

      let ticks = 0;
      const maxTicks = 6;
      const interval = setInterval(() => {
        setTeam(current => {
          const spinningTeam = [...current];
          for (let i = 0; i < targetSize; i++) {
            if (!lockedSlots[i]) {
              spinningTeam[i] = pokemonList[Math.floor(Math.random() * pokemonList.length)];
            }
          }
          return spinningTeam;
        });
        ticks++;

        if (ticks >= maxTicks) {
          clearInterval(interval);
          setTeam(final => {
            const finalTeam = [...final];
            for (let i = 0; i < targetSize; i++) {
              if (!lockedSlots[i]) {
                const eligible = getEligibleList(finalTeam, i);
                if (eligible.length > 0) {
                  finalTeam[i] = eligible[Math.floor(Math.random() * eligible.length)];
                } else {
                  // fallback to standard random
                  const fallback = getRandomPokemon(pokemonList, filterCriteria);
                  finalTeam[i] = fallback;
                }
              }
            }
            // Sync to URL query param
            const validIds = finalTeam.filter(Boolean).map(pk => pk!.id);
            const params = new URLSearchParams(searchParams);
            params.set('team', validIds.join(','));
            router.replace(`?${params.toString()}`, { scroll: false });
            return finalTeam;
          });
          setSpinningSlots(Array(targetSize).fill(false));
        }
      }, 70);

      return newTeam;
    });
  };

  // Reroll single slot
  const handleRerollSlot = (slotIdx: number) => {
    if (spinningSlots[slotIdx]) return;
    
    setSpinningSlots(prev => {
      const next = [...prev];
      next[slotIdx] = true;
      return next;
    });

    let ticks = 0;
    const maxTicks = 6;
    const interval = setInterval(() => {
      setTeam(current => {
        const next = [...current];
        next[slotIdx] = pokemonList[Math.floor(Math.random() * pokemonList.length)];
        return next;
      });
      ticks++;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setTeam(final => {
          const next = [...final];
          const eligible = getEligibleList(next, slotIdx);
          if (eligible.length > 0) {
            next[slotIdx] = eligible[Math.floor(Math.random() * eligible.length)];
          } else {
            const fallback = getRandomPokemon(pokemonList, filterCriteria);
            next[slotIdx] = fallback;
          }
          // Sync URL
          const validIds = next.filter(Boolean).map(pk => pk!.id);
          const params = new URLSearchParams(searchParams);
          params.set('team', validIds.join(','));
          router.replace(`?${params.toString()}`, { scroll: false });
          return next;
        });
        setSpinningSlots(prev => {
          const next = [...prev];
          next[slotIdx] = false;
          return next;
        });
      }
    }, 70);
  };

  const handleLockToggle = (slotIdx: number) => {
    setLockedSlots(prev => {
      const next = [...prev];
      next[slotIdx] = !next[slotIdx];
      return next;
    });
  };

  // Calculate synergy analysis
  const activeTeamItems = useMemo(() => {
    return team.filter(Boolean) as PokemonIndexItem[];
  }, [team]);

  const analysis = useMemo(() => {
    return analyzeTeam(activeTeamItems);
  }, [activeTeamItems]);

  const showToastNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Save Team triggered
  const handleSaveTeam = () => {
    if (activeTeamItems.length === 0) return;
    saveTeam(teamName, activeTeamItems, teamNotes);
    setTeamName('');
    setTeamNotes('');
    setShowSaveModal(false);
    showToastNotification('Team saved successfully!');
  };

  // Copy Share Link
  const handleCopyShareLink = () => {
    const validIds = activeTeamItems.map(pk => pk.id);
    if (validIds.length === 0) return;
    
    const url = `${window.location.origin}${window.location.pathname}?team=${validIds.join(',')}`;
    navigator.clipboard.writeText(url);
    showToastNotification('Share link copied to clipboard!');
  };

  // Export Showdown
  const showdownText = useMemo(() => {
    return generateShowdownTeam(activeTeamItems);
  }, [activeTeamItems]);

  const handleCopyShowdown = () => {
    navigator.clipboard.writeText(showdownText);
    showToastNotification('Showdown text copied to clipboard!');
    setShowExportModal(false);
  };

  const playCry = (speciesId: number) => {
    const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/cries/latest/${speciesId}.ogg`);
    audio.volume = 0.45;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-450 font-semibold animate-pulse">Loading Team Builder...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-blue-500 text-slate-100 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce duration-300">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Title */}
      <div className="border-b border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            RogueDex <span className="text-blue-500">Team Builder</span>
          </h1>
          <p className="text-slate-450 text-sm">
            Generate balanced drafts or random teams, analyze weaknesses, and export to Showdown.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTeamSize(3)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              teamSize === 3
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-[#111622] border-slate-800 text-slate-400'
            }`}
          >
            3-Pokémon
          </button>
          <button
            onClick={() => setTeamSize(6)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              teamSize === 6
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-[#111622] border-slate-800 text-slate-400'
            }`}
          >
            6-Pokémon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Rules Sidebar Left */}
        <div className="lg:col-span-3">
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-5 border border-slate-850 shadow-md">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-bold text-slate-200 text-sm">Drafting Rules</h2>
              <span className="text-[10px] text-slate-550 font-bold uppercase">Settings</span>
            </div>

            {/* Gen Select */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Generation</h3>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => {
                  const active = selectedGens.includes(gen);
                  return (
                    <button
                      key={gen}
                      onClick={() => {
                        setSelectedGens(prev => 
                          prev.includes(gen) ? prev.filter(g => g !== gen) : [...prev, gen]
                        );
                      }}
                      className={`py-1 text-center rounded text-[10px] font-bold border transition-colors ${
                        active
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                          : 'bg-[#0b0e16] border-slate-850 text-slate-450 hover:text-slate-350'
                      }`}
                    >
                      Gen {gen}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lock Type */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Restrict Type</h3>
              <select
                value={restrictType}
                onChange={(e) => setRestrictType(e.target.value)}
                className="w-full bg-[#0b0e16] border border-slate-800 text-slate-350 text-xs rounded-lg p-2 focus:outline-none"
              >
                <option value="any">Any / Random Type</option>
                {POKEMON_TYPES.map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>

            {/* Legendary Rule */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Legendary Rules</h3>
              <select
                value={legendaryRule}
                onChange={(e) => setLegendaryRule(e.target.value as any)}
                className="w-full bg-[#0b0e16] border border-slate-800 text-slate-350 text-xs rounded-lg p-2 focus:outline-none"
              >
                <option value="allow">Allow Legendary/Mythical</option>
                <option value="disallow">Disallow Legendaries</option>
                <option value="disallow_all">Disallow All (Leg/Myth/Paradox/UB)</option>
                <option value="only">Only Legendary/Mythical</option>
                <option value="only_all">Only All (Leg/Myth/Paradox/UB)</option>
              </select>
            </div>

            {/* Toggle Rules */}
            <div className="flex flex-col gap-3 border-t border-slate-850 pt-3">
              <label className="flex items-center gap-3 cursor-pointer text-slate-350 hover:text-white text-xs select-none">
                <input
                  type="checkbox"
                  checked={fullyEvolvedOnly}
                  onChange={(e) => setFullyEvolvedOnly(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  fullyEvolvedOnly ? 'bg-blue-600 border-blue-500' : 'border-slate-800 bg-[#0b0e16]'
                }`}>
                  {fullyEvolvedOnly && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                </div>
                Fully Evolved Only
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-350 hover:text-white text-xs select-none">
                <input
                  type="checkbox"
                  checked={isCompetitiveMode}
                  onChange={(e) => setIsCompetitiveMode(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isCompetitiveMode ? 'bg-blue-600 border-blue-500' : 'border-slate-800 bg-[#0b0e16]'
                }`}>
                  {isCompetitiveMode && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                </div>
                Competitive Mode (BST &ge; 450)
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-350 hover:text-white text-xs select-none">
                <input
                  type="checkbox"
                  checked={!allowDuplicateTypes}
                  onChange={(e) => setAllowDuplicateTypes(!e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  !allowDuplicateTypes ? 'bg-blue-600 border-blue-500' : 'border-slate-800 bg-[#0b0e16]'
                }`}>
                  {!allowDuplicateTypes && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                </div>
                Unique Types Only
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-350 hover:text-white text-xs select-none">
                <input
                  type="checkbox"
                  checked={isShinyMode}
                  onChange={(e) => setIsShinyMode(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isShinyMode ? 'bg-amber-500 border-amber-450' : 'border-slate-800 bg-[#0b0e16]'
                }`}>
                  {isShinyMode && <div className="w-1.5 h-1.5 bg-slate-950 rounded-sm" />}
                </div>
                <span className="flex items-center gap-1">✨ Shiny Mode</span>
              </label>
            </div>

            {/* Minimum Stats Sliders */}
            <div className="flex flex-col gap-4 border-t border-slate-850 pt-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Minimum Stats</h3>
              <div className="flex flex-col gap-3.5">
                {[
                  { key: 'hp', label: 'HP', val: minHp, set: setMinHp },
                  { key: 'atk', label: 'ATK', val: minAtk, set: setMinAtk },
                  { key: 'def', label: 'DEF', val: minDef, set: setMinDef },
                  { key: 'spAtk', label: 'SPA', val: minSpAtk, set: setMinSpAtk },
                  { key: 'spDef', label: 'SPD', val: minSpDef, set: setMinSpDef },
                  { key: 'spe', label: 'SPE', val: minSpe, set: setMinSpe },
                ].map(stat => (
                  <div key={stat.key}>
                    <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                      <span className="text-slate-450 uppercase">{stat.label}</span>
                      <span className="text-slate-300 font-mono">{stat.val}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="220"
                      step="5"
                      value={stat.val}
                      onChange={(e) => stat.set(Number(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Team Slots Middle Area */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {team.slice(0, teamSize).map((member, idx) => {
              const primaryType = member?.types[0] || 'normal';
              const typeColor = TYPE_COLORS[primaryType];
              const isLocked = lockedSlots[idx];
              const isSpinning = spinningSlots[idx];

              return (
                <div
                  key={idx}
                  className={`glass-panel rounded-2xl p-4 flex flex-col items-center relative border border-slate-850 ${
                    member ? 'min-h-[220px]' : 'min-h-[220px] justify-center'
                  } overflow-hidden group`}
                >
                  
                  {/* Slot index number */}
                  <span className="absolute top-3 left-4 text-[10px] font-bold font-mono text-slate-500 select-none">
                    SLOT 0{idx + 1}
                  </span>

                  {/* Actions buttons header */}
                  <div className="absolute top-2.5 right-3 flex items-center gap-1 z-10">
                    {member && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playCry(member.speciesId);
                        }}
                        className="p-1 rounded-full bg-slate-900/60 border border-slate-800/40 text-slate-400 hover:text-slate-100 transition-colors"
                        title="Play Cry"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                    {member && (
                      <button
                        onClick={() => handleLockToggle(idx)}
                        className={`p-1 rounded-full border text-xs transition-colors ${
                          isLocked 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-slate-900/60 border-slate-800/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    )}
                    {member && !isLocked && (
                      <button
                        onClick={() => handleRerollSlot(idx)}
                        className="p-1 rounded-full bg-slate-900/60 border border-slate-800/40 text-slate-450 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {member ? (
                    <>
                      {/* Sprite artwork */}
                      <div className="w-20 h-20 flex items-center justify-center relative my-3">
                        <div
                          style={{ backgroundColor: `${typeColor}08` }}
                          className="absolute inset-0 rounded-full blur-xl animate-pulse scale-90"
                        />
                        <img
                          src={isShinyMode ? member.shinySprite : member.sprite}
                          alt={member.displayName}
                          className={`w-full h-full object-contain relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-transform duration-500 ${
                            isSpinning ? 'scale-90 rotate-12 blur-[1px]' : 'group-hover:scale-105'
                          }`}
                        />
                      </div>

                      {/* Info details */}
                      <h4 className="font-extrabold text-xs text-slate-200 text-center tracking-tight truncate w-full group-hover:text-blue-400 transition-colors flex items-center justify-center gap-0.5 px-2">
                        {isShinyMode && <Sparkle className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                        {member.displayName}
                      </h4>
                      <span className="text-[9px] font-mono text-slate-550">
                        #{member.id.toString().padStart(3, '0')}
                      </span>

                      {/* Badges */}
                      <div className="flex gap-1 mt-2">
                        {member.types.map(t => (
                          <span
                            key={t}
                            style={{
                              backgroundColor: `${TYPE_COLORS[t]}18`,
                              color: TYPE_COLORS[t],
                              borderColor: `${TYPE_COLORS[t]}2c`,
                            }}
                            className="text-[8px] font-extrabold uppercase px-1 rounded border"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Showdown detailed lookup */}
                      <a
                        href={`/pokemon/${member.name}`}
                        className="text-[9px] font-bold text-slate-500 hover:text-blue-400 transition-colors mt-3.5"
                      >
                        Profile &rarr;
                      </a>
                    </>
                  ) : (
                    /* Locked Empty State Slot */
                    <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-550 select-none">
                      <HelpCircle className="w-8 h-8 text-slate-800" />
                      <span className="text-[11px] font-bold uppercase">Empty Slot</span>
                      <button
                        onClick={() => handleRerollSlot(idx)}
                        className="text-[10px] font-semibold text-blue-500 hover:text-blue-400 hover:underline transition-all mt-1"
                      >
                        Reroll slot
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleGenerateTeam()}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/40 hover:shadow-blue-500/20 active:scale-98 flex items-center justify-center gap-2 border border-blue-400/20 text-sm"
            >
              <RefreshCw className="w-4 h-4 animate-spin-hover" />
              REROLL UNLOCKED SLOTS
            </button>
          </div>

        </div>

        {/* Analysis & Actions Sidebar Right */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Global actions */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border border-slate-850">
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={activeTeamItems.length === 0}
              className="w-full py-2.5 bg-[#161c2b] hover:bg-[#1f2638] border border-slate-800 text-slate-200 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-blue-500" />
              Save Team Locally
            </button>
            
            <button
              onClick={handleCopyShareLink}
              disabled={activeTeamItems.length === 0}
              className="w-full py-2.5 bg-[#161c2b] hover:bg-[#1f2638] border border-slate-800 text-slate-200 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              Copy Share Link
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              disabled={activeTeamItems.length === 0}
              className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Export to Showdown
            </button>
          </div>

          {/* Analysis details */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 border border-slate-850">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="font-extrabold text-slate-200 text-xs">Team Analysis</h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Coverage</span>
            </div>

            {/* Type coverage score */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-slate-450">Type Coverage</span>
                <span className="text-blue-450 font-mono font-bold">{analysis.typeCoverage.percentage}%</span>
              </div>
              <div className="h-2 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/40">
                <div
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-500"
                  style={{ width: `${analysis.typeCoverage.percentage}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-550 block mt-1">
                Hits {analysis.typeCoverage.coveredTypes.length} / 18 types for super-effective damage.
              </span>
            </div>

            {/* Weaknesses list */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Weaknesses</h3>
              {analysis.weaknesses.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {analysis.weaknesses.slice(0, 4).map(w => (
                    <div key={w.type} className="flex justify-between items-center text-[11px]">
                      <span
                        className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] text-slate-950"
                        style={{ backgroundColor: TYPE_COLORS[w.type] }}
                      >
                        {w.type}
                      </span>
                      <span className="text-rose-500 font-semibold font-mono">
                        {w.count} members weak
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-550 italic block">No critical type weaknesses found.</span>
              )}
            </div>

            {/* Strengths list */}
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Resistances</h3>
              {analysis.strengths.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {analysis.strengths.slice(0, 4).map(s => (
                    <div key={s.type} className="flex justify-between items-center text-[11px]">
                      <span
                        className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] text-slate-950"
                        style={{ backgroundColor: TYPE_COLORS[s.type] }}
                      >
                        {s.type}
                      </span>
                      <span className="text-emerald-500 font-semibold font-mono">
                        {s.count} members resist
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-550 italic block">No major shared resistances.</span>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Save Team Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Save Team to Registry</h3>
            <p className="text-slate-450 text-xs mb-4">Store this draft in your local browser storage for later challenges.</p>
            
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Nuzlocke Core Team"
                  className="w-full bg-[#0b0e16] border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">Team Notes / Rules</label>
                <textarea
                  value={teamNotes}
                  onChange={(e) => setTeamNotes(e.target.value)}
                  placeholder="Describe your challenge run rules or strategies..."
                  rows={3}
                  className="w-full bg-[#0b0e16] border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 bg-transparent border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-450 hover:text-slate-200 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={!teamName.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl text-xs transition-all"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Showdown Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-[#111622] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Pokémon Showdown Importable Text</h3>
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">Formated Set</span>
            </div>
            
            <textarea
              readOnly
              value={showdownText}
              rows={12}
              className="w-full bg-[#0b0e16] border border-slate-850 rounded-xl px-4 py-3 text-xs font-mono text-slate-350 focus:outline-none mb-6 resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2.5 bg-transparent border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-450 hover:text-slate-200 font-semibold text-xs transition-all"
              >
                Close
              </button>
              <button
                onClick={handleCopyShowdown}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Copy Showdown Sets
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TeamBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      }
    >
      <TeamBuilderContent />
    </Suspense>
  );
}
