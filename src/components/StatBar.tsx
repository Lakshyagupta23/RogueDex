'use client';

import React, { useEffect, useState } from 'react';
import { STAT_LABELS, STAT_COLORS, STAT_TEXT_COLORS } from '@/lib/pokemon/constants';

interface StatBarProps {
  statKey: string;
  value: number;
}

export default function StatBar({ statKey, value }: StatBarProps) {
  const [width, setWidth] = useState(0);
  const max = 255; // Maximum possible base stat value in Pokémon
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    // Small delay to trigger animation smoothly after mount
    const t = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(t);
  }, [percentage, value]);

  const colorClass = STAT_COLORS[statKey] || 'bg-slate-500';
  const label = STAT_LABELS[statKey] || statKey.toUpperCase();
  const textColor = STAT_TEXT_COLORS[statKey] || 'text-slate-300';

  return (
    <div className="flex items-center gap-4 text-xs font-semibold">
      <span className={`w-8 font-mono font-black ${textColor}`}>{label}</span>
      <span className="w-8 text-right text-slate-200 font-mono font-bold">{value}</span>
      <div className="flex-1 h-2.5 bg-slate-950/90 rounded-full overflow-hidden border border-slate-800/80 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
