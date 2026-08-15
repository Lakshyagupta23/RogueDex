import { PokemonDetails, PokemonIndexItem, EvolutionNode } from './types';

// Helper to format text (remove newlines/strange characters from flavor text)
function formatFlavorText(text: string): string {
  return text
    .replace(/\f/g, '\n')
    .replace(/\u00ad/g, '')
    .replace(/\u00ad\n/g, '')
    .replace(/\n /g, ' ')
    .replace(/ \n/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

// Format Name beautifully (e.g. "pikachu" -> "Pikachu")
function formatName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Parse evolution chain node recursively
async function parseEvolutionChain(
  node: any,
  speciesToVarietyMap: Record<string, PokemonIndexItem>
): Promise<EvolutionNode[]> {
  const result: EvolutionNode[] = [];
  if (!node) return result;

  const speciesName = node.species.name;
  
  // Find in our index to get types/sprite/displayName/id
  const indexedPk = speciesToVarietyMap[speciesName];

  // If found, construct node details
  if (indexedPk) {
    let minLevel: number | undefined;
    let trigger = '';
    let item = '';

    const details = node.evolution_details?.[0];
    if (details) {
      minLevel = details.min_level ?? undefined;
      trigger = details.trigger?.name ? formatName(details.trigger.name) : '';
      item = details.item?.name ? formatName(details.item.name) : '';
    }

    result.push({
      speciesId: indexedPk.speciesId,
      name: indexedPk.name,
      displayName: indexedPk.displayName,
      sprite: indexedPk.sprite,
      types: indexedPk.types,
      minLevel,
      trigger,
      item,
    });
  }

  // Parse next evolutions in parallel
  if (node.evolves_to && node.evolves_to.length > 0) {
    const nextNodes = await Promise.all(
      node.evolves_to.map((subNode: any) => parseEvolutionChain(subNode, speciesToVarietyMap))
    );
    result.push(...nextNodes.flat());
  }

  return result;
}

// Fetch details for a specific Pokémon on-demand
export async function fetchPokemonDetails(
  pkIndexItem: PokemonIndexItem,
  fullIndex: PokemonIndexItem[]
): Promise<PokemonDetails> {
  // Check client-side localStorage cache first to optimize repeat lookups
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`roguedex_details_${pkIndexItem.id}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore parse error
      }
    }
  }

  // Construct a species-name-to-default-variety map from our index to speed up evolution parsing
  const speciesToVarietyMap: Record<string, PokemonIndexItem> = {};
  for (const item of fullIndex) {
    // Prefer default forms in evolution chains, otherwise any variety
    if (!speciesToVarietyMap[item.name] || (!item.isMega && !item.isRegional)) {
      speciesToVarietyMap[item.name] = item;
    }
    // Also map by species ID name
    const baseName = item.name.split('-')[0];
    if (!speciesToVarietyMap[baseName]) {
      speciesToVarietyMap[baseName] = item;
    }
  }

  // 1. Fetch Pokémon general info
  const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pkIndexItem.id}/`, {
    next: { revalidate: 86400 }, // Cache for 24 hours in Next.js
  });
  if (!pokemonRes.ok) {
    throw new Error(`Failed to fetch basic details for ${pkIndexItem.displayName}`);
  }
  const pokemonData = await pokemonRes.json();

  // 2. Fetch species details
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pkIndexItem.speciesId}/`, {
    next: { revalidate: 86400 },
  });
  if (!speciesRes.ok) {
    throw new Error(`Failed to fetch species details for ${pkIndexItem.displayName}`);
  }
  const speciesData = await speciesRes.json();

  // Extract description (English flavor text)
  const englishFlavor = speciesData.flavor_text_entries.find(
    (entry: any) => entry.language.name === 'en'
  );
  const description = englishFlavor ? formatFlavorText(englishFlavor.flavor_text) : 'No description available.';

  // Extract abilities (detailed descriptions if needed)
  const abilities = pokemonData.abilities.map((abil: any) => ({
    name: formatName(abil.ability.name),
    isHidden: abil.is_hidden,
  }));

  // Fetch ability details for descriptions
  const abilitiesWithDesc = await Promise.all(
    pokemonData.abilities.slice(0, 3).map(async (abil: any) => {
      try {
        const res = await fetch(abil.ability.url, { next: { revalidate: 86400 } });
        if (res.ok) {
          const data = await res.json();
          const engEffect = data.effect_entries.find((entry: any) => entry.language.name === 'en');
          const shortEffect = engEffect ? engEffect.short_effect : '';
          return {
            name: formatName(abil.ability.name),
            isHidden: abil.is_hidden,
            description: shortEffect,
          };
        }
      } catch (e) {
        // ignore
      }
      return {
        name: formatName(abil.ability.name),
        isHidden: abil.is_hidden,
      };
    })
  );

  // 3. Fetch Evolution Chain
  let evolutionChain: EvolutionNode[] = [];
  if (speciesData.evolution_chain?.url) {
    try {
      const evoRes = await fetch(speciesData.evolution_chain.url, {
        next: { revalidate: 86400 },
      });
      if (evoRes.ok) {
        const evoData = await evoRes.json();
        evolutionChain = await parseEvolutionChain(evoData.chain, speciesToVarietyMap);
      }
    } catch (evoErr) {
      console.error('Error fetching evolution chain:', evoErr);
    }
  }

  // Parse Egg Groups
  const eggGroups = speciesData.egg_groups.map((group: any) => formatName(group.name));

  const resultDetails: PokemonDetails = {
    ...pkIndexItem,
    height: pokemonData.height,
    weight: pokemonData.weight,
    abilities: abilitiesWithDesc.length > 0 ? abilitiesWithDesc : abilities,
    eggGroups,
    catchRate: speciesData.capture_rate || 255,
    baseExperience: pokemonData.base_experience || 100,
    growthRate: speciesData.growth_rate?.name ? formatName(speciesData.growth_rate.name) : 'Medium Fast',
    description,
    evolutionChain,
  };

  // Cache in localStorage client side
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`roguedex_details_${pkIndexItem.id}`, JSON.stringify(resultDetails));
    } catch (e) {
      // ignore quota errors
    }
  }

  return resultDetails;
}
