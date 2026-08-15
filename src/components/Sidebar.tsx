'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield, Heart, Zap, Layers, Sparkles, BookOpen, Smile, Calculator, Grid, HeartHandshake, ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import SearchBar from './SearchBar';

const NAV_ITEMS = [
  { href: '/randomizer', label: 'Randomizer', icon: Zap },
  { href: '/team-builder', label: 'Team Builder', icon: Layers },
  { href: '/pokemon/compare', label: 'Compare', icon: Scale },
  { href: '/games/whos-that-pokemon', label: 'Guess Game', icon: Sparkles },
  { href: '/tools/breeding', label: 'Breeding', icon: HeartHandshake },
  { href: '/tools/iv-calculator', label: 'IV Calc', icon: Calculator },
  { href: '/tools/type-chart', label: 'Type Chart', icon: Grid },
  { href: '/tools/natures', label: 'Natures', icon: BookOpen },
  { href: '/tools/nicknames', label: 'Nicknames', icon: Smile },
  { href: '/pokemon', label: 'Pokédex', icon: Shield },
  { href: '/favorites', label: 'Favorites', icon: Heart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync collapsed state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('roguedex_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('roguedex_sidebar_collapsed', String(nextVal));
  };

  // Avoid hydrations mismatch
  if (!mounted) {
    return <div className="hidden md:block w-20 bg-[#080b12] border-r border-slate-900" />;
  }

  return (
    <>
      {/* Mobile Header (Shows only on mobile viewports) */}
      <header className="md:hidden sticky top-0 z-40 w-full h-16 border-b border-slate-800 bg-[#080b12]/90 backdrop-blur-md px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-1.5 font-bold text-white text-sm">
            <span className="text-blue-500">Rogue</span>Dex
          </Link>
        </div>
        <div className="w-48 sm:w-60">
          <SearchBar />
        </div>
      </header>

      {/* Mobile Drawer (Left slide-over overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
          />
          
          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-xs bg-[#0b101b] border-r border-slate-900 p-5 h-full animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <span className="text-base font-extrabold text-white">
                Rogue<span className="text-blue-500">Dex</span> Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href) || (item.href === '/randomizer' && pathname === '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border-l-4 border-blue-500'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Vertical Sidebar (Stays fixed on left) */}
      <aside
        style={{ width: isCollapsed ? '72px' : '240px' }}
        className="hidden md:flex flex-col sticky top-0 h-screen z-40 bg-[#080b12]/90 border-r border-slate-900 backdrop-blur-md transition-all duration-300 select-none shrink-0"
      >
        
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between border-b border-slate-900 px-4">
          <Link href="/" className="flex items-center gap-2 group overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <Shield className="w-5 h-5 text-white animate-pulse" />
            </div>
            {!isCollapsed && (
              <span className="text-base font-black tracking-tight text-white font-sans truncate animate-fade-in">
                Rogue<span className="text-blue-500">Dex</span>
              </span>
            )}
          </Link>
        </div>

        {/* Global Search Bar (Only shown if sidebar is expanded) */}
        {!isCollapsed && (
          <div className="p-4 border-b border-slate-900/60">
            <SearchBar />
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href) || (item.href === '/randomizer' && pathname === '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl transition-all duration-200 relative group ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.06)]'
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="text-xs font-bold truncate">{item.label}</span>}
                
                {/* Custom Tooltip on Hover in Collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-16 bg-[#0f1420] border border-slate-800 rounded px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-xl">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Collapse/Expand Toggle Button */}
        <div className="p-3 border-t border-slate-900 flex justify-center">
          <button
            onClick={handleToggleCollapse}
            className="p-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

      </aside>
    </>
  );
}
