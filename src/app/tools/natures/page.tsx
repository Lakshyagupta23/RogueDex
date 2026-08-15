'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Scale, HelpCircle } from 'lucide-react';

interface NatureRecord {
  name: string;
  increased: 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed' | 'none';
  decreased: 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed' | 'none';
  likes: string;
  dislikes: string;
}

const NATURES: NatureRecord[] = [
  { name: 'Adamant', increased: 'attack', decreased: 'spAtk', likes: 'Spicy', dislikes: 'Dry' },
  { name: 'Bashful', increased: 'none', decreased: 'none', likes: 'None (Neutral)', dislikes: 'None' },
  { name: 'Bold', increased: 'defense', decreased: 'attack', likes: 'Sour', dislikes: 'Spicy' },
  { name: 'Brave', increased: 'attack', decreased: 'speed', likes: 'Spicy', dislikes: 'Sweet' },
  { name: 'Calm', increased: 'spDef', decreased: 'attack', likes: 'Bitter', dislikes: 'Spicy' },
  { name: 'Careful', increased: 'spDef', decreased: 'spAtk', likes: 'Bitter', dislikes: 'Dry' },
  { name: 'Docile', increased: 'none', decreased: 'none', likes: 'None (Neutral)', dislikes: 'None' },
  { name: 'Gentle', increased: 'spDef', decreased: 'defense', likes: 'Bitter', dislikes: 'Sour' },
  { name: 'Hardy', increased: 'none', decreased: 'none', likes: 'None (Neutral)', dislikes: 'None' },
  { name: 'Hasty', increased: 'speed', decreased: 'defense', likes: 'Sweet', dislikes: 'Sour' },
  { name: 'Impish', increased: 'defense', decreased: 'spAtk', likes: 'Sour', dislikes: 'Dry' },
  { name: 'Jolly', increased: 'speed', decreased: 'spAtk', likes: 'Sweet', dislikes: 'Dry' },
  { name: 'Lax', increased: 'defense', decreased: 'spDef', likes: 'Sour', dislikes: 'Bitter' },
  { name: 'Lonely', increased: 'attack', decreased: 'defense', likes: 'Spicy', dislikes: 'Sour' },
  { name: 'Mild', increased: 'spAtk', decreased: 'defense', likes: 'Dry', dislikes: 'Sour' },
  { name: 'Modest', increased: 'spAtk', decreased: 'attack', likes: 'Dry', dislikes: 'Spicy' },
  { name: 'Naive', increased: 'speed', decreased: 'spDef', likes: 'Sweet', dislikes: 'Bitter' },
  { name: 'Naughty', increased: 'attack', decreased: 'spDef', likes: 'Spicy', dislikes: 'Bitter' },
  { name: 'Quiet', increased: 'spAtk', decreased: 'speed', likes: 'Dry', dislikes: 'Sweet' },
  { name: 'Quirky', increased: 'none', decreased: 'none', likes: 'None (Neutral)', dislikes: 'None' },
  { name: 'Rash', increased: 'spAtk', decreased: 'spDef', likes: 'Dry', dislikes: 'Bitter' },
  { name: 'Relaxed', increased: 'defense', decreased: 'speed', likes: 'Sour', dislikes: 'Sweet' },
  { name: 'Sassy', increased: 'spDef', decreased: 'speed', likes: 'Bitter', dislikes: 'Sweet' },
  { name: 'Serious', increased: 'none', decreased: 'none', likes: 'None (Neutral)', dislikes: 'None' },
  { name: 'Timid', increased: 'speed', decreased: 'attack', likes: 'Sweet', dislikes: 'Spicy' },
];

const STAT_LABELS = {
  attack: 'Attack',
  defense: 'Defense',
  spAtk: 'Sp. Atk',
  spDef: 'Sp. Def',
  speed: 'Speed',
  none: 'None (Neutral)',
};

