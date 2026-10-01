import { PokemonIndexItem } from './types';
import { generateShowdownExport } from '@/lib/showdown';

// Fetch and generate Showdown export text for a team using official Gen 9 Random Battle sets
export async function generateShowdownTeam(team: PokemonIndexItem[]): Promise<string> {
  try {
    return await generateShowdownExport(team.map(pk => pk.displayName));
  } catch (err) {
    console.error('Failed to generate showdown sets:', err);
    throw err;
  }
}
