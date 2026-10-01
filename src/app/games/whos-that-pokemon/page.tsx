'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, Trophy, Sparkles, HelpCircle, Volume2, Sparkle } from 'lucide-react';
import { usePokemon } from '@/context/PokemonContext';
import { PokemonIndexItem } from '@/lib/pokemon/types';
import confetti from 'canvas-confetti';
import { TYPE_COLORS } from '@/lib/pokemon/constants';
import { playPokemonCry, playHoverTick, playSelectClick } from '@/lib/audio';

export default function WhosThatPokemonPage() {
  const router = useRouter();
  const { pokemonList, loading, error } = usePokemon();

  // Scoreboard
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Game States
  const [targetPokemon, setTargetPokemon] = useState<PokemonIndexItem | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [guessedIncorrect, setGuessedIncorrect] = useState<string[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasCheated, setHasCheated] = useState(false);

  // Load best streak on mount
  useEffect(() => {
    const savedBest = localStorage.getItem('roguedex_whos_that_best');
    if (savedBest) {
      setBestStreak(Number(savedBest));
    }
  }, []);

  // Initialize a new round
  const startNewRound = () => {
    if (pokemonList.length === 0) return;

    // 1. Pick a random target Pokémon
    const target = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    setTargetPokemon(target);
    setIsRevealed(false);
    setGuessedIncorrect([]);
    setHasCheated(false);

    // 2. Pick 3 random incorrect option names
    const incorrectOptions: string[] = [];
    while (incorrectOptions.length < 3) {
      const randomPk = pokemonList[Math.floor(Math.random() * pokemonList.length)];
      if (
        randomPk.speciesId !== target.speciesId &&
        !incorrectOptions.includes(randomPk.displayName)
      ) {
        incorrectOptions.push(randomPk.displayName);
      }
    }

    // 3. Combine and shuffle options
    const allOptions = [target.displayName, ...incorrectOptions].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  };

  // Start initial round when pokemon list loads
  useEffect(() => {
    if (pokemonList.length > 0 && !targetPokemon) {
      startNewRound();
    }
  }, [pokemonList, targetPokemon]);


  const handleGuess = (guess: string) => {
    if (isRevealed || !targetPokemon) return;

    if (guess === targetPokemon.displayName) {
      // Correct Guess!
      setIsRevealed(true);
      
      // Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem('roguedex_whos_that_best', newStreak.toString());
      }

      // Play audio cry
      playPokemonCry(targetPokemon.speciesId);

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
    } else {
      // Incorrect Guess!
      if (!guessedIncorrect.includes(guess)) {
        setGuessedIncorrect(prev => [...prev, guess]);
      }
      // Reset streak
      setStreak(0);
    }
  };

  const handleSkip = () => {
    setStreak(0);
    startNewRound();
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-semibold animate-pulse">Loading game assets...</p>
      </div>
    );
  }

  if (error || pokemonList.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20 text-center">
        <HelpCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-200 mb-2">Game Could Not Load</h2>
        <p className="text-slate-455 text-sm max-w-sm">Failed to connect to the Pokémon database index.</p>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6 items-center">
      
      {/* Top Header actions */}
      <div className="w-full flex justify-between items-center border-b border-slate-900 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold bg-[#111622] hover:bg-[#181e2b] px-4 py-2 border border-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-4">
          {/* Current streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin duration-3000" />
            STREAK: {streak}
          </div>
          {/* Best streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-yellow-500 animate-bounce" />
            BEST: {bestStreak}
          </div>
        </div>
      </div>

      <div className="w-full text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          Who's That <span className="text-blue-500">Pokémon?</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Guess the correct Pokémon name based on its silhouette outline!
        </p>
      </div>

      {targetPokemon && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-4">
          
          {/* Left Silhouette Area */}
          <div className="flex flex-col items-center justify-center p-8 bg-[#111622] border border-slate-850 rounded-3xl min-h-[320px] relative overflow-hidden group shadow-2xl">
            
            {/* Background glowing circle */}
            <div className="absolute w-48 h-48 rounded-full blur-3xl opacity-20 scale-90 animate-pulse bg-blue-500" />

            <div className="w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center relative">
              <img
                src={targetPokemon.sprite}
                alt="Silhouette Guess target"
                style={{
                  filter: isRevealed ? 'none' : 'brightness(0)',
                }}
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out"
              />
            </div>

            {isRevealed && (
              <button
                onClick={() => playPokemonCry(targetPokemon.id)}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800 transition-colors z-25"
                title="Hear Cry"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Choice Buttons or Reveal Details */}
          <div className="flex flex-col gap-5 justify-center">
            
            {!isRevealed ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((optionName, idx) => {
                    const isIncorrect = guessedIncorrect.includes(optionName);
                    return (
                      <button
                        key={idx}
                        disabled={isIncorrect}
                        onClick={() => { playHoverTick(); handleGuess(optionName); }}
                        className={`w-full py-3.5 px-5 rounded-2xl border text-sm font-bold transition-all text-center ${
                          isIncorrect
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 cursor-not-allowed opacity-50'
                            : 'bg-[#111622] border-slate-800 text-slate-300 hover:border-blue-500 hover:text-white hover:bg-blue-600/5 cursor-pointer active:scale-98'
                        }`}
                      >
                        {optionName}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-2 border-t border-slate-900 pt-4">
                  <button
                    onClick={() => {
                      setIsRevealed(true);
                      setStreak(0);
                      setHasCheated(true);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-350 hover:underline transition-all"
                  >
                    Give Up & Reveal
                  </button>
                  <button
                    onClick={() => { playHoverTick(); handleSkip(); }}
                    className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-full transition-all"
                  >
                    Skip & Reset
                  </button>
                </div>
              </>
            ) : (
              // Revealed State
              <div className="glass-panel border-slate-800 p-6 rounded-2xl flex flex-col gap-4 animate-fade-in">
                <span className="font-mono text-[10px] font-extrabold tracking-wider uppercase text-blue-500">
                  {hasCheated ? 'REVEALED RESULT' : '🎉 CORRECT ANSWER!'}
                </span>
                
                <div>
                  <h2 className="text-2xl font-black text-white capitalize">
                    It's {targetPokemon.displayName}!
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Species #{targetPokemon.id.toString().padStart(3, '0')} | Generation {targetPokemon.generation}
                  </p>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {targetPokemon.types.map(t => (
                    <span
                      key={t}
                      style={{
                        backgroundColor: `${TYPE_COLORS[t]}1a`,
                        color: TYPE_COLORS[t],
                        borderColor: `${TYPE_COLORS[t]}25`,
                      }}
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {targetPokemon.displayName} is a {targetPokemon.types.join('/')}-type Pokémon introduced in Generation {targetPokemon.generation}.
                </p>

                <div className="flex gap-3 border-t border-slate-900 pt-4 mt-2">
                  <a
                    href={`/pokemon/${targetPokemon.name}`}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl text-center transition-all"
                  >
                    View Dex Profile
                  </a>
                  <button
                    onClick={() => { playSelectClick(); startNewRound(); }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition-all active:scale-98"
                  >
                    Next Pokémon
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
