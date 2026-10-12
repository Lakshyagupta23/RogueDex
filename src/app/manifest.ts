import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RogueDex - Pokemon Companion & Draft Arena',
    short_name: 'RogueDex',
    description: 'Competitive Pokemon Draft Arena, Team Builder, and Pokedex for Gen 1-9.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f19',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
    ],
    categories: ['games', 'entertainment', 'utilities'],
  };
}
