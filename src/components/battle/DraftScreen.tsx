'use client';

import React, { useState } from 'react';
import { Sparkles, Trophy, CheckCircle, Shield } from 'lucide-react';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { TYPE_COLORS } from '@/lib/pokemon/constants';

interface DraftScreenProps {
  pokemonList: PokemonIndexItem[];
  draftOptions: string[][]; // 6 rounds of 3 options each
  draftedTeam: any[]; // Current team drafted
  onSelect: (pokemonName: string) => void;
}

export default function DraftScreen({
  pokemonList,
  draftOptions,
  draftedTeam,
  onSelect
}: DraftScreenProps) {
  const currentRound = draftedTeam.length;
  const [selectedName, setSelectedName] = useState<string | null>(null);

  // If already drafted 6 Pokémon
  if (currentRound >= 6) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800 rounded-2xl animate-fade-in text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mb-3 animate-pulse" />
        <h3 className="text-base font-black text-white">Draft Complete!</h3>
        <p className="text-xs text-slate-400 mt-1">Waiting for opponent to finish drafting...</p>
        <div className="flex gap-3 mt-6">
          {draftedTeam.map((pk, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <img src={pk.sprite} alt={pk.displayName} className="w-12 h-12 object-contain" />
              <span className="text-[9px] font-bold text-slate-400 mt-1 max-w-[64px] truncate">{pk.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get current 3 options
  const roundOptionNames = draftOptions[currentRound] || [];
  
  // Intersect with pokemonList to get full metadata (types, sprite, stats)
  const roundOptions = roundOptionNames.map(name => {
    const found = pokemonList.find(p => p.name === name.toLowerCase() || p.displayName.toLowerCase() === name.toLowerCase());
    if (found) return found;
    // Fallback stub if not loaded yet
    return {
      id: Math.random(),
      speciesId: 1,
      name,
      displayName: name,
      types: ['normal'],
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
      shinySprite: '',
      generation: 1,
      stats: { hp: 70, atk: 70, def: 70, spAtk: 70, spDef: 70, spe: 70, total: 420 },
      isLegendary: false, isMythical: false, isBaby: false, isStarter: false, isMega: false, isRegional: false, isUltraBeast: false, isParadox: false, isPseudoLegendary: false, isFossil: false, canEvolve: false, isFullyEvolved: true
    } as PokemonIndexItem;
  });

  const handleSelect = (name: string) => {
    setSelectedName(name);
    setTimeout(() => {
      onSelect(name);
      setSelectedName(null);
    }, 600); // Small delay for selection click animation
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto select-none animate-fade-in">
      
      {/* Round Header */}
      <div className="flex flex-col items-center text-center">
        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
          Round {currentRound + 1} / 6
        </span>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Draft Your Team
        </h2>
        <p className="text-xs text-slate-400 mt-1">Select one Pokémon in secret to add to your roster.</p>
      </div>

      {/* Choices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roundOptions.map((pk) => {
          const isSelected = selectedName === pk.displayName;
          return (
            <div
              key={pk.id}
              onClick={() => !selectedName && handleSelect(pk.displayName)}
              className={`relative bg-[#0f1422] border rounded-2xl p-5 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 group hover:scale-[1.03] active:scale-[0.98] ${
                isSelected 
                  ? 'border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)]' 
                  : 'border-slate-900 hover:border-slate-800 hover:shadow-lg'
              }`}
            >
              {/* Types badge overlay */}
              <div className="absolute top-4 left-4 flex gap-1.5">
                {pk.types.map(t => (
                  <span
                    key={t}
                    style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#A8A878' }}
                    className="px-2 py-0.5 rounded text-[8px] font-black text-white uppercase shadow-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Artwork wrapper */}
              <div className="h-32 flex items-center justify-center my-4 relative w-full">
                <div className="absolute inset-0 bg-slate-950/20 rounded-full blur-xl scale-75 group-hover:scale-100 transition-all duration-300 pointer-events-none" />
                <img
                  src={pk.sprite}
                  alt={pk.displayName}
                  className="h-28 w-28 object-contain relative z-10 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] group-hover:rotate-3 transition-transform duration-300"
                />
              </div>

              {/* Name and Stats summary */}
              <div className="w-full text-center border-t border-slate-900/60 pt-4">
                <h4 className="text-sm font-black text-white tracking-wide uppercase">{pk.displayName}</h4>
                
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-slate-950/40 rounded-lg p-1.5">
                    <span className="block text-[8px] font-black text-slate-500 uppercase">HP</span>
                    <span className="text-xs font-black text-slate-300">{pk.stats.hp}</span>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg p-1.5">
                    <span className="block text-[8px] font-black text-slate-500 uppercase">ATK</span>
                    <span className="text-xs font-black text-slate-300">{pk.stats.atk}</span>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg p-1.5">
                    <span className="block text-[8px] font-black text-slate-500 uppercase">SPE</span>
                    <span className="text-xs font-black text-slate-300">{pk.stats.spe}</span>
                  </div>
                </div>
              </div>

              {/* Cover click animation effect */}
              {isSelected && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-indigo-600/10 rounded-2xl backdrop-blur-[1px] animate-fade-in">
                  <CheckCircle className="w-10 h-10 text-indigo-400 animate-bounce" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Roster Progress Footer */}
      <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-5 mt-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Your Drafted Team ({currentRound} / 6)</span>
        {draftedTeam.length === 0 ? (
          <div className="h-16 flex items-center justify-center border border-dashed border-slate-900 rounded-xl">
            <span className="text-xs text-slate-500 font-bold">No Pokémon drafted yet. Select one above.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {draftedTeam.map((pk, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col items-center relative group">
                <img src={pk.sprite} alt={pk.displayName} className="w-12 h-12 object-contain" />
                <span className="text-[9px] font-black text-slate-300 mt-2 truncate w-full text-center">{pk.displayName}</span>
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px] font-black">
                  {idx + 1}
                </span>
              </div>
            ))}
            
            {/* Empty slots placeholders */}
            {Array.from({ length: 6 - draftedTeam.length }).map((_, idx) => (
              <div key={idx} className="border border-dashed border-slate-900 rounded-xl p-3 flex flex-col items-center justify-center h-20 bg-slate-950/10">
                <span className="text-[10px] font-black text-slate-500">SLOT {draftedTeam.length + idx + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
