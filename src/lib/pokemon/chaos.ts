import { PokemonIndexItem, DraftState } from './types';

export const CHAOS_EVENTS = [
  { id: 'rocket', title: '🚀 Team Rocket Invasion', description: 'Your strongest Pokémon was stolen and swapped with your opponent!', requiresChoice: false },
  { id: 'safari', title: '🏃 Safari Zone Escape', description: 'The draft pool fled! All filters are disabled for this round.', requiresChoice: false },
  { id: 'ditto', title: '🧬 Ditto\'s Illusion', description: 'The board glitches... All options this round are Dittos!', requiresChoice: false },
  { id: 'fossil', title: '🦖 Fossil Revival', description: 'A Fossil was revived! Swap it with a current team member, or pass.', requiresChoice: true },
  { id: 'celebi', title: '🌀 Celebi\'s Time Warp', description: 'Time distorts! Your entire team has been swapped with your opponent!', requiresChoice: false },
  { id: 'yveltal', title: '💀 Yveltal\'s Curse', description: 'Your strongest Pokémon fainted! It was replaced by a random fully evolved Pokémon.', requiresChoice: false },
  { id: 'wonder', title: '🎁 Forced Wonder Trade', description: 'Pick 1 Pokémon from your team to Wonder Trade for a random fully evolved Pokémon!', requiresChoice: true },
  { id: 'gym', title: '🔒 Gym Leader\'s Curse', description: 'A Gym Leader locked the draft! Only one type of Pokémon will appear now.', requiresChoice: false },
  { id: 'glitch', title: '⚡ The Master Ball Glitch', description: 'A glitch in the Matrix! One of your Pokémon transformed into a Legendary!', requiresChoice: false },
  { id: 'gamble', title: '🎰 Double-or-Nothing', description: 'Keep your team, or gamble! Win = Steal a random Pokémon! Lose = Best Pokémon replaced!', requiresChoice: true }
];

export function getRandomFullyEvolved(list: PokemonIndexItem[]): PokemonIndexItem {
  const fe = list.filter(p => p.isFullyEvolved && p.id < 10000 && !p.isMega);
  return { ...fe[Math.floor(Math.random() * fe.length)] };
}

export function getRandomLegendary(list: PokemonIndexItem[]): PokemonIndexItem {
  const leg = list.filter(p => (p.isLegendary || p.isMythical || p.isUltraBeast) && !p.isMega && p.id < 10000);
  return { ...leg[Math.floor(Math.random() * leg.length)] };
}

export function getRandomFossil(list: PokemonIndexItem[]): PokemonIndexItem {
  const fossils = ['omastar', 'kabutops', 'aerodactyl', 'cradily', 'armaldo', 'rampardos', 'bastiodon', 'carracosta', 'archeops', 'tyrantrum', 'aurorus', 'dracozolt', 'arctozolt', 'dracovish', 'arctovish'];
  const f = list.filter(p => fossils.includes(p.name));
  return { ...f[Math.floor(Math.random() * f.length)] };
}