export default function NaturesPage() {
  const router = useRouter();
  const [filterBoost, setFilterBoost] = useState<string>('all');
  const [filterDrop, setFilterDrop] = useState<string>('all');

  const filteredNatures = useMemo(() => {
    return NATURES.filter(n => {
      const matchBoost = filterBoost === 'all' || n.increased === filterBoost;
      const matchDrop = filterDrop === 'all' || n.decreased === filterDrop;
      return matchBoost && matchDrop;
    });
  }, [filterBoost, filterDrop]);

  return (
    <div className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold bg-[#111622] hover:bg-[#181e2b] px-4 py-2 border border-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <span className="text-xs font-bold text-slate-550 flex items-center gap-1.5 uppercase">
          <Scale className="w-4 h-4 text-blue-500" />
          Pokémon Natures Reference
        </span>
      </div>

      <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Nature <span className="text-blue-500">Guide</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Natures affect how stats grow. Each non-neutral nature increases one base stat by 10% and decreases another by 10%.
          </p>
        </div>

        {/* Filters Select boxes */}
        <div className="flex flex-wrap gap-3 justify-center">
          
          <div className="flex items-center gap-2 bg-[#111622] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-350">
            <span className="font-semibold uppercase tracking-wider text-slate-550 text-[9px]">+10% Boost</span>
            <select
              value={filterBoost}
              onChange={(e) => setFilterBoost(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-[#0f1420]">All stats</option>
              <option value="attack" className="bg-[#0f1420]">Attack</option>
              <option value="defense" className="bg-[#0f1420]">Defense</option>
              <option value="spAtk" className="bg-[#0f1420]">Sp. Atk</option>
              <option value="spDef" className="bg-[#0f1420]">Sp. Def</option>
              <option value="speed" className="bg-[#0f1420]">Speed</option>
              <option value="none" className="bg-[#0f1420]">Neutral</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#111622] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-350">
            <span className="font-semibold uppercase tracking-wider text-slate-550 text-[9px]">-10% Drop</span>
            <select
              value={filterDrop}
              onChange={(e) => setFilterDrop(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-[#0f1420]">All stats</option>
              <option value="attack" className="bg-[#0f1420]">Attack</option>
              <option value="defense" className="bg-[#0f1420]">Defense</option>
              <option value="spAtk" className="bg-[#0f1420]">Sp. Atk</option>
              <option value="spDef" className="bg-[#0f1420]">Sp. Def</option>
              <option value="speed" className="bg-[#0f1420]">Speed</option>
              <option value="none" className="bg-[#0f1420]">Neutral</option>
            </select>
          </div>

        </div>
      </div>

      {/* Natures Table */}
      <div className="glass-panel border-slate-850 rounded-3xl overflow-hidden shadow-2xl mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4.5 px-6 font-semibold">Nature Name</th>
                <th className="py-4.5 px-6 font-semibold text-green-400">+10% Increased</th>
                <th className="py-4.5 px-6 font-semibold text-rose-400">-10% Decreased</th>
                <th className="py-4.5 px-6 font-semibold">Favorite Flavor</th>
                <th className="py-4.5 px-6 font-semibold">Disliked Flavor</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850/60 bg-[#111622]/40">
              {filteredNatures.length > 0 ? (
                filteredNatures.map((n) => {
                  const isNeutral = n.increased === 'none';
                  return (
                    <tr
                      key={n.name}
                      className="hover:bg-slate-900/35 transition-colors font-sans text-slate-300"
                    >
                      <td className="py-4 px-6 font-extrabold text-white text-xs tracking-tight">{n.name}</td>
                      <td className={`py-4 px-6 font-semibold ${isNeutral ? 'text-slate-500' : 'text-green-400/90'}`}>
                        {STAT_LABELS[n.increased]}
                      </td>
                      <td className={`py-4 px-6 font-semibold ${isNeutral ? 'text-slate-500' : 'text-rose-400/90'}`}>
                        {STAT_LABELS[n.decreased]}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{n.likes}</td>
                      <td className="py-4 px-6 text-slate-400">{n.dislikes}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-550">
                    <HelpCircle className="w-8 h-8 mx-auto text-slate-700 mb-3" />
                    <span>No natures match active stat filters.</span>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
