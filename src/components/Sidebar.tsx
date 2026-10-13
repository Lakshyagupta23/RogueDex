'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield, Heart, Zap, Layers, Sparkles, BookOpen, Smile, Calculator, Grid, HeartHandshake, ChevronLeft, ChevronRight, Scale, Users } from 'lucide-react';
import SearchBar from './SearchBar';
import ProfileWidget from './ProfileWidget';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  color: string;
  activeBg: string;
  glow: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/randomizer', label: 'Randomizer', icon: Zap, color: 'text-amber-400', activeBg: 'bg-amber-500/15 border-amber-500 text-amber-300', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  { href: '/team-builder', label: 'Team Builder', icon: Layers, color: 'text-blue-400', activeBg: 'bg-blue-500/15 border-blue-500 text-blue-300', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
  { href: '/draft', label: 'Draft Mode', icon: Users, color: 'text-rose-400', activeBg: 'bg-rose-500/15 border-rose-500 text-rose-300', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
  { href: '/pokemon/compare', label: 'Compare', icon: Scale, color: 'text-purple-400', activeBg: 'bg-purple-500/15 border-purple-500 text-purple-300', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
  { href: '/games/whos-that-pokemon', label: 'Guess Game', icon: Sparkles, color: 'text-yellow-400', activeBg: 'bg-yellow-500/15 border-yellow-500 text-yellow-300', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.2)]' },
  { href: '/tools/breeding', label: 'Breeding', icon: HeartHandshake, color: 'text-pink-400', activeBg: 'bg-pink-500/15 border-pink-500 text-pink-300', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.2)]' },
  { href: '/tools/iv-calculator', label: 'IV Calc', icon: Calculator, color: 'text-cyan-400', activeBg: 'bg-cyan-500/15 border-cyan-500 text-cyan-300', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
  { href: '/tools/type-chart', label: 'Type Chart', icon: Grid, color: 'text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500 text-emerald-300', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
  { href: '/tools/natures', label: 'Natures', icon: BookOpen, color: 'text-teal-400', activeBg: 'bg-teal-500/15 border-teal-500 text-teal-300', glow: 'shadow-[0_0_15px_rgba(20,184,166,0.2)]' },
  { href: '/tools/nicknames', label: 'Nicknames', icon: Smile, color: 'text-orange-400', activeBg: 'bg-orange-500/15 border-orange-500 text-orange-300', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
  { href: '/pokemon', label: 'Pokédex', icon: Shield, color: 'text-red-400', activeBg: 'bg-red-500/15 border-red-500 text-red-300', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
  { href: '/favorites', label: 'Favorites', icon: Heart, color: 'text-rose-500', activeBg: 'bg-rose-500/15 border-rose-500 text-rose-300', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
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
            <span className="text-red-500">Rogue</span>Dex
          </Link>
        </div>
        <div className="w-48 sm:w-60">
          <SearchBar />
        </div>
        <div className="hidden sm:block">
          <ProfileWidget collapsed={true} />
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
                Rogue<span className="text-red-500">Dex</span> Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <ProfileWidget />
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
                        ? `${item.activeBg} border-l-4 ${item.glow}`
                        : 'text-slate-350 hover:bg-slate-900/80 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? item.color : `${item.color} opacity-80 group-hover:opacity-100`}`} />
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 via-rose-500 to-amber-500 shadow-lg shadow-red-500/25 group-hover:shadow-red-500/40 transition-all duration-300">
              <Shield className="w-5 h-5 text-white animate-pulse" />
            </div>
            {!isCollapsed && (
              <span className="text-base font-black tracking-tight text-white font-sans truncate animate-fade-in">
                Rogue<span className="text-red-500">Dex</span>
              </span>
            )}
          </Link>
        </div>

        {/* Profile Widget */}
        <div className="p-3 border-b border-slate-900/60">
           {isCollapsed ? (
             <div className="flex justify-center"><ProfileWidget collapsed={true} /></div>
           ) : (
             <ProfileWidget />
           )}
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
                    ? `${item.activeBg} border ${item.glow}`
                    : 'text-slate-400 border border-transparent hover:text-white hover:bg-slate-900/70'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? item.color : `${item.color} opacity-75 group-hover:opacity-100`}`} />
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

      {/* Mobile Fixed Bottom Navigation Bar (Thumb-Accessible) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#080b12]/95 border-t border-slate-800/80 backdrop-blur-lg px-2 flex items-center justify-around select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <Link
          href="/randomizer"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            pathname === '/' || pathname.startsWith('/randomizer')
              ? 'text-blue-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Randomizer</span>
        </Link>

        <Link
          href="/pokemon"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            pathname.startsWith('/pokemon') && !pathname.includes('/compare')
              ? 'text-blue-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Pokédex</span>
        </Link>

        <Link
          href="/team-builder"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            pathname.startsWith('/team-builder')
              ? 'text-blue-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Team</span>
        </Link>

        <Link
          href="/draft"
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all relative ${
            pathname.startsWith('/draft')
              ? 'text-indigo-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Draft</span>
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <Menu className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </nav>
    </>
  );
}
