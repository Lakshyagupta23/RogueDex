import { PokemonIndexItem } from './types';

export interface FilterCriteria {
  generations?: number[];
  types?: string[];
  typeMatchMode?: 'primary' | 'secondary' | 'either';
  categories?: string[];
  formsMode?: 'all' | 'base_only' | 'mega_only' | 'regional_only';
  searchQuery?: string;
  minBst?: number;
  maxBst?: number;
  heightMax?: number; // Decimeters
  weightMin?: number; // Hectograms
  // Individual stat minimums
  minHp?: number;
  minAtk?: number;
  minDef?: number;
  minSpAtk?: number;
  minSpDef?: number;
  minSpe?: number;

  // EXCLUSIONS
  excludeLegendary?: boolean;
  excludeMythical?: boolean;
  excludeParadox?: boolean;
  excludeStarters?: boolean;
  excludeUltraBeast?: boolean;
  excludeAlolan?: boolean;
  excludeGalarian?: boolean;
  excludeHisuian?: boolean;
  excludePaldean?: boolean;
}

export function filterPokemon(pokemonList: PokemonIndexItem[], criteria: FilterCriteria): PokemonIndexItem[] {
  return pokemonList.filter(pk => {
    // 1. Generations filter
    if (criteria.generations && criteria.generations.length > 0) {
      if (!criteria.generations.includes(pk.generation)) return false;
    }

    // 2. Types filter
    if (criteria.types && criteria.types.length > 0) {
      const mode = criteria.typeMatchMode || 'either';
      const hasMatch = criteria.types.some(t => {
        if (mode === 'primary') return pk.types[0] === t;
        if (mode === 'secondary') return pk.types[1] === t;
        return pk.types.includes(t);
      });
      if (!hasMatch) return false;
    }

    // 3. Categories filter (Matches ANY active category selections)
    if (criteria.categories && criteria.categories.length > 0) {
      const matchesAny = criteria.categories.some(cat => {
        if (cat === 'starter' && pk.isStarter) return true;
        if (cat === 'legendary' && pk.isLegendary) return true;
        if (cat === 'mythical' && pk.isMythical) return true;
        if (cat === 'pseudo_legendary' && pk.isPseudoLegendary) return true;
        if (cat === 'ultra_beast' && pk.isUltraBeast) return true;
        if (cat === 'paradox' && pk.isParadox) return true;
        if (cat === 'can_evolve' && pk.canEvolve) return true;
        if (cat === 'fully_evolved' && pk.isFullyEvolved) return true;
        return false;
      });
      if (!matchesAny) return false;
    }

    // 3b. Exclusions Filter
    if (criteria.excludeLegendary && pk.isLegendary) return false;
    if (criteria.excludeMythical && pk.isMythical) return false;
    if (criteria.excludeParadox && pk.isParadox) return false;
    if (criteria.excludeStarters && pk.isStarter) return false;
    if (criteria.excludeUltraBeast && pk.isUltraBeast) return false;

    // 3c. Regional Exclusions
    if (criteria.excludeAlolan && pk.regionalType === 'alolan') return false;
    if (criteria.excludeGalarian && pk.regionalType === 'galarian') return false;
    if (criteria.excludeHisuian && pk.regionalType === 'hisuian') return false;
    if (criteria.excludePaldean && pk.regionalType === 'paldean') return false;

    // 4. Forms Mode filter
    if (criteria.formsMode) {
      if (criteria.formsMode === 'base_only' && (pk.isMega || pk.isRegional)) return false;
      if (criteria.formsMode === 'mega_only' && !pk.isMega) return false;
      if (criteria.formsMode === 'regional_only' && !pk.isRegional) return false;
    }

    // 5. Search Query
    if (criteria.searchQuery) {
      const q = criteria.searchQuery.toLowerCase().trim();
      const idMatch = !isNaN(Number(q)) && pk.id === Number(q);
      const nameMatch = pk.displayName.toLowerCase().includes(q) || pk.name.toLowerCase().includes(q);
      const typeMatch = pk.types.some(t => t.toLowerCase() === q);
      if (!idMatch && !nameMatch && !typeMatch) return false;
    }

    // 6. BST Limits
    if (criteria.minBst !== undefined && pk.stats.total < criteria.minBst) return false;
    if (criteria.maxBst !== undefined && pk.stats.total > criteria.maxBst) return false;

    // 7. Individual Stat Minimums
    if (criteria.minHp !== undefined && pk.stats.hp < criteria.minHp) return false;
    if (criteria.minAtk !== undefined && pk.stats.atk < criteria.minAtk) return false;
    if (criteria.minDef !== undefined && pk.stats.def < criteria.minDef) return false;
    if (criteria.minSpAtk !== undefined && pk.stats.spAtk < criteria.minSpAtk) return false;
    if (criteria.minSpDef !== undefined && pk.stats.spDef < criteria.minSpDef) return false;
    if (criteria.minSpe !== undefined && pk.stats.spe < criteria.minSpe) return false;

    return true;
  });
}

export function getRandomPokemon(pokemonList: PokemonIndexItem[], criteria: FilterCriteria): PokemonIndexItem | null {
  const filtered = filterPokemon(pokemonList, criteria);
  if (filtered.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

export function getRandomTeam(
  pokemonList: PokemonIndexItem[],
  size: number,
  criteria: FilterCriteria,
  allowDuplicates = false
): PokemonIndexItem[] {
  const filtered = filterPokemon(pokemonList, criteria);
  if (filtered.length === 0) return [];

  const team: PokemonIndexItem[] = [];
  const selectedSpeciesIds = new Set<number>();

  const uniqueOnly = !allowDuplicates && filtered.length >= size;

  for (let i = 0; i < size; i++) {
    let candidates = filtered;
    if (uniqueOnly) {
      candidates = filtered.filter(pk => !selectedSpeciesIds.add ? false : !selectedSpeciesIds.has(pk.speciesId));
    }

    if (candidates.length === 0) {
      // Fallback if unique candidates run out
      candidates = filtered;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const chosen = candidates[randomIndex];
    team.push(chosen);
    selectedSpeciesIds.add(chosen.speciesId);
  }

  return team;
}
