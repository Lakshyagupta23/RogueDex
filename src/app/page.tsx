'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Heart, RefreshCw, SlidersHorizontal, Trash2, HelpCircle, Sparkles, Volume2, Sparkle, Lock, Unlock, Sword } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { getRandomPokemon, FilterCriteria, filterPokemon } from '@/lib/pokemon/data';
import { TYPE_COLORS, TYPE_GLOWS, TYPE_GRADIENTS, GENERATIONS, CATEGORIES, SPECIAL_FORMS } from '@/lib/pokemon/constants';
import { generateShowdownTeam } from '@/lib/pokemon/showdown';
import StatBar from '@/components/StatBar';

// Helper to pre-load image assets dynamically before rendering to prevent visual flash
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    const img = new globalThis.Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
};

function RandomizerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pokemonList, loading, error, toggleFavorite, isFavorite } = usePokemon();

  // 1. Filter States
  const [selectedGens, setSelectedGens] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeMatchMode, setTypeMatchMode] = useState<'primary' | 'secondary' | 'either' | 'both'>('either');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [formsMode, setFormsMode] = useState<'all' | 'base_only' | 'mega_only' | 'regional_only'>('all');

  // Stat minimum sliders
  const [minHp, setMinHp] = useState(0);
  const [minAtk, setMinAtk] = useState(0);
  const [minDef, setMinDef] = useState(0);
  const [minSpAtk, setMinSpAtk] = useState(0);
  const [minSpDef, setMinSpDef] = useState(0);
  const [minSpe, setMinSpe] = useState(0);
  const [isShinyMode, setIsShinyMode] = useState(false);
  const [maxBst600, setMaxBst600] = useState(false);
  const [uniqueOnly, setUniqueOnly] = useState(false);

  // Exclusions states
  const [excludeLegendary, setExcludeLegendary] = useState(false);
  const [excludeMythical, setExcludeMythical] = useState(false);
  const [excludeParadox, setExcludeParadox] = useState(false);
  const [excludeStarters, setExcludeStarters] = useState(false);
  const [excludeUltraBeast, setExcludeUltraBeast] = useState(false);
  const [excludeAlolan, setExcludeAlolan] = useState(false);
  const [excludeGalarian, setExcludeGalarian] = useState(false);
  const [excludeHisuian, setExcludeHisuian] = useState(false);
  const [excludePaldean, setExcludePaldean] = useState(false);

  // 2. Quantity & Grid States
  const [quantity, setQuantity] = useState<number>(1);
  const [results, setResults] = useState<(PokemonIndexItem | null)[]>(Array(24).fill(null));
  const [lockedSlots, setLockedSlots] = useState<boolean[]>(Array(24).fill(false));
  const [spinningSlots, setSpinningSlots] = useState<boolean[]>(Array(24).fill(false));
  const [isExporting, setIsExporting] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [recents, setRecents] = useState<PokemonIndexItem[]>([]);

  // Parse URL search parameters on mount
  useEffect(() => {
    if (loading || pokemonList.length === 0) return;

    const urlGens = searchParams.get('gens');
    const urlTypes = searchParams.get('types');
    const urlTypeMode = searchParams.get('typeMode');
    const urlCats = searchParams.get('cats');
    const urlForms = searchParams.get('forms');
    const urlHp = searchParams.get('minHp');
    const urlAtk = searchParams.get('minAtk');
    const urlDef = searchParams.get('minDef');
    const urlSpAtk = searchParams.get('minSpAtk');
    const urlSpDef = searchParams.get('minSpDef');
    const urlSpe = searchParams.get('minSpe');
    const urlShiny = searchParams.get('shiny');
    const urlQty = searchParams.get('qty');

    // Exclusions
    const urlExLeg = searchParams.get('exLeg') === 'true';
    const urlExMyth = searchParams.get('exMyth') === 'true';
    const urlExParadox = searchParams.get('exParadox') === 'true';
    const urlExStarters = searchParams.get('exStarters') === 'true';
    const urlExUltra = searchParams.get('exUltra') === 'true';
    const urlExAlola = searchParams.get('exAlola') === 'true';
    const urlExGalar = searchParams.get('exGalar') === 'true';
    const urlExHisui = searchParams.get('exHisui') === 'true';
    const urlExPaldea = searchParams.get('exPaldea') === 'true';

    const gens = urlGens ? urlGens.split(',').map(Number).filter(Boolean) : [];
    const types = urlTypes ? urlTypes.split(',').filter(Boolean) : [];
    const tMode = (urlTypeMode === 'primary' || urlTypeMode === 'secondary' || urlTypeMode === 'either' || urlTypeMode === 'both') 
      ? urlTypeMode 
      : 'either';
    const cats = urlCats ? urlCats.split(',').filter(Boolean) : [];
    const forms = (urlForms === 'all' || urlForms === 'base_only' || urlForms === 'mega_only' || urlForms === 'regional_only') 
      ? urlForms 
      : 'all';

    const hp = urlHp ? Number(urlHp) : 0;
    const atk = urlAtk ? Number(urlAtk) : 0;
    const def = urlDef ? Number(urlDef) : 0;
    const spa = urlSpAtk ? Number(urlSpAtk) : 0;
    const spd = urlSpDef ? Number(urlSpDef) : 0;
    const spe = urlSpe ? Number(urlSpe) : 0;
    const shiny = urlShiny === 'true';
    const qty = urlQty ? Number(urlQty) : 1;
    const max600 = searchParams.get('maxBst600') === 'true';
    const unique = searchParams.get('uniqueOnly') === 'true';

    setSelectedGens(gens);
    setSelectedTypes(types);
    setTypeMatchMode(tMode);
    setSelectedCats(cats);
    setFormsMode(forms);
    setMinHp(hp);
    setMinAtk(atk);
    setMinDef(def);
    setMinSpAtk(spa);
    setMinSpDef(spd);
    setMinSpe(spe);
    setIsShinyMode(shiny);
    setQuantity(qty);
    setMaxBst600(max600);
    setUniqueOnly(unique);

    setExcludeLegendary(urlExLeg);
    setExcludeMythical(urlExMyth);
    setExcludeParadox(urlExParadox);
    setExcludeStarters(urlExStarters);
    setExcludeUltraBeast(urlExUltra);
    setExcludeAlolan(urlExAlola);
    setExcludeGalarian(urlExGalar);
    setExcludeHisuian(urlExHisui);
    setExcludePaldean(urlExPaldea);

    // Initial Random Selection
    const initialCriteria: FilterCriteria = {
      generations: gens,
      types,
      typeMatchMode: tMode,
      categories: cats,
      formsMode: forms,
      maxBst: max600 ? 600 : undefined,
      minHp: hp > 0 ? hp : undefined,
      minAtk: atk > 0 ? atk : undefined,
      minDef: def > 0 ? def : undefined,
      minSpAtk: spa > 0 ? spa : undefined,
      minSpDef: spd > 0 ? spd : undefined,
      minSpe: spe > 0 ? spe : undefined,
      excludeLegendary: urlExLeg,
      excludeMythical: urlExMyth,
      excludeParadox: urlExParadox,
      excludeStarters: urlExStarters,
      excludeUltraBeast: urlExUltra,
      excludeAlolan: urlExAlola,
      excludeGalarian: urlExGalar,
      excludeHisuian: urlExHisui,
      excludePaldean: urlExPaldea,
    };

    const filtered = filterPokemon(pokemonList, initialCriteria);
    const initialResults: (PokemonIndexItem | null)[] = Array(24).fill(null);
    if (filtered.length > 0) {
      for (let i = 0; i < 24; i++) {
        initialResults[i] = filtered[Math.floor(Math.random() * filtered.length)] || null;
      }
    }
    setResults(initialResults);
  }, [loading, pokemonList]);

  // Load Recents from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('roguedex_recents');
    if (saved) {
      try {
        setRecents(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Sync Filters to URL params
  const updateUrl = (
    gens = selectedGens,
    types = selectedTypes,
    tMode = typeMatchMode,
    cats = selectedCats,
    forms = formsMode,
    hp = minHp,
    atk = minAtk,
    def = minDef,
    spa = minSpAtk,
    spd = minSpDef,
    spe = minSpe,
    shiny = isShinyMode,
    qty = quantity,
    exLeg = excludeLegendary,
    exMyth = excludeMythical,
    exParadox = excludeParadox,
    exStarters = excludeStarters,
    exUltra = excludeUltraBeast,
    exAlola = excludeAlolan,
    exGalar = excludeGalarian,
    exHisui = excludeHisuian,
    exPaldea = excludePaldean,
    max600 = maxBst600,
    unique = uniqueOnly
  ) => {
    const params = new URLSearchParams();
    if (gens.length > 0) params.set('gens', gens.join(','));
    if (types.length > 0) params.set('types', types.join(','));
    if (tMode !== 'either') params.set('typeMode', tMode);
    if (cats.length > 0) params.set('cats', cats.join(','));
    if (forms !== 'all') params.set('forms', forms);
    if (hp > 0) params.set('minHp', hp.toString());
    if (atk > 0) params.set('minAtk', atk.toString());
    if (def > 0) params.set('minDef', def.toString());
    if (spa > 0) params.set('minSpAtk', spa.toString());
    if (spd > 0) params.set('minSpDef', spd.toString());
    if (spe > 0) params.set('minSpe', spe.toString());
    if (shiny) params.set('shiny', 'true');
    if (qty > 1) params.set('qty', qty.toString());

    if (exLeg) params.set('exLeg', 'true');
    if (exMyth) params.set('exMyth', 'true');
    if (exParadox) params.set('exParadox', 'true');
    if (exStarters) params.set('exStarters', 'true');
    if (exUltra) params.set('exUltra', 'true');
    if (exAlola) params.set('exAlola', 'true');
    if (exGalar) params.set('exGalar', 'true');
    if (exHisui) params.set('exHisui', 'true');
    if (exPaldea) params.set('exPaldea', 'true');
    if (max600) params.set('maxBst600', 'true');
    if (unique) params.set('uniqueOnly', 'true');

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const activeFilters: FilterCriteria = {
    generations: selectedGens,
    types: selectedTypes,
    typeMatchMode,
    categories: selectedCats,
    formsMode,
    maxBst: maxBst600 ? 600 : undefined,
    minHp: minHp > 0 ? minHp : undefined,
    minAtk: minAtk > 0 ? minAtk : undefined,
    minDef: minDef > 0 ? minDef : undefined,
    minSpAtk: minSpAtk > 0 ? minSpAtk : undefined,
    minSpDef: minSpDef > 0 ? minSpDef : undefined,
    minSpe: minSpe > 0 ? minSpe : undefined,
    excludeLegendary,
    excludeMythical,
    excludeParadox,
    excludeStarters,
    excludeUltraBeast,
    excludeAlolan,
    excludeGalarian,
    excludeHisuian,
    excludePaldean,
  };

  const filteredCount = pokemonList.length > 0 ? filterPokemon(pokemonList, activeFilters).length : 0;

  // Single active pokemon shortcut (results[0])
  const currentPokemon = results[0];
  const isSpinning = spinningSlots[0];

  // Handle Randomization trigger (grid-wide)
  const handleRandomize = () => {
    if (pokemonList.length === 0) return;

    const filtered = filterPokemon(pokemonList, activeFilters);
    if (filtered.length === 0) {
      setResults(Array(24).fill(null));
      return;
    }

    if (quantity === 1) {
      if (isSpinning) return;
      
      setSpinningSlots(prev => {
        const next = [...prev];
        next[0] = true;
        return next;
      });

      let ticks = 0;
      const maxTicks = 6;
      const interval = setInterval(() => {
        const tempPk = pokemonList[Math.floor(Math.random() * pokemonList.length)];
        setResults(current => {
          const next = [...current];
          next[0] = tempPk;
          return next;
        });
        ticks++;

        if (ticks >= maxTicks) {
          clearInterval(interval);
          const finalPk = filtered[Math.floor(Math.random() * filtered.length)] || null;
          
          if (finalPk) {
            const finalSrc = isShinyMode ? finalPk.shinySprite : finalPk.sprite;
            preloadImage(finalSrc).then(() => {
              setResults(current => {
                const next = [...current];
                next[0] = finalPk;
                return next;
              });
              setSpinningSlots(prev => {
                const next = [...prev];
                next[0] = false;
                return next;
              });
              addToRecents(finalPk);
            });
          } else {
            setResults(current => {
              const next = [...current];
              next[0] = null;
              return next;
            });
            setSpinningSlots(prev => {
              const next = [...prev];
              next[0] = false;
              return next;
            });
          }
        }
      }, 70);
    } else {
      // Multi-Reroll
      const nextSpinning = Array(24).fill(false);
      for (let i = 0; i < quantity; i++) {
        if (!lockedSlots[i]) {
          nextSpinning[i] = true;
        }
      }
      setSpinningSlots(nextSpinning);

      let ticks = 0;
      const maxTicks = 6;
      const interval = setInterval(() => {
        setResults(current => {
          const spinning = [...current];
          for (let i = 0; i < quantity; i++) {
            if (!lockedSlots[i]) {
              spinning[i] = pokemonList[Math.floor(Math.random() * pokemonList.length)];
            }
          }
          return spinning;
        });
        ticks++;

        if (ticks >= maxTicks) {
          clearInterval(interval);
          setResults(final => {
            const finalResults = [...final];
            const currentSelected = new Set<number>();
            if (uniqueOnly) {
              for (let i = 0; i < quantity; i++) {
                if (lockedSlots[i] && finalResults[i]) {
                  currentSelected.add(finalResults[i]!.speciesId);
                }
              }
            }
            for (let i = 0; i < quantity; i++) {
              if (!lockedSlots[i]) {
                if (uniqueOnly) {
                  const candidates = filtered.filter(pk => !currentSelected.has(pk.speciesId));
                  if (candidates.length > 0) {
                    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
                    finalResults[i] = chosen;
                    currentSelected.add(chosen.speciesId);
                  } else {
                    finalResults[i] = null;
                  }
                } else {
                  finalResults[i] = filtered[Math.floor(Math.random() * filtered.length)] || null;
                }
              }
            }
            return finalResults;
          });
          setSpinningSlots(Array(24).fill(false));
        }
      }, 70);
    }
  };

  // Reroll single slot
  const handleRerollSlot = (slotIdx: number) => {
    if (spinningSlots[slotIdx] || pokemonList.length === 0) return;

    setSpinningSlots(prev => {
      const next = [...prev];
      next[slotIdx] = true;
      return next;
    });

    const filtered = filterPokemon(pokemonList, activeFilters);

    let ticks = 0;
    const maxTicks = 6;
    const interval = setInterval(() => {
      setResults(current => {
        const next = [...current];
        next[slotIdx] = pokemonList[Math.floor(Math.random() * pokemonList.length)];
        return next;
      });
      ticks++;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setResults(final => {
          const next = [...final];
          if (uniqueOnly) {
            const currentSelected = new Set<number>();
            for (let i = 0; i < quantity; i++) {
              if (i !== slotIdx && next[i]) {
                currentSelected.add(next[i]!.speciesId);
              }
            }
            const candidates = filtered.filter(pk => !currentSelected.has(pk.speciesId));
            if (candidates.length > 0) {
              next[slotIdx] = candidates[Math.floor(Math.random() * candidates.length)];
            } else {
              next[slotIdx] = null;
            }
          } else {
            next[slotIdx] = filtered[Math.floor(Math.random() * filtered.length)] || null;
          }
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

  const addToRecents = (pk: PokemonIndexItem) => {
    setRecents(prev => {
      const filtered = prev.filter(item => item.id !== pk.id);
      const updated = [pk, ...filtered].slice(0, 8);
      localStorage.setItem('roguedex_recents', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearRecents = () => {
    setRecents([]);
    localStorage.removeItem('roguedex_recents');
  };

  const handleGenToggle = (gen: number) => {
    const next = selectedGens.includes(gen) 
      ? selectedGens.filter(g => g !== gen) 
      : [...selectedGens, gen];
    setSelectedGens(next);
    updateUrl(next, selectedTypes, typeMatchMode, selectedCats, formsMode);
  };

  const handleTypeToggle = (type: string) => {
    const next = selectedTypes.includes(type) 
      ? selectedTypes.filter(t => t !== type) 
      : [...selectedTypes, type];
    setSelectedTypes(next);
    updateUrl(selectedGens, next, typeMatchMode, selectedCats, formsMode);
  };

  const handleCatToggle = (cat: string) => {
    const next = selectedCats.includes(cat) 
      ? selectedCats.filter(c => c !== cat) 
      : [...selectedCats, cat];
    setSelectedCats(next);
    updateUrl(selectedGens, selectedTypes, typeMatchMode, next, formsMode);
  };

  const handleFormsChange = (mode: any) => {
    setFormsMode(mode);
    updateUrl(selectedGens, selectedTypes, typeMatchMode, selectedCats, mode);
  };

  const handleTypeModeChange = (mode: any) => {
    setTypeMatchMode(mode);
    updateUrl(selectedGens, selectedTypes, mode, selectedCats, formsMode);
  };

  const handleResetFilters = () => {
    setSelectedGens([]);
    setSelectedTypes([]);
    setTypeMatchMode('either');
    setSelectedCats([]);
    setFormsMode('all');
    setMinHp(0);
    setMinAtk(0);
    setMinDef(0);
    setMinSpAtk(0);
    setMinSpDef(0);
    setMinSpe(0);
    setIsShinyMode(false);
    setMaxBst600(false);
    setUniqueOnly(false);

    setExcludeLegendary(false);
    setExcludeMythical(false);
    setExcludeParadox(false);
    setExcludeStarters(false);
    setExcludeUltraBeast(false);
    setExcludeAlolan(false);
    setExcludeGalarian(false);
    setExcludeHisuian(false);
    setExcludePaldean(false);

    updateUrl([], [], 'either', [], 'all', 0, 0, 0, 0, 0, 0, false, 1, false, false, false, false, false, false, false, false, false, false, false);
  };

  const handleExportShowdown = async () => {
    setIsExporting(true);
    try {
      const pksToExport = results.slice(0, quantity).filter(p => !!p) as PokemonIndexItem[];
      const text = await generateShowdownTeam(pksToExport);
      await navigator.clipboard.writeText(text);
      alert('Competitive Sets copied to clipboard!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate competitive sets.');
    } finally {
      setIsExporting(false);
    }
  };

  const playCry = (id: number) => {
    import('@/lib/audio').then(({ playPokemonCry }) => playPokemonCry(id));
  };

  // Standard loading state
  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-semibold animate-pulse">Loading Pokédex database...</p>
      </div>
    );
  }

  // Standard error state
  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
          <Trash2 className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-200 mb-2">Database Connection Failed</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all duration-200"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const primaryType = currentPokemon?.types[0] || 'normal';
  const glowClass = TYPE_GLOWS[primaryType] || TYPE_GLOWS.normal;
  const gradientClass = TYPE_GRADIENTS[primaryType] || TYPE_GRADIENTS.normal;
  const primaryColor = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-6 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5 animate-in fade-in slide-in-from-top duration-300">
            RogueDex <span className="text-blue-500 glow-text-primary">Randomizer</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Generate random Pokémon and discovery grids. Customize sizes, locking properties, type requirements, and stat minimums.
          </p>
        </div>
        
        {/* Controls: Quantity Selector and Filters Toggle */}
        <div className="flex flex-wrap justify-center items-center gap-3">
          
          {/* Quantity Selector dropdown */}
          <div className="flex items-center gap-2 bg-[#111622] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350">
            <span className="font-semibold uppercase tracking-wider text-slate-550 text-[10px]">Quantity</span>
            <select
              value={quantity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setQuantity(val);
                updateUrl(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, val);
              }}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="1" className="bg-[#0f1420]">1 Pokémon</option>
              <option value="2" className="bg-[#0f1420]">2 Grid</option>
              <option value="3" className="bg-[#0f1420]">3 Grid</option>
              <option value="6" className="bg-[#0f1420]">6 Team Grid</option>
              <option value="12" className="bg-[#0f1420]">12 Mega Grid</option>
              <option value="18" className="bg-[#0f1420]">18 Draft Grid</option>
              <option value="24" className="bg-[#0f1420]">24 Full Roster</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
              showFilters
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25'
                : 'bg-[#111622] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Redesigned TOP-LEVEL EXPANDABLE ACCORDION FILTERS */}
      {showFilters && (
        <div className="glass-panel border-slate-850 p-6 rounded-3xl flex flex-col gap-6 animate-fade-in shadow-2xl bg-[#111622]/90 backdrop-blur-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4.5 h-4.5 text-blue-500" />
              Generator Options Setup
            </h2>
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors"
            >
              Reset Options
            </button>
          </div>

          {/* Filters Accordion Columns Grid (5 Columns Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
            
            {/* Column 1: Generations */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">Regions / Generations</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {GENERATIONS.map(gen => {
                  const isChecked = selectedGens.includes(gen.value);
                  return (
                    <button
                      key={gen.value}
                      onClick={() => handleGenToggle(gen.value)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border text-center transition-all ${
                        isChecked
                          ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                          : 'bg-[#0b0e16] border-slate-850 text-slate-450 hover:text-slate-200'
                      }`}
                    >
                      Gen {gen.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Types match */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">Type Rules</h3>
                <select
                  value={typeMatchMode}
                  onChange={(e) => handleTypeModeChange(e.target.value as any)}
                  className="text-[10px] bg-[#0b0e16] border border-slate-800 text-slate-400 rounded px-1.5 py-0.5 focus:outline-none"
                >
                  <option value="either">Either Type</option>
                  <option value="both">Both Types</option>
                  <option value="primary">Primary Only</option>
                  <option value="secondary">Secondary Only</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {Object.keys(TYPE_COLORS).map(type => {
                  const isChecked = selectedTypes.includes(type);
                  const color = TYPE_COLORS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      style={{
                        backgroundColor: isChecked ? `${color}18` : '#0b0e16',
                        borderColor: isChecked ? color : 'transparent',
                        color: isChecked ? color : '#9CA3AF',
                      }}
                      className="py-1 px-1 rounded-md text-[9px] uppercase font-extrabold border text-center transition-all hover:bg-slate-900"
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Stats Sliders */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">Stat Minimums</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { key: 'hp', label: 'HP', val: minHp, set: setMinHp },
                  { key: 'atk', label: 'ATK', val: minAtk, set: setMinAtk },
                  { key: 'def', label: 'DEF', val: minDef, set: setMinDef },
                  { key: 'spAtk', label: 'SPA', val: minSpAtk, set: setMinSpAtk },
                  { key: 'spDef', label: 'SPD', val: minSpDef, set: setMinSpDef },
                  { key: 'spe', label: 'SPE', val: minSpe, set: setMinSpe },
                ].map(stat => (
                  <div key={stat.key}>
                    <div className="flex justify-between items-center text-[9px] font-bold mb-0.5">
                      <span className="text-slate-450 uppercase">{stat.label}</span>
                      <span className="text-slate-300 font-mono">{stat.val}</span>
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

            {/* Column 4: Inclusion Pools & Extras */}
            <div className="flex flex-col gap-4">
              
              {/* Inclusion Pools selection */}
              <div>
                <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest mb-2.5">Inclusion Pools</h3>
                <div className="flex flex-col gap-2">
                  {CATEGORIES.map(cat => {
                    const isChecked = selectedCats.includes(cat.value);
                    return (
                      <label key={cat.value} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-[10px] select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCatToggle(cat.value)}
                          className="sr-only"
                        />
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-blue-600 border-blue-500' : 'border-slate-850 bg-[#0b0e16]'
                        }`}>
                          {isChecked && <div className="w-1.5 h-1.5 bg-slate-950 rounded-sm" />}
                        </div>
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Extras check */}
              <div>
                <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest mb-2">Extras</h3>
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-[10px] select-none">
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
                    isShinyMode ? 'bg-amber-500 border-amber-400' : 'border-slate-850 bg-[#0b0e16]'
                  }`}>
                    {isShinyMode && <div className="w-1.5 h-1.5 bg-slate-950 rounded-sm" />}
                  </div>
                  <span className="flex items-center gap-1 font-bold">✨ Shiny Mode</span>
                </label>

                <label className="flex items-center gap-2 mt-2 cursor-pointer text-slate-400 hover:text-white text-[10px] select-none">
                  <input
                    type="checkbox"
                    checked={maxBst600}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setMaxBst600(val);
                      updateUrl(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, val, undefined);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    maxBst600 ? 'bg-purple-500 border-purple-400' : 'border-slate-850 bg-[#0b0e16]'
                  }`}>
                    {maxBst600 && <div className="w-1.5 h-1.5 bg-slate-950 rounded-sm" />}
                  </div>
                  <span className="flex items-center gap-1 font-bold">≤ 600 BST</span>
                </label>

                <label className="flex items-center gap-2 mt-2 cursor-pointer text-slate-400 hover:text-white text-[10px] select-none">
                  <input
                    type="checkbox"
                    checked={uniqueOnly}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setUniqueOnly(val);
                      updateUrl(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, val);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    uniqueOnly ? 'bg-green-500 border-green-400' : 'border-slate-850 bg-[#0b0e16]'
                  }`}>
                    {uniqueOnly && <div className="w-1.5 h-1.5 bg-slate-950 rounded-sm" />}
                  </div>
                  <span className="flex items-center gap-1 font-bold">Unique Pokémon Only</span>
                </label>
              </div>

              {/* Forms Inclusion selection */}
              <div>
                <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest mb-2">Forms</h3>
                <div className="flex flex-col gap-1.5">
                  {SPECIAL_FORMS.map(form => (
                    <label key={form.value} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-[10px] select-none">
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
                        {formsMode === form.value && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                      </div>
                      {form.label}
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Column 5: Pools and Regional Exclusions */}
            <div className="flex flex-col gap-4">
              
              {/* Pool Exclusions */}
              <div>
                <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest mb-2">Exclude Pools</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'legendary', label: 'Exclude Legendary', val: excludeLegendary, set: setExcludeLegendary },
                    { key: 'mythical', label: 'Exclude Mythical', val: excludeMythical, set: setExcludeMythical },
                    { key: 'paradox', label: 'Exclude Paradox', val: excludeParadox, set: setExcludeParadox },
                    { key: 'starters', label: 'Exclude Starters', val: excludeStarters, set: setExcludeStarters },
                    { key: 'ultra', label: 'Exclude Ultra Beasts', val: excludeUltraBeast, set: setExcludeUltraBeast },
                  ].map(ex => (
                    <label key={ex.key} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-[10px] select-none">
                      <input
                        type="checkbox"
                        checked={ex.val}
                        onChange={(e) => {
                          const val = e.target.checked;
                          ex.set(val);
                          updateUrl(
                            undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined,
                            ex.key === 'legendary' ? val : excludeLegendary,
                            ex.key === 'mythical' ? val : excludeMythical,
                            ex.key === 'paradox' ? val : excludeParadox,
                            ex.key === 'starters' ? val : excludeStarters,
                            ex.key === 'ultra' ? val : excludeUltraBeast
                          );
                        }}
                        className="sr-only"
                      />
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        ex.val ? 'bg-rose-500 border-rose-400' : 'border-slate-850 bg-[#0b0e16]'
                      }`}>
                        {ex.val && <div className="w-1.5 h-1.5 bg-slate-950 rounded-sm" />}
                      </div>
                      <span>{ex.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Regional form exclusions */}
              <div>
                <h3 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest mb-2">Exclude Forms</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'alolan', label: 'Exclude Alolan', val: excludeAlolan, set: setExcludeAlolan },
                    { key: 'galarian', label: 'Exclude Galarian', val: excludeGalarian, set: setExcludeGalarian },
                    { key: 'hisuian', label: 'Exclude Hisuian', val: excludeHisuian, set: setExcludeHisuian },
                    { key: 'paldean', label: 'Exclude Paldean', val: excludePaldean, set: setExcludePaldean },
                  ].map(ex => (
                    <label key={ex.key} className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-[10px] select-none">
                      <input
                        type="checkbox"
                        checked={ex.val}
                        onChange={(e) => {
                          const val = e.target.checked;
                          ex.set(val);
                          updateUrl(
                            undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined,
                            undefined, undefined, undefined, undefined, undefined,
                            ex.key === 'alolan' ? val : excludeAlolan,
                            ex.key === 'galarian' ? val : excludeGalarian,
                            ex.key === 'hisuian' ? val : excludeHisuian,
                            ex.key === 'paldean' ? val : excludePaldean
                          );
                        }}
                        className="sr-only"
                      />
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        ex.val ? 'bg-rose-500/10 border-rose-500/30 text-rose-450' : 'border-slate-850 bg-[#0b0e16]'
                      }`}>
                        {ex.val && <div className="w-1.5 h-1.5 bg-rose-500 rounded-sm" />}
                      </div>
                      <span>{ex.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Active summary counts and close */}
          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs text-slate-500">
            <span>{filteredCount} Pokémon matches active generator options</span>
            <button
              onClick={() => setShowFilters(false)}
              className="text-blue-500 hover:text-blue-400 font-bold"
            >
              Apply Options
            </button>
          </div>

        </div>
      )}

      {/* Main Generator display area */}
      <div className="w-full flex flex-col gap-6">
        
        {/* Quantity = 1 Layout (Default Large Card view) */}
        {quantity === 1 ? (
          currentPokemon ? (
            <div className={`glass-panel rounded-3xl overflow-hidden relative border transition-all duration-500 ease-out bg-gradient-to-b ${gradientClass} ${glowClass}`}>
              
              {/* Top Bar actions */}
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                <span className="font-mono text-lg font-bold text-slate-550">
                  #{currentPokemon.id.toString().padStart(3, '0')}
                </span>
                <button
                  onClick={() => toggleFavorite(currentPokemon.id)}
                  className="p-2 rounded-full bg-slate-950/40 border border-slate-800/40 hover:bg-slate-900/60 text-slate-200 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorite(currentPokemon.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-450'
                    }`}
                  />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-8 sm:p-10 pt-16 flex flex-col md:flex-row gap-8 items-center">
                
                {/* Artwork wrapper */}
                <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center relative group">
                  <div
                    style={{ backgroundColor: `${primaryColor}10` }}
                    className="absolute inset-0 rounded-full blur-2xl animate-pulse scale-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <img
                    src={isShinyMode ? currentPokemon.shinySprite : currentPokemon.sprite}
                    alt={currentPokemon.displayName}
                    className={`w-full h-full object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transform transition-transform duration-500 ${
                      isSpinning ? 'scale-90 rotate-12 blur-[1px]' : 'group-hover:scale-105'
                    }`}
                  />
                </div>

                {/* Info and Stats details */}
                <div className="flex-1 w-full flex flex-col gap-6">
                  
                  {/* Meta details */}
                  <div className="text-center md:text-left flex flex-col gap-2">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white capitalize">
                        {currentPokemon.displayName}
                      </h2>
                      <button
                        onClick={() => playCry(currentPokemon.id)}
                        className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                        title="Listen to cry"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start items-center mt-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        GEN {currentPokemon.generation}
                      </span>
                      
                      {currentPokemon.types.map(t => (
                        <span
                          key={t}
                          style={{
                            backgroundColor: `${TYPE_COLORS[t]}18`,
                            color: TYPE_COLORS[t],
                            borderColor: `${TYPE_COLORS[t]}2b`,
                          }}
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                        >
                          {t}
                        </span>
                      ))}

                      {/* Special Form tags */}
                      {isShinyMode && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-400/25 text-amber-400 flex items-center gap-1 animate-pulse">
                          <Sparkle className="w-3 h-3 fill-amber-400" />
                          SHINY
                        </span>
                      )}
                      {currentPokemon.isMega && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          MEGA
                        </span>
                      )}
                      {currentPokemon.isRegional && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-400">
                          REGIONAL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal stats */}
                  <div className="flex flex-col gap-3 bg-slate-950/20 rounded-2xl p-5 border border-slate-900/60 max-w-xl">
                    <StatBar statKey="hp" value={currentPokemon.stats.hp} />
                    <StatBar statKey="atk" value={currentPokemon.stats.atk} />
                    <StatBar statKey="def" value={currentPokemon.stats.def} />
                    <StatBar statKey="spAtk" value={currentPokemon.stats.spAtk} />
                    <StatBar statKey="spDef" value={currentPokemon.stats.spDef} />
                    <StatBar statKey="spe" value={currentPokemon.stats.spe} />
                    <div className="flex justify-between items-center border-t border-slate-800/80 pt-2 text-[10px] font-extrabold font-mono text-slate-550">
                      <span>BASE STAT TOTAL</span>
                      <span className="text-xs text-blue-400 font-black">{currentPokemon.stats.total}</span>
                    </div>
                  </div>

                  {/* Card redirect trigger link */}
                  <div className="text-center md:text-left mt-2 flex items-center gap-2">
                    <a
                      href={`/pokemon/${currentPokemon.name}`}
                      className="px-6 py-2.5 bg-slate-950/40 hover:bg-slate-950/80 text-white font-bold border border-slate-850 hover:border-slate-800 text-xs rounded-xl transition-all duration-200 inline-block"
                    >
                      Dex Profile &rarr;
                    </a>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel border-slate-900 rounded-3xl p-12 text-center text-slate-550">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-800 mb-4" />
              <h3 className="font-bold text-slate-350 text-sm uppercase">No Matching Varieties</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Try widening categories, selecting additional generations, or clearing stat sliders/exclusions.
              </p>
            </div>
          )
        ) : (
          /* Quantity > 1 Grid Display (Multi-Card Randomizer) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in duration-300">
            {results.slice(0, quantity).map((slotPk, idx) => {
              if (!slotPk) return null;
              const primaryType = slotPk.types[0];
              const typeColor = TYPE_COLORS[primaryType];
              const isLocked = lockedSlots[idx];
              const isSpinning = spinningSlots[idx];

              return (
                <div
                  key={idx}
                  className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col items-center relative border border-slate-850 min-h-[220px] overflow-hidden group"
                >
                  {/* Lock slot control */}
                  <div className="absolute top-2.5 left-3 flex gap-1.5 z-10">
                    <button
                      onClick={() => handleLockToggle(idx)}
                      className={`p-1 rounded-full border text-[10px] transition-colors ${
                        isLocked 
                          ? 'bg-amber-500/15 border-amber-550 text-amber-400' 
                          : 'bg-slate-900/60 border-slate-850 text-slate-500 hover:text-slate-200'
                      }`}
                      title={isLocked ? 'Unlock Slot' : 'Lock Slot'}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    {!isLocked && (
                      <button
                        onClick={() => handleRerollSlot(idx)}
                        className="p-1 rounded-full bg-slate-900/60 border border-slate-850 text-slate-500 hover:text-slate-250 transition-colors"
                        title="Reroll Pokémon"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Header right icons: Cry playback */}
                  <div className="absolute top-2.5 right-3 z-10 flex gap-1">
                    <button
                      onClick={() => playCry(slotPk.id)}
                      className="p-1 rounded-full bg-slate-900/60 border border-slate-850 text-slate-500 hover:text-slate-250 transition-colors"
                      title="Play Cry"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    
                    {/* Favorite heart icon */}
                    <button
                      onClick={() => toggleFavorite(slotPk.id)}
                      className="p-1 rounded-full bg-slate-900/60 border border-slate-850 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Heart className={`w-3 h-3 ${isFavorite(slotPk.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Artwork Image Well */}
                  <div className="w-20 h-20 flex items-center justify-center relative my-3">
                    <div
                      style={{ backgroundColor: `${typeColor}08` }}
                      className="absolute inset-0 rounded-full blur-xl animate-pulse scale-90"
                    />
                    <img
                      src={isShinyMode ? slotPk.shinySprite : slotPk.sprite}
                      alt={slotPk.displayName}
                      className={`w-full h-full object-contain relative z-10 drop-shadow-md transition-transform duration-500 ${
                        isSpinning ? 'scale-90 rotate-12 blur-[1px]' : 'group-hover:scale-105'
                      }`}
                      loading="lazy"
                    />
                  </div>

                  {/* Name and types */}
                  <h4 className="font-extrabold text-xs text-slate-200 text-center tracking-tight truncate w-full group-hover:text-blue-400 transition-colors flex items-center justify-center gap-0.5 px-2 mb-1">
                    {isShinyMode && <Sparkle className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                    {slotPk.displayName}
                  </h4>
                  <span className="text-[9px] font-mono text-slate-550 mb-2">#{slotPk.id.toString().padStart(3, '0')}</span>

                  <div className="flex gap-1 flex-wrap justify-center">
                    {slotPk.types.map(t => (
                      <span
                        key={t}
                        style={{
                          backgroundColor: `${TYPE_COLORS[t]}18`,
                          color: TYPE_COLORS[t],
                          borderColor: `${TYPE_COLORS[t]}2c`,
                        }}
                        className="text-[8px] font-extrabold uppercase px-1.5 rounded border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Link detail redirect */}
                  <a
                    href={`/pokemon/${slotPk.name}`}
                    className="text-[9px] font-bold text-slate-550 hover:text-blue-400 transition-colors mt-3.5"
                  >
                    Profile &rarr;
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Generate / Reroll trigger */}
        <div className="w-full flex justify-center gap-4">
          <button
            onClick={handleRandomize}
            disabled={filteredCount === 0 || isSpinning}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/20 active:scale-98 transition-all hover:shadow-blue-600/35 border border-blue-500/35 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
          >
            <RefreshCw className={`w-5 h-5 ${(isSpinning || spinningSlots.some(Boolean)) ? 'animate-spin' : ''}`} />
            {quantity > 1 ? 'Reroll Unlocked Slots' : 'Generate Pokémon'}
          </button>

          {results.length > 0 && results[0] !== null && (
            <button
              onClick={handleExportShowdown}
              disabled={isExporting || isSpinning}
              className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-extrabold rounded-2xl active:scale-98 transition-all border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sword className="w-5 h-5" />}
              Showdown Export
            </button>
          )}
        </div>

      </div>

      {/* Recently Randomized Track (Recents) */}
      {recents.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-550 tracking-wider">Recently Randomized</h3>
            <button
              onClick={handleClearRecents}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-350 transition-all uppercase tracking-wider"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {recents.map(pk => {
              return (
                <a
                  key={pk.id}
                  href={`/pokemon/${pk.name}`}
                  className="flex-shrink-0 bg-[#111622]/60 border border-slate-850 hover:border-slate-800 rounded-xl p-3 flex items-center gap-3 w-44 hover:bg-[#181e2b] transition-all group"
                >
                  <img src={pk.sprite} alt={pk.displayName} className="w-10 h-10 object-contain drop-shadow" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                      {pk.displayName}
                    </span>
                    <span className="text-[9px] text-slate-550 font-mono">#{pk.id.toString().padStart(3, '0')}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default function RandomizerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      }
    >
      <RandomizerContent />
    </Suspense>
  );
}
