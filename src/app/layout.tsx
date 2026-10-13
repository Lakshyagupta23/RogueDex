import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0b0e16",
};
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PokemonProvider } from "@/context/PokemonContext";
import { PlayerProfileProvider } from "@/context/PlayerProfileContext";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import CinematicOverlay from "@/components/CinematicOverlay";
import PwaInstallBanner from "@/components/PwaInstallBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RogueDex - Premium Pokémon Randomizer & Team Builder",
  description: "Randomize Pokémon, generate teams, complete custom challenge runs, analyze type weaknesses, and export competitive sets to Pokémon Showdown.",
  keywords: ["pokemon", "randomizer", "team builder", "nuzlocke", "showdown export", "pokedex", "type coverage", "pokemon challenge"],
  authors: [{ name: "RogueDex Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "RogueDex - Pokémon Randomizer & Team Builder",
    description: "Build teams, randomize Pokémon, and run challenges with RogueDex.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RogueDex - Pokémon Randomizer & Team Builder",
    description: "Build teams, randomize Pokémon, and run challenges with RogueDex.",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased relative overflow-x-hidden">
        {/* Type-Spectrum Multi-Color Ambient Atmosphere */}
        <div 
          className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
          style={{ backgroundImage: "url('/images/bg.jpg')" }}
        />
        {/* Dynamic Multi-Color Ambient Lights */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          {/* Top-left: Pokeball Scarlet / Fire flare */}
          <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-red-600/12 blur-[130px] mix-blend-screen" />
          {/* Top-right: Pikachu Electric Amber Glow */}
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-amber-500/12 blur-[130px] mix-blend-screen" />
          {/* Mid-screen: Cerulean Water / Psychic Aura */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-indigo-600/10 blur-[140px] mix-blend-screen" />
          {/* Bottom-left: Emerald Grass Flora Glow */}
          <div className="absolute -bottom-32 -left-20 w-[600px] h-[600px] rounded-full bg-emerald-600/12 blur-[140px] mix-blend-screen" />
          {/* Bottom-right: Dragon Violet Stadium Flare */}
          <div className="absolute -bottom-24 -right-20 w-[550px] h-[550px] rounded-full bg-purple-600/12 blur-[130px] mix-blend-screen" />
          {/* Soft base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d14]/40 via-[#0a0d14]/85 to-[#0a0d14]/95" />
        </div>

        <PokemonProvider>
          <PlayerProfileProvider>
          <div className="flex flex-col md:flex-row w-full min-h-screen relative z-10">
            <Sidebar />
            <div className="flex-grow flex flex-col min-w-0">
              <main className="flex-grow flex flex-col pb-20 md:pb-0">
                {children}
              </main>
              <Footer />
            </div>
          </div>
          <CinematicOverlay />
          <PwaInstallBanner />
          </PlayerProfileProvider>
        </PokemonProvider>
      </body>
    </html>
  );
}
