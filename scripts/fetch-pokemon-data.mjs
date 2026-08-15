import fs from 'fs';
import path from 'path';

const CACHE_DIR = './scripts/cache';
const OUTPUT_FILE = './public/data/pokemon_index.json';

// Ensure directories exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Special Category ID Lists
const STARTERS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, // Gen 1
  152, 153, 154, 155, 156, 157, 158, 159, 160, // Gen 2
  252, 253, 254, 255, 256, 257, 258, 259, 260, // Gen 3
  387, 388, 389, 390, 391, 392, 393, 394, 395, // Gen 4
  495, 496, 497, 498, 499, 500, 501, 502, 503, // Gen 5
  650, 651, 652, 653, 654, 655, 656, 657, 658, // Gen 6
  722, 723, 724, 725, 726, 727, 728, 729, 730, // Gen 7
  810, 811, 812, 813, 814, 815, 816, 817, 818, // Gen 8
  906, 907, 908, 909, 910, 911, 912, 913, 914  // Gen 9
]);

const ULTRA_BEASTS = new Set([
  793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806
]);

const PARADOX = new Set([
  984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995,
  1005, 1006, 1009, 1010, 1020, 1021, 1022, 1023
]);

const PSEUDO_LEGENDARIES = new Set([
  147, 148, 149, // Dragonite line
  246, 247, 248, // Tyranitar line
  371, 372, 373, // Salamence line
  374, 375, 376, // Metagross line
  443, 444, 445, // Garchomp line
  633, 634, 635, // Hydreigon line
  704, 705, 706, // Goodra line
  782, 783, 784, // Kommo-o line
  885, 886, 887, // Dragapult line
  996, 997, 998  // Baxcalibur line
]);

const FOSSILS = new Set([
  138, 139, 140, 141, 142, // Gen 1
  345, 346, 347, 348,       // Gen 3
  408, 409, 410, 411,       // Gen 4
  564, 565, 566, 567,       // Gen 5
  696, 697, 698, 699,       // Gen 6
  880, 881, 882, 883        // Gen 8
]);

