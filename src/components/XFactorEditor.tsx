'use client';

import React, { useState } from 'react';
import { X, Sparkles, Shield, Zap, Heart, Sword, Sliders } from 'lucide-react';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import { BattleMove } from '@/lib/pokemon/battle/types';
import { POKEMON_TYPES, STAT_LABELS } from '@/lib/pokemon/constants';

interface XFactorEditorProps {
  pokemon: PokemonIndexItem;
  onSave: (customConfig: any) => void;
  onClose: () => void;
}

export default function XFactorEditor({ pokemon, onSave, onClose }: XFactorEditorProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'moves' | 'stats'>('basics');

  // Custom typing
  const [type1, setType1] = useState<string>(pokemon.types[0] || 'normal');
  const [type2, setType2] = useState<string>(pokemon.types[1] || 'none');

  // Ability and Item
  const [ability, setAbility] = useState<string>('Inner Focus');
  const [item, setItem] = useState<string>('Leftovers');

  // Custom movesets (4 slots)
  const [moves, setMoves] = useState<BattleMove[]>([
    { name: pokemon.types[0] ? pokemon.types[0].toUpperCase() + ' Attack' : 'Tackle', type: pokemon.types[0] || 'normal', category: 'Physical', power: 80, accuracy: 100, pp: 15, maxPp: 15, priority: 0, effectType: 'damage' },
    { name: 'Swords Dance', type: 'normal', category: 'Status', power: 0, accuracy: 100, pp: 20, maxPp: 20, priority: 0, effectType: 'boost', effectTarget: 'self', effectValue: 'atk:2' },
    { name: 'Recover', type: 'normal', category: 'Status', power: 0, accuracy: 100, pp: 10, maxPp: 10, priority: 0, effectType: 'heal', effectValue: '0.5' },
    { name: 'Extreme Speed', type: 'normal', category: 'Physical', power: 80, accuracy: 100, pp: 5, maxPp: 5, priority: 2, effectType: 'damage' }
  ]);

  // Base Stats custom values
  const [baseStats, setBaseStats] = useState({
    hp: pokemon.stats.hp,
    atk: pokemon.stats.atk,
    def: pokemon.stats.def,
    spAtk: pokemon.stats.spAtk,
    spDef: pokemon.stats.spDef,
    spe: pokemon.stats.spe,
  });

  // EV / IV configurations
  const [evs, setEvs] = useState({ hp: 84, atk: 84, def: 84, spAtk: 84, spDef: 84, spe: 84 });
  const [ivs, setIvs] = useState({ hp: 31, atk: 31, def: 31, spAtk: 31, spDef: 31, spe: 31 });

  // Calculate current EV sum
  const totalEvs = Object.values(evs).reduce((a, b) => a + b, 0);

  const handleEvChange = (stat: keyof typeof evs, value: number) => {
    const nextEvs = { ...evs, [stat]: value };
    const nextSum = Object.values(nextEvs).reduce((a, b) => a + b, 0);
    if (nextSum <= 508) {
      setEvs(nextEvs);
    }
  };

  const handleMoveChange = (idx: number, field: keyof BattleMove, val: any) => {
    setMoves(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSave = () => {
    const types = type2 === 'none' ? [type1] : [type1, type2];
    onSave({
      types,
      ability,
      item,
      moves,
      stats: baseStats,
      evs,
      ivs,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-[#0f1524] border border-blue-500/25 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 p-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">X-Factor Customizer</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modifying: {pokemon.displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-900 px-6 py-2 bg-slate-950/40 shrink-0 gap-2">
          {[
            { id: 'basics', label: 'Types & Details', icon: Shield },
            { id: 'moves', label: 'Custom moveset', icon: Sword },
            { id: 'stats', label: 'EVs & Base Stats', icon: Sliders },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active 
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/25'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="flex flex-col gap-6">
              
              {/* Type Changer */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5">
                <h3 className="text-xs font-extrabold text-white mb-3 uppercase tracking-wider">Change Typing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Primary Type</label>
                    <select
                      value={type1}
                      onChange={(e) => setType1(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/50"
                    >
                      {POKEMON_TYPES.map(t => (
                        <option key={t} value={t}>{t.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Secondary Type</label>
                    <select
                      value={type2}
                      onChange={(e) => setType2(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/50"
                    >
                      <option value="none">NONE</option>
                      {POKEMON_TYPES.map(t => (
                        <option key={t} value={t}>{t.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ability & Item */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5">
                <h3 className="text-xs font-extrabold text-white mb-3 uppercase tracking-wider">Core details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Custom Ability</label>
                    <input
                      type="text"
                      value={ability}
                      onChange={(e) => setAbility(e.target.value)}
                      placeholder="e.g. Wonder Guard"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Custom Item</label>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => setItem(e.target.value)}
                      placeholder="e.g. Life Orb"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MOVES */}
          {activeTab === 'moves' && (
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Build four completely customized attacks:</p>
              
              {moves.map((move, idx) => (
                <div key={idx} className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-900/60 pb-2">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Move Slot #{idx + 1}</span>
                    <select
                      value={move.type}
                      onChange={(e) => handleMoveChange(idx, 'type', e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-300 outline-none"
                    >
                      {POKEMON_TYPES.map(t => (
                        <option key={t} value={t}>{t.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Move Name</label>
                      <input
                        type="text"
                        value={move.name}
                        onChange={(e) => handleMoveChange(idx, 'name', e.target.value)}
                        placeholder="Attack Name"
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Category</label>
                      <select
                        value={move.category}
                        onChange={(e) => handleMoveChange(idx, 'category', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none"
                      >
                        <option value="Physical">PHYSICAL</option>
                        <option value="Special">SPECIAL</option>
                        <option value="Status">STATUS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Power</label>
                      <input
                        type="number"
                        value={move.power}
                        onChange={(e) => handleMoveChange(idx, 'power', Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Accuracy (%)</label>
                      <input
                        type="number"
                        value={move.accuracy}
                        onChange={(e) => handleMoveChange(idx, 'accuracy', Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                      <input
                        type="number"
                        value={move.priority}
                        onChange={(e) => handleMoveChange(idx, 'priority', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Effect Type</label>
                      <select
                        value={move.effectType || 'damage'}
                        onChange={(e) => handleMoveChange(idx, 'effectType', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none"
                      >
                        <option value="damage">DAMAGE ONLY</option>
                        <option value="status">APPLY STATUS</option>
                        <option value="boost">STAT BOOST</option>
                        <option value="heal">HEALING</option>
                        <option value="hazard">SET HAZARD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Effect Value</label>
                      <input
                        type="text"
                        value={move.effectValue || ''}
                        onChange={(e) => handleMoveChange(idx, 'effectValue', e.target.value)}
                        placeholder="e.g. TOX, atk:1, 0.5"
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-6">
              
              {/* Custom Base Stats */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Change Base Stats</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {(Object.keys(baseStats) as Array<keyof typeof baseStats>).map(stat => (
                    <div key={stat} className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{STAT_LABELS[stat]}</span>
                      <input
                        type="number"
                        value={baseStats[stat]}
                        onChange={(e) => setBaseStats(prev => ({ ...prev, [stat]: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg text-center py-1 text-xs font-black text-indigo-400 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* EV Sliders */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-900/60 pb-2">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Effort Values (EVs)</h3>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${totalEvs >= 508 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                    EV Total: {totalEvs} / 508
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {(Object.keys(evs) as Array<keyof typeof evs>).map(stat => (
                    <div key={stat} className="flex items-center justify-between gap-4">
                      <span className="w-10 text-[10px] font-black text-slate-400 uppercase shrink-0">{STAT_LABELS[stat]}</span>
                      <input
                        type="range"
                        min="0"
                        max="252"
                        step="4"
                        value={evs[stat]}
                        onChange={(e) => handleEvChange(stat, parseInt(e.target.value, 10))}
                        className="flex-grow accent-indigo-500 cursor-pointer h-1 bg-slate-900 rounded-lg appearance-none"
                      />
                      <input
                        type="number"
                        value={evs[stat]}
                        onChange={(e) => handleEvChange(stat, Math.max(0, Math.min(252, parseInt(e.target.value, 10) || 0)))}
                        className="w-12 bg-slate-900 border border-slate-800 rounded-lg text-center py-0.5 text-xs font-bold text-slate-200 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-900 p-5 bg-slate-950/20 shrink-0 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 text-xs font-black transition-all"
          >
            Save Customization
          </button>
        </div>

      </div>
    </div>
  );
}
