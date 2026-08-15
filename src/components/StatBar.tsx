'use client';

import React, { useEffect, useState } from 'react';
import { STAT_LABELS, STAT_COLORS } from '@/lib/pokemon/constants';

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

  return (
    <div className="flex items-center gap-4 text-xs font-semibold">
      <span className="w-8 text-slate-400 font-mono">{label}</span>
      <span className="w-8 text-right text-slate-200 font-mono">{value}</span>
      <div className="flex-1 h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/40">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
