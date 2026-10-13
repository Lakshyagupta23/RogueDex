'use client';

import React from 'react';
import { usePokemon } from '@/context/PokemonContext';
import { TYPE_COLORS } from '@/lib/pokemon/constants';

export default function AmbientAura() {
  const { ambientType } = usePokemon();
  const activeColor = ambientType ? (TYPE_COLORS[ambientType] || '#EF4444') : null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-700 ease-out">
      {/* Background Wallpaper Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none transition-opacity duration-700"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      />

      {/* Esports Stadium Dot-Matrix Grid Texture */}
      <div className="absolute inset-0 stadium-grid-bg opacity-70 pointer-events-none" />

      {/* Dynamic Ambient Flare 1 (Top-Left) */}
      <div 
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[140px] mix-blend-screen transition-all duration-700 ease-out"
        style={{
          backgroundColor: activeColor ? `${activeColor}26` : 'rgba(239, 68, 68, 0.12)',
          transform: activeColor ? 'scale(1.15)' : 'scale(1)',
        }}
      />

      {/* Dynamic Ambient Flare 2 (Top-Right) */}
      <div 
        className="absolute -top-24 -right-24 w-[550px] h-[550px] rounded-full blur-[140px] mix-blend-screen transition-all duration-700 ease-out"
        style={{
          backgroundColor: activeColor ? `${activeColor}22` : 'rgba(245, 158, 11, 0.12)',
          transform: activeColor ? 'scale(1.1)' : 'scale(1)',
        }}
      />

      {/* Dynamic Ambient Flare 3 (Center Horizon) */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[750px] h-[500px] rounded-full blur-[150px] mix-blend-screen transition-all duration-700 ease-out"
        style={{
          backgroundColor: activeColor ? `${activeColor}1c` : 'rgba(99, 102, 241, 0.10)',
        }}
      />

      {/* Dynamic Ambient Flare 4 (Bottom-Left) */}
      <div 
        className="absolute -bottom-32 -left-20 w-[650px] h-[650px] rounded-full blur-[150px] mix-blend-screen transition-all duration-700 ease-out"
        style={{
          backgroundColor: activeColor ? `${activeColor}22` : 'rgba(16, 185, 129, 0.12)',
        }}
      />

      {/* Dynamic Ambient Flare 5 (Bottom-Right) */}
      <div 
        className="absolute -bottom-24 -right-20 w-[600px] h-[600px] rounded-full blur-[140px] mix-blend-screen transition-all duration-700 ease-out"
        style={{
          backgroundColor: activeColor ? `${activeColor}24` : 'rgba(168, 85, 247, 0.12)',
        }}
      />

      {/* Vignette Overlay to maintain dark obsidian readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080f]/50 via-[#06080f]/85 to-[#06080f]/98 transition-colors duration-700" />
    </div>
  );
}
