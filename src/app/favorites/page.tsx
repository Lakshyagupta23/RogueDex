'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, Shield, Layers, RefreshCw, Clipboard, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem, SavedTeam } from '@/lib/pokemon/types';
import { generateShowdownTeam } from '@/lib/pokemon/showdown';
import { TYPE_COLORS } from '@/lib/pokemon/constants';

function FavoritesContent() {
  const router = useRouter();
  const { pokemonList, loading, error, favorites, savedTeams, toggleFavorite, deleteTeam } = usePokemon();
  
  // Tab control: 'pokemon' or 'teams'
  const [activeTab, setActiveTab] = useState<'pokemon' | 'teams'>('pokemon');
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Resolve favorited Pokemon details
  const favoritedPokemonList = useMemo(() => {
    return favorites
      .map(id => pokemonList.find(pk => pk.id === id))
      .filter(Boolean) as PokemonIndexItem[];
  }, [favorites, pokemonList]);

  const showToastNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Copy Showdown sets for saved team
  const handleCopyTeamShowdown = (team: SavedTeam) => {
    const text = generateShowdownTeam(team.pokemon);
    navigator.clipboard.writeText(text);
    showToastNotification(`Showdown text for "${team.name}" copied!`);
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-450 font-semibold animate-pulse">Loading favorites vault...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-slate-200 mb-2">Error Loading Favorites</h2>
        <p className="text-slate-455 text-sm max-w-sm">{error}</p>
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

      {/* Header & Tabs */}
      <div className="border-b border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            Trainer <span className="text-blue-500">Registry</span>
          </h1>
          <p className="text-slate-450 text-sm">
            Access your favorited Pokémon species and saved challenge rosters.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#111622] border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pokemon')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pokemon'
                ? 'bg-blue-600 text-white'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Favorites ({favoritedPokemonList.length})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Saved Teams ({savedTeams.length})
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'pokemon' ? (
        /* Favorites Pokémon Tab */
        favoritedPokemonList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoritedPokemonList.map(pk => {
              const primaryType = pk.types[0];
              const typeColor = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
              
              return (
                <div
                  key={pk.id}
                  className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col items-center relative border border-slate-850 group cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.fav-btn')) return;
                    router.push(`/pokemon/${pk.name}`);
                  }}
                >
                  {/* ID */}
                  <span className="absolute top-3.5 left-4 text-[9px] font-bold font-mono text-slate-500">
                    #{pk.id.toString().padStart(3, '0')}
                  </span>

                  {/* Remove Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(pk.id)}
                    className="fav-btn absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 border border-slate-800/40 hover:bg-slate-800 text-rose-500 hover:text-rose-450 transition-colors z-10"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                  </button>

                  {/* Sprite */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center relative my-3">
                    <div
                      style={{ backgroundColor: `${typeColor}08` }}
                      className="absolute inset-0 rounded-full blur-xl animate-pulse scale-90"
                    />
                    <img
                      src={pk.sprite}
                      alt={pk.displayName}
                      className="w-full h-full object-contain relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105"
                    />
                  </div>

                  {/* Name */}
                  <h3 className="font-extrabold text-xs text-slate-200 text-center tracking-tight truncate w-full group-hover:text-blue-400 transition-colors">
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
                          borderColor: `${TYPE_COLORS[t]}2c`,
                        }}
                        className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Favorites state */
          <div className="glass-panel rounded-3xl p-12 border border-slate-900 text-center flex flex-col items-center justify-center gap-6 min-h-[350px]">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500">
              <Heart className="w-8 h-8 text-slate-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-1.5">Your Pokedex is Empty</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Discover random Pokémon through the generator, save your favorites, and catalog them here.
              </p>
            </div>
            <button
              onClick={() => router.push('/randomizer')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full transition-all duration-200 shadow-md shadow-blue-900/30"
            >
              Start Randomizing
            </button>
          </div>
        )
      ) : (
        /* Saved Teams Tab */
        savedTeams.length > 0 ? (
          <div className="flex flex-col gap-6">
            {savedTeams.map(team => (
              <div
                key={team.id}
                className="glass-panel rounded-2xl p-5 border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md"
              >
                
                {/* Team meta & description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-extrabold text-slate-200 truncate">{team.name}</h3>
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {team.notes ? (
                    <p className="text-slate-400 text-xs leading-relaxed max-w-md line-clamp-2">
                      {team.notes}
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-550 italic">No notes added.</span>
                  )}
                </div>

                {/* Team Roster Sprite Mini Grid */}
                <div className="flex flex-wrap gap-2 items-center bg-slate-950/20 p-2.5 rounded-xl border border-slate-900/60">
                  {team.pokemon.map((pk, idx) => {
                    const primaryType = pk.types[0] || 'normal';
                    const typeColor = TYPE_COLORS[primaryType];
                    return (
                      <div
                        key={idx}
                        onClick={() => router.push(`/pokemon/${pk.name}`)}
                        className="w-12 h-12 flex items-center justify-center bg-[#0b0e16] border border-slate-850 rounded-lg hover:border-slate-700 transition-colors cursor-pointer group relative"
                        title={pk.displayName}
                      >
                        <img
                          src={pk.sprite}
                          alt={pk.displayName}
                          className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Actions buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => router.push(`/team-builder?team=${team.pokemon.map(p => p.id).join(',')}`)}
                    className="flex-1 md:flex-initial px-3.5 py-2 bg-[#161c2b] hover:bg-[#1f2638] border border-slate-800 text-slate-250 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Load Team in Builder"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    Load
                  </button>
                  <button
                    onClick={() => handleCopyTeamShowdown(team)}
                    className="flex-1 md:flex-initial px-3.5 py-2 bg-[#161c2b] hover:bg-[#1f2638] border border-slate-800 text-slate-250 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Copy Showdown Sets"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-indigo-500" />
                    Showdown
                  </button>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="p-2 border border-slate-800 bg-[#161c2b]/30 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition-all"
                    title="Delete Saved Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* Empty Teams state */
          <div className="glass-panel rounded-3xl p-12 border border-slate-900 text-center flex flex-col items-center justify-center gap-6 min-h-[350px]">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500">
              <Layers className="w-8 h-8 text-slate-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-1.5">No Teams Saved Yet</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Assemble and draft custom rosters in the Team Builder workspace, then register them here for tracking.
              </p>
            </div>
            <button
              onClick={() => router.push('/team-builder')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full transition-all duration-200 shadow-md shadow-blue-900/30"
            >
              Open Team Builder
            </button>
          </div>
        )
      )}

    </div>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}
