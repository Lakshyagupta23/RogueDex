'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PokemonIndexItem, SavedTeam } from '@/lib/pokemon/types';

interface PokemonContextType {
  pokemonList: PokemonIndexItem[];
  loading: boolean;
  error: string | null;
  favorites: number[]; // Pokemon variety IDs
  savedTeams: SavedTeam[];
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  saveTeam: (name: string, pokemon: PokemonIndexItem[], notes?: string) => void;
  deleteTeam: (id: string) => void;
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

export function PokemonProvider({ children }: { children: React.ReactNode }) {
  const [pokemonList, setPokemonList] = useState<PokemonIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);

  // 1. Fetch static Pokemon index on mount
  useEffect(() => {
    async function loadIndex() {
      try {
        const res = await fetch('/data/pokemon_index.json');
        if (!res.ok) {
          throw new Error('Failed to load Pokémon database. PokéAPI index file missing.');
        }
        const data = await res.json();
        setPokemonList(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading Pokémon index:', err);
        setError(err.message || 'Unknown database error.');
        setLoading(false);
      }
    }
    loadIndex();
  }, []);

  // 2. Load favorites and saved teams from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const favs = localStorage.getItem('roguedex_favorites');
        if (favs) setFavorites(JSON.parse(favs));

        const teams = localStorage.getItem('roguedex_teams');
        if (teams) setSavedTeams(JSON.parse(teams));
      } catch (err) {
        console.error('Error reading localStorage persistence:', err);
      }
    }
  }, []);

  // 3. Toggle Favorite
  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      localStorage.setItem('roguedex_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (id: number) => {
    return favorites.includes(id);
  };

  // 4. Save Team
  const saveTeam = (name: string, pokemon: PokemonIndexItem[], notes?: string) => {
    const newTeam: SavedTeam = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim() || `Random Team #${savedTeams.length + 1}`,
      pokemon,
      createdAt: new Date().toISOString(),
      notes,
    };
    
    setSavedTeams(prev => {
      const updated = [newTeam, ...prev];
      localStorage.setItem('roguedex_teams', JSON.stringify(updated));
      return updated;
    });
  };

  // 5. Delete Team
  const deleteTeam = (id: string) => {
    setSavedTeams(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem('roguedex_teams', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <PokemonContext.Provider
      value={{
        pokemonList,
        loading,
        error,
        favorites,
        savedTeams,
        toggleFavorite,
        isFavorite,
        saveTeam,
        deleteTeam,
      }}
    >
      {children}
    </PokemonContext.Provider>
  );
}

export function usePokemon() {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error('usePokemon must be used within a PokemonProvider');
  }
  return context;
}
