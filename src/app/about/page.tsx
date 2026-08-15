import React from 'react';
import { Shield, Sparkles, Trophy, Zap, Layers, Code } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-6 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          About <span className="text-blue-500">RogueDex</span>
        </h1>
        <p className="text-slate-400 text-sm">
          A premium companion tool engineered for Pokémon challenge runs, team drafts, and database discovery.
        </p>
      </div>

      {/* Main sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Core Values */}
        <div className="flex flex-col gap-6">
          <h2 className="font-extrabold text-lg text-slate-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Core Philosophy
          </h2>
          <p className="text-slate-350 text-xs leading-relaxed">
            RogueDex was built on a simple principle: discoverability should feel like playing a game. Most random number generators look like generic lists. RogueDex provides a dark, responsive, gaming-inspired interface with slot animations and real-time statistics that fit right into any game stream or challenge session.
          </p>
          <p className="text-slate-350 text-xs leading-relaxed">
            Whether you are preparing a Nuzlocke run, generating monotype rosters, or looking for random Showdown sets, RogueDex accelerates drafting so you can spend less time clicking buttons and more time battling.
          </p>
        </div>

        {/* Feature list box */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-850 shadow-md flex flex-col gap-4">
          <h2 className="font-extrabold text-sm text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Sparkles className="w-4.5 h-4.5 text-yellow-500" />
            RogueDex Blueprint
          </h2>
          
          <div className="flex flex-col gap-3.5 text-xs">
            <div className="flex gap-3">
              <Zap className="w-4 h-4 text-blue-550 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200">Instant Filtering Randomizer</h4>
                <p className="text-slate-450 text-[11px] mt-0.5">Filter by multiple generations, types, and special flags simultaneously with sub-50ms render times.</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-900/60 pt-3">
              <Layers className="w-4 h-4 text-indigo-550 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200">Balanced Team Drafts</h4>
                <p className="text-slate-450 text-[11px] mt-0.5">Generate 3 or 6 Pokémon teams. Lock specific slots to reroll around them. Tracks type coverages and defensive vulnerabilities.</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-900/60 pt-3">
              <Trophy className="w-4 h-4 text-yellow-550 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200">Challenge Run Chamber</h4>
                <p className="text-slate-450 text-[11px] mt-0.5">Prebuilt templates enforce rules (Monotype, Generation locks, Baby squad, Heavyweights) for challenge creators.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Tech Stack credits */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-850 flex flex-col md:flex-row items-center gap-6 shadow-md mt-4">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
          <Code className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-slate-250 text-sm mb-1">Modern Web Technology Stack</h3>
          <p className="text-slate-450 text-xs leading-relaxed">
            RogueDex is constructed using <strong>Next.js (App Router)</strong>, <strong>TypeScript</strong>, <strong>Tailwind CSS v4</strong>, <strong>Framer Motion</strong>, and <strong>LocalStorage</strong> APIs. This design ensures that all filters, randomizers, and favorites states are processed locally inside the browser.
          </p>
        </div>
      </div>

    </div>
  );
}
