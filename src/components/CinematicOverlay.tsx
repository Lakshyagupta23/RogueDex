'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerProfile, getRankForLevel } from '@/context/PlayerProfileContext';
import { playLegendary, playRevealChime } from '@/lib/audio';

export default function CinematicOverlay() {
  const { justLeveledUpTo, justUnlockedAchievements, clearLevelUpAnimation, clearAchievementAnimation } = usePlayerProfile();
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  
  // Handle Level Up
  useEffect(() => {
    if (justLeveledUpTo !== null && activeLevel === null) {
      setActiveLevel(justLeveledUpTo);
      playLegendary();
      setTimeout(() => {
        setActiveLevel(null);
        clearLevelUpAnimation();
      }, 4000);
    }
  }, [justLeveledUpTo, activeLevel, clearLevelUpAnimation]);
  
  // Optional: We can handle justUnlockedAchievements popup toast here later
  
  return (
    <AnimatePresence>
      {activeLevel !== null && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, rotateX: 90 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="flex flex-col items-center justify-center text-center p-8 rounded-3xl relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(168,85,247,0.4)_360deg)] rounded-full mix-blend-screen"
            />
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative z-10 text-9xl mb-6 filter drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]"
            >
              {getRankForLevel(activeLevel).icon}
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-fuchsia-400 uppercase tracking-[0.5em] mb-2 z-10 drop-shadow-md"
            >
              Level Up!
            </motion.h2>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-6xl font-black text-white z-10 mb-2 drop-shadow-lg"
            >
              Level {activeLevel}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className={`text-2xl font-black ${getRankForLevel(activeLevel).color} z-10 uppercase tracking-widest drop-shadow-md`}
            >
              {getRankForLevel(activeLevel).name}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