// Helper to partition arrays for concurrent mapping
async function mapConcurrent(array, limit, fn) {
  const results = [];
  const executing = new Set();
  for (const item of array) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// Cached fetch utility
async function fetchCached(url, cacheKey) {
  const filePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      // ignore parse errors and refetch
    }
  }

  // Polite delay to avoid hammering PokéAPI
  await new Promise(resolve => setTimeout(resolve, 30));

  console.log(`Fetching from PokéAPI: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const data = await res.json();
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  return data;
}

// Traverse evolution chain and build maps
function traverseChain(node, chainId, canEvolveMap, isFullyEvolvedMap) {
  if (!node) return;
  const speciesName = node.species.name;
  const evolvesTo = node.evolves_to;

  if (evolvesTo && evolvesTo.length > 0) {
    canEvolveMap.set(speciesName, true);
    isFullyEvolvedMap.set(speciesName, false);
    for (const subNode of evolvesTo) {
      traverseChain(subNode, chainId, canEvolveMap, isFullyEvolvedMap);
    }
  } else {
    canEvolveMap.set(speciesName, false);
    isFullyEvolvedMap.set(speciesName, true);
  }
}

// Format Name beautifully (e.g. "pikachu" -> "Pikachu", "mr-mime" -> "Mr. Mime")
function formatName(name) {
  if (!name) return '';
  return name
    .split('-')
    .map(word => {
      if (word === 'mr') return 'Mr.';
      if (word === 'jr') return 'Jr.';
      if (word === 'm') return '♂';
      if (word === 'f') return '♀';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Detect regional forms and extract type
function getRegionalDetails(varietyName) {
  if (varietyName.includes('-alola')) {
    return { isRegional: true, type: 'alolan', suffix: 'Alolan' };
  }
  if (varietyName.includes('-galar')) {
    return { isRegional: true, type: 'galarian', suffix: 'Galarian' };
  }
  if (varietyName.includes('-hisui')) {
    return { isRegional: true, type: 'hisuian', suffix: 'Hisuian' };
  }
  if (varietyName.includes('-paldea')) {
    return { isRegional: true, type: 'paldean', suffix: 'Paldean' };
  }
  return { isRegional: false };
}

async function run() {
  console.log('Starting Pokémon index generation...');
  const limit = 1025; // Bulbasaur to Pecharunt
  const indices = Array.from({ length: limit }, (_, i) => i + 1);

  // 1. Fetch all species & gather evolution chain URLs
  const speciesList = [];
  const evolutionChainUrls = new Set();

  console.log(`Fetching data for ${limit} Pokémon species...`);
  await mapConcurrent(indices, 20, async (id) => {
    try {
      const species = await fetchCached(
        `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
        `species_${id}`
      );
      speciesList.push(species);
      if (species.evolution_chain?.url) {
        evolutionChainUrls.add(species.evolution_chain.url);
      }
    } catch (err) {
      console.error(`Error fetching species ${id}:`, err.message);
    }
  });

  // 2. Fetch all unique evolution chains and compile maps
  console.log(`Fetching and processing ${evolutionChainUrls.size} evolution chains...`);
  const canEvolveMap = new Map();
  const isFullyEvolvedMap = new Map();

  const chainUrlsArray = Array.from(evolutionChainUrls);
  await mapConcurrent(chainUrlsArray, 20, async (url) => {
    try {
      const chainId = url.split('/').filter(Boolean).pop();
      const chainData = await fetchCached(url, `chain_${chainId}`);
      traverseChain(chainData.chain, chainId, canEvolveMap, isFullyEvolvedMap);
    } catch (err) {
      console.error(`Error fetching evolution chain:`, err.message);
    }
  });

  // 3. Process each species and their default & alternate variety forms
  const pokemonIndex = [];

  console.log('Processing species and matching varieties (Megas, Regionals, etc.)...');
  for (const species of speciesList) {
    const speciesId = species.id;
    const isLegendary = species.is_legendary || false;
    const isMythical = species.is_mythical || false;
    const isBaby = species.is_baby || false;
    const isStarter = STARTERS.has(speciesId);
    const isUltraBeast = ULTRA_BEASTS.has(speciesId);
    const isParadox = PARADOX.has(speciesId);
    const isPseudoLegendary = PSEUDO_LEGENDARIES.has(speciesId);
    const isFossil = FOSSILS.has(speciesId);

    // Get evolution details based on species name
    const canEvolve = canEvolveMap.get(species.name) ?? false;
    const isFullyEvolved = isFullyEvolvedMap.get(species.name) ?? true;
    const evolutionChainId = species.evolution_chain?.url
      ? parseInt(species.evolution_chain.url.split('/').filter(Boolean).pop(), 10)
      : undefined;

    // Determine Base Generation from species generation url
    // URL format: https://pokeapi.co/api/v2/generation/X/
    let generation = 1;
    if (species.generation?.url) {
      const genIdStr = species.generation.url.split('/').filter(Boolean).pop();
      generation = parseInt(genIdStr, 10) || 1;
    }

    // Process all varieties of this species
    for (const varietyInfo of species.varieties) {
      const varietyUrl = varietyInfo.pokemon.url;
      const varietyName = varietyInfo.pokemon.name;
      const varietyId = parseInt(varietyUrl.split('/').filter(Boolean).pop(), 10);
      const isDefault = varietyInfo.is_default;

      // Filter alternate forms: We only keep base form, megas, and regionals (Alola, Galar, Hisui, Paldea)
      const regionalDetails = getRegionalDetails(varietyName);
      const isMega = varietyName.includes('-mega');
      
      const shouldInclude = isDefault || isMega || regionalDetails.isRegional;
      if (!shouldInclude) continue;

      try {
        const pokemon = await fetchCached(
          `https://pokeapi.co/api/v2/pokemon/${varietyId}/`,
          `pokemon_${varietyId}`
        );

        // Map stats
        // stat indices: 0 = hp, 1 = attack, 2 = defense, 3 = special-attack, 4 = special-defense, 5 = speed
        const hp = pokemon.stats[0].base_stat;
        const atk = pokemon.stats[1].base_stat;
        const def = pokemon.stats[2].base_stat;
        const spAtk = pokemon.stats[3].base_stat;
        const spDef = pokemon.stats[4].base_stat;
        const spe = pokemon.stats[5].base_stat;
        const total = hp + atk + def + spAtk + spDef + spe;

        const types = pokemon.types.map(t => t.type.name);

        // Get front_default official artwork
        let sprite = pokemon.sprites.other?.['official-artwork']?.front_default;
        // Fallback to home artwork or normal sprite if official artwork is null
        if (!sprite) {
          sprite = pokemon.sprites.other?.home?.front_default || pokemon.sprites.front_default || '';
        }

        // Get front_shiny official artwork
        let shinySprite = pokemon.sprites.other?.['official-artwork']?.front_shiny;
        if (!shinySprite) {
          shinySprite = pokemon.sprites.other?.home?.front_shiny || pokemon.sprites.front_shiny || '';
        }

        // Beautiful formatted display name
        let displayName = formatName(species.name);
        if (isMega) {
          if (varietyName.includes('-mega-x')) displayName = `Mega ${displayName} X`;
          else if (varietyName.includes('-mega-y')) displayName = `Mega ${displayName} Y`;
          else displayName = `Mega ${displayName}`;
        } else if (regionalDetails.isRegional) {
          displayName = `${regionalDetails.suffix} ${displayName}`;
        }

        // Adjust generation of regional forms to match the generation they were introduced in
        let adjustedGeneration = generation;
        if (regionalDetails.isRegional) {
          if (regionalDetails.type === 'alolan') adjustedGeneration = 7;
          else if (regionalDetails.type === 'galarian') adjustedGeneration = 8;
          else if (regionalDetails.type === 'hisuian') adjustedGeneration = 8;
          else if (regionalDetails.type === 'paldean') adjustedGeneration = 9;
        } else if (isMega) {
          // Megas were introduced in Gen 6
          adjustedGeneration = 6;
        }

        pokemonIndex.push({
          id: varietyId,
          speciesId,
          name: varietyName,
          displayName,
          types,
          generation: adjustedGeneration,
          stats: { hp, atk, def, spAtk, spDef, spe, total },
          sprite,
          shinySprite,
          isLegendary,
          isMythical,
          isBaby,
          isStarter,
          isMega,
          isRegional: regionalDetails.isRegional || false,
          regionalType: regionalDetails.isRegional ? regionalDetails.type : undefined,
          isUltraBeast,
          isParadox,
          isPseudoLegendary,
          isFossil,
          canEvolve,
          isFullyEvolved,
          evolutionChainId
        });
      } catch (err) {
        console.error(`Error processing variety ${varietyName} (${varietyId}):`, err.message);
      }
    }
  }

  // Sort by id for clean index ordering
  pokemonIndex.sort((a, b) => a.id - b.id);

  console.log(`Writing ${pokemonIndex.length} Pokémon index records to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(pokemonIndex), 'utf-8');
  console.log('Pokémon index cache successfully generated!');
}

run().catch(console.error);
