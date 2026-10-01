'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, RefreshCw, SlidersHorizontal, Heart, Search, HelpCircle, Volume2, Sparkle } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { filterPokemon, FilterCriteria } from '@/lib/pokemon/data';
import { TYPE_COLORS, GENERATIONS, CATEGORIES, SPECIAL_FORMS } from '@/lib/pokemon/constants';

function PokemonBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pokemonList, loading, error, toggleFavorite, isFavorite } = usePokemon();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGens, setSelectedGens] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [formsMode, setFormsMode] = useState<'all' | 'base_only' | 'mega_only' | 'regional_only'>('all');
  
  // Advanced Stat Filters
  const [minHp, setMinHp] = useState(0);
  const [minAtk, setMinAtk] = useState(0);
  const [minDef, setMinDef] = useState(0);
  const [minSpAtk, setMinSpAtk] = useState(0);
  const [minSpDef, setMinSpDef] = useState(0);
  const [minSpe, setMinSpe] = useState(0);
  const [isShinyMode, setIsShinyMode] = useState(false);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(24);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync state with URL params on mount
  useEffect(() => {
    if (loading || pokemonList.length === 0) return;

    const query = searchParams.get('q') || '';
    const urlGens = searchParams.get('gens');
    const urlTypes = searchParams.get('types');
    const urlCats = searchParams.get('cats');
    const urlForms = searchParams.get('forms');
    const urlHp = searchParams.get('minHp');
    const urlAtk = searchParams.get('minAtk');
    const urlDef = searchParams.get('minDef');
    const urlSpAtk = searchParams.get('minSpAtk');
    const urlSpDef = searchParams.get('minSpDef');
    const urlSpe = searchParams.get('minSpe');
    const urlShiny = searchParams.get('shiny');

    setSearchQuery(query);
    setSelectedGens(urlGens ? urlGens.split(',').map(Number).filter(Boolean) : []);
    setSelectedTypes(urlTypes ? urlTypes.split(',').filter(Boolean) : []);
    setSelectedCats(urlCats ? urlCats.split(',').filter(Boolean) : []);
    setFormsMode((urlForms === 'all' || urlForms === 'base_only' || urlForms === 'mega_only' || urlForms === 'regional_only') ? urlForms : 'all');
    setMinHp(urlHp ? Number(urlHp) : 0);
    setMinAtk(urlAtk ? Number(urlAtk) : 0);
    setMinDef(urlDef ? Number(urlDef) : 0);
    setMinSpAtk(urlSpAtk ? Number(urlSpAtk) : 0);
    setMinSpDef(urlSpDef ? Number(urlSpDef) : 0);
    setMinSpe(urlSpe ? Number(urlSpe) : 0);
    setIsShinyMode(urlShiny === 'true');
  }, [loading, pokemonList]);

  // Update URL Search Parameters
  const updateUrl = (
    query = searchQuery,
    gens = selectedGens,
    types = selectedTypes,
    cats = selectedCats,
    forms = formsMode,
    hp = minHp,
    atk = minAtk,
    def = minDef,
    spa = minSpAtk,
    spd = minSpDef,
    spe = minSpe,
    shiny = isShinyMode
  ) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (gens.length > 0) params.set('gens', gens.join(','));
    if (types.length > 0) params.set('types', types.join(','));
    if (cats.length > 0) params.set('cats', cats.join(','));
    if (forms !== 'all') params.set('forms', forms);
    if (hp > 0) params.set('minHp', hp.toString());
    if (atk > 0) params.set('minAtk', atk.toString());
    if (def > 0) params.set('minDef', def.toString());
    if (spa > 0) params.set('minSpAtk', spa.toString());
    if (spd > 0) params.set('minSpDef', spd.toString());
    if (spe > 0) params.set('minSpe', spe.toString());
    if (shiny) params.set('shiny', 'true');

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Perform filtering
  const filteredList = useMemo(() => {
    const criteria: FilterCriteria = {
      generations: selectedGens,
      types: selectedTypes,
      categories: selectedCats,
      formsMode,
      searchQuery,
      minHp: minHp > 0 ? minHp : undefined,
      minAtk: minAtk > 0 ? minAtk : undefined,
      minDef: minDef > 0 ? minDef : undefined,
      minSpAtk: minSpAtk > 0 ? minSpAtk : undefined,
      minSpDef: minSpDef > 0 ? minSpDef : undefined,
      minSpe: minSpe > 0 ? minSpe : undefined,
    };
    return filterPokemon(pokemonList, criteria);
  }, [pokemonList, selectedGens, selectedTypes, selectedCats, formsMode, searchQuery, minHp, minAtk, minDef, minSpAtk, minSpDef, minSpe]);

  // Reset page size whenever filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedGens, selectedTypes, selectedCats, formsMode, searchQuery, minHp, minAtk, minDef, minSpAtk, minSpDef, minSpe]);

  const visiblePokemon = useMemo(() => {
    return filteredList.slice(0, visibleCount);
  }, [filteredList, visibleCount]);

  const handleGenToggle = (gen: number) => {
    const next = selectedGens.includes(gen) 
      ? selectedGens.filter(g => g !== gen) 
      : [...selectedGens, gen];
    setSelectedGens(next);
    updateUrl(searchQuery, next, selectedTypes, selectedCats, formsMode);
  };

  const handleTypeToggle = (type: string) => {
    const next = selectedTypes.includes(type) 
      ? selectedTypes.filter(t => t !== type) 
      : [...selectedTypes, type];
    setSelectedTypes(next);
    updateUrl(searchQuery, selectedGens, next, selectedCats, formsMode);
  };

  const handleCatToggle = (cat: string) => {
    const next = selectedCats.includes(cat) 
      ? selectedCats.filter(c => c !== cat) 
      : [...selectedCats, cat];
    setSelectedCats(next);
    updateUrl(searchQuery, selectedGens, selectedTypes, next, formsMode);
  };

  const handleFormsChange = (mode: any) => {
    setFormsMode(mode);
    updateUrl(searchQuery, selectedGens, selectedTypes, selectedCats, mode);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl(val, selectedGens, selectedTypes, selectedCats, formsMode);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGens([]);
    setSelectedTypes([]);
    setSelectedCats([]);
    setFormsMode('all');
    setMinHp(0);
    setMinAtk(0);
    setMinDef(0);
    setMinSpAtk(0);
    setMinSpDef(0);
    setMinSpe(0);
    setIsShinyMode(false);
    updateUrl('', [], [], [], 'all', 0, 0, 0, 0, 0, 0, false);
  };

  const playCry = (id: number) => {
    import('@/lib/audio').then(({ playPokemonCry }) => playPokemonCry(id));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-semibold animate-pulse">Loading RogueDex database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-slate-200 mb-2">Error Connecting to Pokedex</h2>
        <p className="text-slate-450 text-sm max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            RogueDex <span className="text-blue-500">Database</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Browse through all {pokemonList.length} Pokémon varieties, regionals, and special forms.
          </p>
        </div>

        {/* Global Text Search */}
        <div className="relative w-full max-w-xs md:max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name, ID, or type..."
            className="w-full pl-10 pr-4 py-2 bg-[#111622] border border-slate-800 rounded-xl text-slate-250 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Filters Panel Left */}
        <div className={`lg:col-span-3 flex flex-col gap-5 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-5 shadow-lg border border-slate-850">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                Filter Database
              </h2>
              {(selectedGens.length > 0 || selectedTypes.length > 0 || selectedCats.length > 0 || formsMode !== 'all' || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Generations */}
            <div>
              <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Generations</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {GENERATIONS.map(gen => (
                  <button
                    key={gen.value}
                    onClick={() => handleGenToggle(gen.value)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border text-center transition-all ${
                      selectedGens.includes(gen.value)
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                        : 'bg-[#0b0e16] border-slate-850 text-slate-450 hover:text-slate-200 hover:border-slate-800'
                    }`}
                  >
                    Gen {gen.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Types */}
            <div>
              <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Types</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.keys(TYPE_COLORS).map(type => {
                  const isChecked = selectedTypes.includes(type);
                  const color = TYPE_COLORS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      style={{
                        backgroundColor: isChecked ? `${color}1a` : '#0b0e16',
                        borderColor: isChecked ? color : 'transparent',
                        color: isChecked ? color : '#8e96a3',
                      }}
                      className="py-1.5 px-2 rounded-lg text-[10px] uppercase font-bold border text-center transition-all hover:bg-slate-900"
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Category</h3>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => handleCatToggle(cat.value)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition-all ${
                      selectedCats.includes(cat.value)
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                        : 'bg-[#0b0e16] border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shiny Mode Selector */}
            <div className="border-t border-slate-850 pt-3">
              <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Extras</h3>
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-[11px] select-none">
                <input
                  type="checkbox"
                  checked={isShinyMode}
                  onChange={(e) => {
                    const shiny = e.target.checked;
                    setIsShinyMode(shiny);
                    updateUrl(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, shiny);
                  }}
                  className="sr-only"
                />
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  isShinyMode ? 'bg-amber-500 border-amber-450' : 'border-slate-800 bg-[#0b0e16]'
                }`}>
                  {isShinyMode && <div className="w-1.5 h-1.5 bg-slate-950 rounded-sm" />}
                </div>
                <span className="flex items-center gap-1 font-semibold">✨ Shiny Mode</span>
              </label>
            </div>

            {/* Minimum Stats Sliders */}
            <div className="border-t border-slate-850 pt-3">
              <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-3">Minimum Stats</h3>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'hp', label: 'HP', val: minHp, set: setMinHp },
                  { key: 'atk', label: 'ATK', val: minAtk, set: setMinAtk },
                  { key: 'def', label: 'DEF', val: minDef, set: setMinDef },
                  { key: 'spAtk', label: 'SPA', val: minSpAtk, set: setMinSpAtk },
                  { key: 'spDef', label: 'SPD', val: minSpDef, set: setMinSpDef },
                  { key: 'spe', label: 'SPE', val: minSpe, set: setMinSpe },
                ].map(stat => (
                  <div key={stat.key}>
                    <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                      <span className="text-slate-450 uppercase">{stat.label}</span>
                      <span className="text-slate-350 font-mono">{stat.val}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="220"
                      step="5"
                      value={stat.val}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        stat.set(val);
                        const hp = stat.key === 'hp' ? val : minHp;
                        const atk = stat.key === 'atk' ? val : minAtk;
                        const def = stat.key === 'def' ? val : minDef;
                        const spa = stat.key === 'spAtk' ? val : minSpAtk;
                        const spd = stat.key === 'spDef' ? val : minSpDef;
                        const spe = stat.key === 'spe' ? val : minSpe;
                        updateUrl(undefined, undefined, undefined, undefined, undefined, hp, atk, def, spa, spd, spe);
                      }}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Forms inclusion */}
            <div className="border-t border-slate-850 pt-3">
              <h3 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2">Special Forms</h3>
              <div className="flex flex-col gap-1.5">
                {SPECIAL_FORMS.map(form => (
                  <label key={form.value} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-[11px]">
                    <input
                      type="radio"
                      name="formsMode"
                      checked={formsMode === form.value}
                      onChange={() => handleFormsChange(form.value)}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      formsMode === form.value ? 'border-blue-500 bg-blue-600/10' : 'border-slate-800 bg-transparent'
                    }`}>
                      {formsMode === form.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </div>
                    {form.label}
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Database grid view */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {filteredList.length > 0 ? (
            <>
              <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-900 pb-2">
                <span>SHOWING {visiblePokemon.length} OF {filteredList.length} RESULTS</span>
                <span className="font-semibold text-slate-400">{pokemonList.length} Total in Database</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visiblePokemon.map(pk => {
                  const primaryType = pk.types[0];
                  const typeColor = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
                  
                  return (
                    <div
                      key={pk.id}
                      className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col items-center relative border border-slate-850 group cursor-pointer"
                      onClick={(e) => {
                        // Avoid trigger detail view if favorite button was clicked
                        if ((e.target as HTMLElement).closest('.fav-btn')) return;
                        router.push(`/pokemon/${pk.name}`);
                      }}
                    >
                      {/* ID tag */}
                      <span className="absolute top-3.5 left-4 text-[10px] font-bold font-mono text-slate-500">
                        #{pk.id.toString().padStart(3, '0')}
                      </span>

                      {/* Play Cry Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playCry(pk.id);
                        }}
                        className="play-cry-btn absolute top-3 right-10 p-1.5 rounded-full bg-slate-900/60 border border-slate-800/40 hover:bg-slate-800 text-slate-450 hover:text-slate-100 transition-colors z-10"
                        title="Play Cry"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(pk.id)}
                        className="fav-btn absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 border border-slate-800/40 hover:bg-slate-800 text-slate-450 hover:text-slate-100 transition-colors z-10"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isFavorite(pk.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-450'
                          }`}
                        />
                      </button>

                      {/* Artwork thumbnail */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative my-3">
                        <div
                          style={{ backgroundColor: `${typeColor}08` }}
                          className="absolute inset-0 rounded-full blur-xl animate-pulse scale-90"
                        />
                        <img
                          src={isShinyMode ? pk.shinySprite : pk.sprite}
                          alt={pk.displayName}
                          className="w-full h-full object-contain relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>

                      {/* Name */}
                      <h3 className="font-extrabold text-sm text-slate-200 text-center tracking-tight truncate w-full group-hover:text-blue-400 transition-colors flex items-center justify-center gap-1 px-2">
                        {isShinyMode && <Sparkle className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                        {pk.displayName}
                      </h3>

                      {/* Badges */}
                      <div className="flex gap-1 mt-2.5 flex-wrap justify-center">
                        {pk.types.map(t => (
                          <span
                            key={t}
                            style={{
                              backgroundColor: `${TYPE_COLORS[t]}18`,
                              color: TYPE_COLORS[t],
                              borderColor: `${TYPE_COLORS[t]}2b`,
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Trigger */}
              {visibleCount < filteredList.length && (
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="w-full py-3 bg-[#111622] hover:bg-[#181e2b] border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white font-bold rounded-xl text-center text-sm transition-colors mt-4"
                >
                  Load More Pokémon
                </button>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="glass-panel rounded-3xl p-12 border border-slate-900 text-center flex flex-col items-center justify-center gap-6 min-h-[300px] mt-6">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-1">No Pokémon Match Search Filters</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Try clearing your search query or expanding filter selections (generation or types).
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full transition-all duration-200"
              >
                Clear Search & Filters
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default function PokemonBrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      }
    >
      <PokemonBrowseContent />
    </Suspense>
  );
}
