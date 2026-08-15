'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, HelpCircle, Search, Calculator } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';

// Natures modifiers lookup
const NATURE_EFFECTS: Record<string, { inc: string; dec: string }> = {
  Adamant: { inc: 'atk', dec: 'spAtk' },
  Bold: { inc: 'def', dec: 'atk' },
  Brave: { inc: 'atk', dec: 'spe' },
  Calm: { inc: 'spDef', dec: 'atk' },
  Careful: { inc: 'spDef', dec: 'spAtk' },
  Gentle: { inc: 'spDef', dec: 'def' },
  Hasty: { inc: 'spe', dec: 'def' },
  Impish: { inc: 'def', dec: 'spAtk' },
  Jolly: { inc: 'spe', dec: 'spAtk' },
  Lax: { inc: 'def', dec: 'spDef' },
  Lonely: { inc: 'atk', dec: 'def' },
  Mild: { inc: 'spAtk', dec: 'def' },
  Modest: { inc: 'spAtk', dec: 'atk' },
  Naive: { inc: 'spe', dec: 'spDef' },
  Naughty: { inc: 'atk', dec: 'spDef' },
  Quiet: { inc: 'spAtk', dec: 'spe' },
  Rash: { inc: 'spAtk', dec: 'spDef' },
  Relaxed: { inc: 'def', dec: 'spe' },
  Sassy: { inc: 'spDef', dec: 'spe' },
  Timid: { inc: 'spe', dec: 'atk' },
  // Neutral Natures
  Bashful: { inc: 'none', dec: 'none' },
  Docile: { inc: 'none', dec: 'none' },
  Hardy: { inc: 'none', dec: 'none' },
  Quirky: { inc: 'none', dec: 'none' },
  Serious: { inc: 'none', dec: 'none' },
};

