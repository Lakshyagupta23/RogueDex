import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0b0e16",
};
import { Geist, Outfit, Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PokemonProvider } from "@/context/PokemonContext";
import { PlayerProfileProvider } from "@/context/PlayerProfileContext";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import CinematicOverlay from "@/components/CinematicOverlay";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import AmbientAura from "@/components/AmbientAura";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
      className={`${geistSans.variable} ${outfit.variable} ${rajdhani.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col antialiased relative overflow-x-hidden font-sans selection:bg-red-500/30 selection:text-red-200">
        <PokemonProvider>
          {/* Dynamic Type-Shifting Ambient Aura Atmosphere */}
          <AmbientAura />

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
