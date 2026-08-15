import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-900 bg-[#06080e] py-8 text-slate-500 text-xs mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-900/60 pb-6">
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-400">
              Rogue<span className="text-blue-500">Dex</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-slate-400">
            <Link href="/randomizer" className="hover:text-blue-400 transition-colors">Randomizer</Link>
            <Link href="/team-builder" className="hover:text-blue-400 transition-colors">Team Builder</Link>
            <Link href="/challenges" className="hover:text-blue-400 transition-colors">Challenges</Link>
            <Link href="/pokemon" className="hover:text-blue-400 transition-colors">Pokédex</Link>
            <Link href="/favorites" className="hover:text-blue-400 transition-colors">Favorites</Link>
            <Link href="/about" className="hover:text-blue-400 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy</Link>
          </div>

        </div>

        <div className="flex flex-col gap-3 text-center md:text-left mt-6 text-[11px] leading-relaxed">
          <p>
            RogueDex is a fan-made, non-commercial tool. All Pokémon assets, names, and images are trademarks of Nintendo, Game Freak, and The Pokémon Company.
          </p>
          <p>
            Pokémon data is fetched via the open-source <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 underline transition-colors">PokéAPI</a>. Special thanks to the PokéAPI maintainers and community.
          </p>
          <p className="text-[10px] text-slate-650">
            &copy; {new Date().getFullYear()} RogueDex. Created for Pokémon challenge runs and team building.
          </p>
        </div>
      </div>
    </footer>
  );
}
