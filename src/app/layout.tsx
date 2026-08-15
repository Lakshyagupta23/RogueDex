import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PokemonProvider } from "@/context/PokemonContext";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

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
        {/* Themed Background Overlay */}
        <div 
          className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none"
          style={{ backgroundImage: "url('/images/bg.jpg')" }}
        />
        <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950 pointer-events-none" />

        <PokemonProvider>
          <div className="flex flex-col md:flex-row w-full min-h-screen relative z-10">
            <Sidebar />
            <div className="flex-grow flex flex-col min-w-0">
              <main className="flex-grow flex flex-col">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </PokemonProvider>
      </body>
    </html>
  );
}
