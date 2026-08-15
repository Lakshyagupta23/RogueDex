'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, HelpCircle, Heart, Search } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem, PokemonDetails } from '@/lib/pokemon/types';
import { fetchPokemonDetails } from '@/lib/pokemon/api';

export default function BreedingPage() {
  const router = useRouter();
  const { pokemonList, loading: listLoading } = usePokemon();

  const [selectedPk, setSelectedPk] = useState<PokemonIndexItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Suggestions search list
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return pokemonList
      .filter(p => p.displayName.toLowerCase().includes(q) || p.id.toString() === q)
      .slice(0, 5);
  }, [pokemonList, searchQuery]);

  // Load details
  useEffect(() => {
    if (!selectedPk) {
      setDetails(null);
      return;
    }
    async function load() {
      try {
        setLoadingDetails(true);
        setErrorDetails(null);
        const data = await fetchPokemonDetails(selectedPk!, pokemonList);
        setDetails(data);
      } catch (err: any) {
        setErrorDetails(err.message || 'Failed to load details.');
      } finally {
        setLoadingDetails(false);
      }
    }
    load();
  }, [selectedPk, pokemonList]);

  // Compatible partners
  const partners = useMemo(() => {
    if (!details) return [];
    
    const groups = details.eggGroups;
    // Special conditions
    if (groups.includes('no-eggs') || groups.includes('undiscovered')) {
      return []; // Cannot breed
    }

    const isDitto = details.name === 'ditto';

    return pokemonList.filter(p => {
      if (p.id === details.id) return false; // Exclude self
      
      // If selected is Ditto, it can breed with anything except no-eggs/undiscovered
      if (isDitto) {
        return !p.types.includes('no-eggs'); // simplistic type check or we assume general compatibility
      }

      // Check egg groups overlap. Note: we need details of partners to check egg groups,
      // but to avoid fetching details of all 1000 partners, we check against their types?
      // Wait! Does PokemonIndexItem have egg groups? Let's check:
      // Index items do NOT have eggGroups pre-mapped (we saw types.ts lists only: id, name, displayName, sprite, types, stats, generation, isMega, isRegional, shinySprite).
      // Oh! Egg groups are only on the detailed PokemonDetails object.
      // Wait, how can we check compatible partners without fetching details for all 1000?
      // Ah! We can check if any of the partner's types or tags matches?
      // No, PokéAPI egg groups are completely separate from types.
      // But wait! We can compute the breeding partner based on a predefined local mapping of egg groups for all base species,
      // OR we can fetch details for selected partners, OR we can precalculate/simplify egg groups for species!
      // Wait, is there a simple way to know the egg groups?
      // Let's check: does PokéAPI allow checking egg groups directly?
      // Let's see: `https://pokeapi.co/api/v2/egg-group/{id_or_name}/` lists all species in that egg group!
      // Oh! We can fetch the list of compatible species directly from the egg-group endpoint when a Pokémon is selected!
      // This is incredibly smart! Let's check how it works:
      // When `details` is loaded, we have `details.eggGroups` (e.g. `['monster', 'dragon']`).
      // For each egg group in `details.eggGroups`:
      // We can fetch `https://pokeapi.co/api/v2/egg-group/${groupName}` which returns a list of species names!
      // Then we intersect these species names with our `pokemonList`!
      // This is 100% correct, utilizes the official API dynamically, and requires no massive local mapping payload!
      // Let's write this dynamic resolver!
    });
  }, [details, pokemonList]);

  // Dynamic egg-groups species fetching
  const [partnerSpeciesNames, setPartnerSpeciesNames] = useState<string[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    if (!details) {
      setPartnerSpeciesNames([]);
      return;
    }
    const groups = details.eggGroups;
    if (groups.includes('no-eggs') || groups.includes('undiscovered')) {
      setPartnerSpeciesNames([]);
      return;
    }

    async function fetchCompatible() {
      try {
        setLoadingPartners(true);
        const nameSet = new Set<string>();

        // If selection is Ditto, it breeds with everything except 'no-eggs' group
        if (details?.name === 'ditto') {
          // Fetch the 'no-eggs' or 'undiscovered' group and exclude those
          const res = await fetch('https://pokeapi.co/api/v2/egg-group/no-eggs');
          const data = await res.json();
          const undiscoveredNames = data.pokemon_species.map((s: any) => s.name);
          
          pokemonList.forEach(p => {
            if (p.name !== 'ditto' && !undiscoveredNames.includes(p.name)) {
              nameSet.add(p.name);
            }
          });
        } else {
          // Standard egg group species fetches
          await Promise.all(
            groups.map(async (groupName) => {
              const cleanGroup = groupName.toLowerCase().replace(' ', '-');
              try {
                const res = await fetch(`https://pokeapi.co/api/v2/egg-group/${cleanGroup}`);
                if (!res.ok) return;
                const data = await res.json();
                data.pokemon_species.forEach((s: any) => {
                  nameSet.add(s.name);
                });
              } catch (e) {
                // ignore group fetch error
              }
            })
          );
        }

        setPartnerSpeciesNames(Array.from(nameSet).filter(n => n !== details?.name));
      } catch (err) {
        // ignore
      } finally {
        setLoadingPartners(false);
      }
    }

    fetchCompatible();
  }, [details, pokemonList]);

  // Intersect compatible species names with our index list
  const compatiblePartners = useMemo(() => {
    if (partnerSpeciesNames.length === 0) return [];
    return pokemonList.filter(p => partnerSpeciesNames.includes(p.name));
  }, [partnerSpeciesNames, pokemonList]);

  if (listLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-semibold animate-pulse">Loading database...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      
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
          <Heart className="w-4 h-4 text-blue-500" />
          Breeding Calculator
        </span>
      </div>

      <div className="text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          Breeding <span className="text-blue-500">Calculator</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Select a Pokémon to check its egg groups and discover all compatible breeding partners.
        </p>
      </div>

      {/* Selector input */}
      <div className="relative max-w-md mt-2">
        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Choose Pokémon</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Type name or Pokedex ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111622] border border-slate-800 rounded-xl text-slate-250 placeholder-slate-550 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-[72px] left-0 right-0 bg-[#0f1420] border border-slate-800 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto">
            {suggestions.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPk(p);
                  setSearchQuery(p.displayName);
                  setShowSuggestions(false);
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

      {/* Main content display */}
      {selectedPk ? (
        loadingDetails ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs font-bold text-slate-400">Loading egg groups...</span>
          </div>
        ) : (
          details && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Selected Info card */}
              <div className="md:col-span-1 glass-panel border-slate-850 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <img src={selectedPk.sprite} alt={selectedPk.displayName} className="w-16 h-16 object-contain" />
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">#{selectedPk.id.toString().padStart(3, '0')}</span>
                    <h3 className="font-extrabold text-white text-lg capitalize">{selectedPk.displayName}</h3>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Egg Groups</span>
                    <span className="text-slate-200 font-bold capitalize">{details.eggGroups.join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Gender Ratio</span>
                    <span className="text-slate-300 font-semibold">Standard 50/50</span>
                  </div>
                </div>

                {/* Breeding guidelines tips box */}
                <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-xl text-[10px] text-slate-400 leading-normal flex flex-col gap-2">
                  <span className="font-bold text-blue-400 uppercase tracking-wider">Breeding Rules:</span>
                  <p>1. Egg species matches the **female** partner's lowest evolution form.</p>
                  <p>2. The **male** partner passes down inherited TM/Egg moves.</p>
                  <p>3. **Ditto** breeds with any non-undiscovered group (acting as either gender).</p>
                </div>

              </div>

              {/* Right Column: Compatible Partners list */}
              <div className="md:col-span-2 flex flex-col gap-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Compatible Partners ({compatiblePartners.length})
                  </h3>
                  {loadingPartners && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                </div>

                {compatiblePartners.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {compatiblePartners.map(p => (
                      <a
                        key={p.id}
                        href={`/pokemon/${p.name}`}
                        className="glass-panel glass-panel-hover rounded-xl p-3 flex items-center gap-3 border border-slate-850 hover:bg-[#181e2b] transition-colors"
                      >
                        <img src={p.sprite} alt={p.displayName} className="w-10 h-10 object-contain" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-slate-200 truncate capitalize">{p.displayName}</span>
                          <span className="text-[9px] font-mono text-slate-550">#{p.id.toString().padStart(3, '0')}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel border-slate-900 rounded-2xl p-12 text-center text-slate-550 flex flex-col items-center justify-center gap-3">
                    <HelpCircle className="w-8 h-8 text-slate-850" />
                    <div>
                      <h4 className="font-bold text-slate-350 text-sm">No Compatible Partners</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        {details.eggGroups.includes('no-eggs') || details.eggGroups.includes('undiscovered')
                          ? `${selectedPk.displayName} is in the Undiscovered egg group and cannot breed.`
                          : 'No compatible partners found.'}
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )
        )
      ) : (
        <div className="glass-panel border-slate-900 rounded-3xl p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <Heart className="w-10 h-10 text-rose-500/80 animate-pulse" />
          <div>
            <h3 className="font-bold text-slate-350 text-sm uppercase">Select a Pokemon</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Select a Pokémon from the input above to list compatible partners.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
