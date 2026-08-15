'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { TYPE_COLORS } from '@/lib/pokemon/constants';

export default function SearchBar() {
  const router = useRouter();
  const { pokemonList, loading } = usePokemon();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PokemonIndexItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions as query changes
  useEffect(() => {
    if (!query.trim() || loading || pokemonList.length === 0) {
      setSuggestions([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const matches = pokemonList
      .filter(pk => {
        const idStr = pk.id.toString();
        const nameMatch = pk.displayName.toLowerCase().includes(q) || pk.name.toLowerCase().includes(q);
        const idMatch = idStr === q || idStr.padStart(3, '0') === q;
        const typeMatch = pk.types.some(t => t.toLowerCase() === q);
        return nameMatch || idMatch || typeMatch;
      })
      .slice(0, 6); // Max 6 suggestions

    setSuggestions(matches);
  }, [query, pokemonList, loading]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    }
  };

  const handleSelect = (pk: PokemonIndexItem) => {
    router.push(`/pokemon/${pk.name}`);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm" onKeyDown={handleKeyDown}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search name, type, or #ID..."
          className="w-full pl-10 pr-10 py-1.5 bg-[#161c2c] border border-slate-700/60 rounded-full text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 text-sm transition-all shadow-inner"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#111622]/95 border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl">
          <ul className="py-1">
            {suggestions.map((pk, idx) => (
              <li
                key={pk.id}
                onClick={() => handleSelect(pk)}
                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors ${
                  idx === activeIndex
                    ? 'bg-blue-600/20 text-blue-200 border-l-2 border-blue-500'
                    : 'text-slate-350 hover:bg-[#181f2f] hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={pk.sprite} alt={pk.displayName} className="w-8 h-8 object-contain" />
                  <div>
                    <span className="font-semibold">{pk.displayName}</span>
                    <span className="text-xs text-slate-500 ml-2">#{pk.id.toString().padStart(3, '0')}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {pk.types.map(t => (
                    <span
                      key={t}
                      className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: `${TYPE_COLORS[t]}18`,
                        color: TYPE_COLORS[t],
                        borderColor: `${TYPE_COLORS[t]}33`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