export default function IvCalculatorPage() {
  const router = useRouter();
  const { pokemonList, loading: listLoading } = usePokemon();

  const [selectedPk, setSelectedPk] = useState<PokemonIndexItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [level, setLevel] = useState<number>(50);
  const [nature, setNature] = useState<string>('Serious');

  // Input states for current Stats & EVs
  const [evs, setEvs] = useState<Record<string, number>>({
    hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spe: 0
  });
  const [statVals, setStatVals] = useState<Record<string, string>>({
    hp: '', atk: '', def: '', spAtk: '', spDef: '', spe: ''
  });

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return pokemonList
      .filter(p => p.displayName.toLowerCase().includes(q) || p.id.toString() === q)
      .slice(0, 5);
  }, [pokemonList, searchQuery]);

  // Stat calculation simulation check to find matching IVs
  const calculateIvRange = (statKey: string, baseVal: number, currentStatValStr: string) => {
    const inputVal = Number(currentStatValStr);
    if (isNaN(inputVal) || inputVal <= 0) return 'Input stat...';

    const ev = evs[statKey] || 0;
    const matchingIvs: number[] = [];

    // Nature modifier calculation
    let natureMod = 1.0;
    const effects = NATURE_EFFECTS[nature];
    if (effects) {
      if (effects.inc === statKey) natureMod = 1.1;
      else if (effects.dec === statKey) natureMod = 0.9;
    }

    // Check all IVs (0 to 31)
    for (let iv = 0; iv <= 31; iv++) {
      let calc = 0;
      if (statKey === 'hp') {
        // HP Formula
        calc = Math.floor(((2 * baseVal + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
        // Shedinja HP Exception
        if (baseVal === 1) calc = 1;
      } else {
        // Other Stats Formula
        calc = Math.floor(Math.floor(((2 * baseVal + iv + Math.floor(ev / 4)) * level) / 100 + 5) * natureMod);
      }

      if (calc === inputVal) {
        matchingIvs.push(iv);
      }
    }

    if (matchingIvs.length === 0) return 'No match found';
    if (matchingIvs.length === 1) return `${matchingIvs[0]}`;
    return `${matchingIvs[0]} - ${matchingIvs[matchingIvs.length - 1]}`;
  };

  const handleEvChange = (statKey: string, val: number) => {
    setEvs(prev => ({ ...prev, [statKey]: val }));
  };

  const handleStatChange = (statKey: string, valStr: string) => {
    setStatVals(prev => ({ ...prev, [statKey]: valStr }));
  };

  if (listLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-semibold animate-pulse">Loading database...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      
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
          <Calculator className="w-4 h-4 text-blue-500" />
          IV Calculator
        </span>
      </div>

      <div className="text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          IV <span className="text-blue-500">Calculator</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Compute possible Individual Values (0 to 31) for your team slots. Choose a Pokémon and input its specs.
        </p>
      </div>

      {/* Selectors grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-2">
        
        {/* Selector panel */}
        <div className="md:col-span-1 glass-panel border-slate-850 p-5 rounded-2xl flex flex-col gap-5">
          
          {/* Pokemon search */}
          <div className="relative">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Species</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Pokemon..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 bg-[#0b0e16] border border-slate-850 rounded-xl text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-14 left-0 right-0 bg-[#0f1420] border border-slate-800 rounded-xl shadow-2xl z-40 max-h-52 overflow-y-auto">
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPk(p);
                      setSearchQuery(p.displayName);
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#181e2b] text-left text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    <img src={p.sprite} alt={p.displayName} className="w-7 h-7 object-contain" />
                    <span>{p.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Level slider */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">
              <span>Level</span>
              <span className="text-blue-400 font-mono font-bold text-xs">{level}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Nature select */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Nature</label>
            <select
              value={nature}
              onChange={(e) => setNature(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b0e16] border border-slate-850 rounded-xl text-slate-200 text-xs focus:outline-none"
            >
              {Object.keys(NATURE_EFFECTS).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Inputs panel */}
        <div className="md:col-span-2">
          {selectedPk ? (
            <div className="glass-panel border-slate-850 p-6 rounded-2xl flex flex-col gap-6">
              
              <div className="flex items-center gap-4 border-b border-slate-900 pb-3">
                <img src={selectedPk.sprite} alt={selectedPk.displayName} className="w-12 h-12 object-contain" />
                <div>
                  <h3 className="font-extrabold text-white text-base capitalize">{selectedPk.displayName}</h3>
                  <span className="text-[10px] font-mono text-slate-500">Base Stat Total: {selectedPk.stats.total}</span>
                </div>
              </div>

              {/* Stats rows grid */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase text-slate-550 border-b border-slate-900 pb-1.5 px-2">
                  <div className="col-span-2">Stat Name</div>
                  <div className="col-span-2 text-center">Base</div>
                  <div className="col-span-4">EV Slider (0-252)</div>
                  <div className="col-span-2">Actual Stat</div>
                  <div className="col-span-2 text-right text-blue-400">Possible IVs</div>
                </div>

                {[
                  { key: 'hp', label: 'HP', base: selectedPk.stats.hp },
                  { key: 'atk', label: 'Attack', base: selectedPk.stats.atk },
                  { key: 'def', label: 'Defense', base: selectedPk.stats.def },
                  { key: 'spAtk', label: 'Sp. Atk', base: selectedPk.stats.spAtk },
                  { key: 'spDef', label: 'Sp. Def', base: selectedPk.stats.spDef },
                  { key: 'spe', label: 'Speed', base: selectedPk.stats.spe },
                ].map(row => {
                  const ev = evs[row.key] || 0;
                  const val = statVals[row.key] || '';
                  const computedRange = calculateIvRange(row.key, row.base, val);

                  return (
                    <div key={row.key} className="grid grid-cols-12 gap-3 items-center text-xs px-2 py-1.5 hover:bg-slate-900/10 rounded-lg">
                      <div className="col-span-2 font-bold text-slate-300">{row.label}</div>
                      <div className="col-span-2 text-center font-mono text-slate-450">{row.base}</div>
                      
                      {/* EV range slider */}
                      <div className="col-span-4 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="252"
                          step="4"
                          value={ev}
                          onChange={(e) => handleEvChange(row.key, Number(e.target.value))}
                          className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-slate-600"
                        />
                        <span className="font-mono text-[10px] text-slate-500 w-8 text-right">{ev}</span>
                      </div>

                      {/* Actual value input */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleStatChange(row.key, e.target.value)}
                          placeholder="e.g. 120"
                          className="w-full px-2 py-1 bg-[#0b0e16] border border-slate-850 rounded text-center text-slate-200 text-xs font-mono focus:outline-none"
                        />
                      </div>

                      {/* Resulting IV Range match */}
                      <div className="col-span-2 text-right font-mono font-bold text-blue-400">
                        {computedRange}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="glass-panel border-slate-900 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-4 min-h-[350px]">
              <Calculator className="w-10 h-10 text-slate-750" />
              <div>
                <h3 className="font-bold text-slate-350 text-sm uppercase">Select a Pokémon</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Choose a Pokémon species from the left sidebar to start calculating individual values.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
