'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Sparkles, Smile, Trophy, HelpCircle, Heart, ChevronDown, Check } from 'lucide-react';
import { POKEMON_TYPES, TYPE_COLORS } from '@/lib/pokemon/constants';

// Data maps for thematic nicknames
const NICKNAMES_BY_TYPE: Record<string, Record<string, string[]>> = {
  fire: {
    funny: ['Spicy Nugget', 'Toasty', 'Microwave', 'Sriracha', 'Tabasco', 'Burnt Toast'],
    tough: ['Inferno', 'Ragnaros', 'Blaze', 'Volcano', 'Cinder', 'Ignis', 'Scorcher', 'Doom'],
    cute: ['Sparky', 'Cinder', 'Matchstick', 'Flamelet', 'Chili', 'Smore', 'Marshmallow'],
    meme: ['Hot Pocket', 'Overheated', 'Firewall', 'Salsa', 'Not Spicy', 'Calculated Burn'],
  },
  water: {
    funny: ['Soggy', 'H2O', 'Bathwater', 'Moist', 'Splasher', 'Damp', 'Plunge'],
    tough: ['Poseidon', 'Tsunami', 'Vortex', 'Hydro', 'Leviathan', 'Kraken', 'Torrent'],
    cute: ['Bubble', 'Drizzle', 'Splashy', 'Pebble', 'Dewdrop', 'Mochi', 'Pippin'],
    meme: ['Wet Dog', 'Dasani', 'Spitfire', 'Submarine', 'Hydrated', 'Dry Water'],
  },
  grass: {
    funny: ['Salad', 'Broccoli', 'Lawnmower', 'Weed', 'Cabbage', 'Celery', 'Vegetable'],
    tough: ['Yggdrasil', 'Forest', 'Groot', 'Thorn', 'Tundra', 'Timber', 'Overgrow'],
    cute: ['Sprout', 'Leafy', 'Bud', 'Clover', 'Fern', 'Seedling', 'Petal', 'Daisy'],
    meme: ['Grass Knuckles', 'Vegan', 'Outdoors', 'Compost', 'Photosynthesis', 'Green Screen'],
  },
  electric: {
    funny: ['AA Battery', 'Zapdog', 'Static', 'Outlet', 'Taser', 'Tesla', 'Unplugged'],
    tough: ['Thor', 'Zeus', 'Bolt', 'Volt', 'Thunder', 'Blitz', 'Dynamo', 'Shockwave'],
    cute: ['Sparky', 'Zippy', 'Watt', 'Voltlet', 'Pip', 'Pika', 'Jolt'],
    meme: ['Wifi Router', 'Lagging', 'Low Battery', 'Electricity Bill', 'Power Surge'],
  },
  normal: {
    funny: ['Default', 'Plain Jane', 'Wonderbread', 'Regular', 'Cardboard', 'Average Joe'],
    tough: ['Titan', 'Goliath', 'Rogue', 'Wrecker', 'Brawler', 'Sentry', 'Guard'],
    cute: ['Teddy', 'Cookie', 'Muffin', 'Butter', 'Cuddles', 'Biscuit', 'Sugar'],
    meme: ['Background NPC', 'Vanilla', 'Basic', 'File.txt', 'Localhost', 'Placeholder'],
  },
  ice: {
    funny: ['Fridge', 'Icebox', 'Brainfreeze', 'Slushie', 'Ice Cube', 'Melting'],
    tough: ['Glacier', 'Blizzard', 'Subzero', 'Avalanche', 'Frostbite', 'Tundra'],
    cute: ['Snowball', 'Frosty', 'Chilly', 'Shivers', 'Penguin', 'Igloo', 'Powder'],
    meme: ['Vanilla Ice', 'Dry Ice', 'Global Warming', 'No Heating', 'Freezer Burn'],
  },
  fighting: {
    funny: ['Punchbag', 'Slapstick', 'Knockout', 'Beefy', 'Chopstick', 'Flex'],
    tough: ['Rocky', 'Tyson', 'Champion', 'Striker', 'Brawler', 'Smasher', 'Gladiator'],
    cute: ['Champs', 'Bambi', 'Slugger', 'Punches', 'Buttons', 'Sparky'],
    meme: ['One Punch', 'Spaghetti Arms', 'Gym Bro', 'Skipped Leg Day', 'WWE', 'Self Defense'],
  },
  poison: {
    funny: ['Hazmat', 'Toxic Boy', 'Clorox', 'Bleach', 'Shroom', 'Puke'],
    tough: ['Viper', 'Venom', 'Hazard', 'Toxin', 'Plague', 'Arsenic', 'Cobra'],
    cute: ['Slick', 'Gloop', 'Pip', 'Berry', 'Ivy', 'Bubbles', 'Gooey'],
    meme: ['League Player', 'Toxic Chat', 'Warning Sign', 'Radioactive', 'Spill'],
  },
  ground: {
    funny: ['Muddy', 'Dirtbag', 'Potato', 'Sandcastle', 'Dusty', 'Landslide'],
    tough: ['Gravel', 'Tectonic', 'Earthquake', 'Clay', 'Buster', 'Terra', 'Tombstone'],
    cute: ['Diggy', 'Pebble', 'Sandy', 'Mole', 'Digger', 'Claylet'],
    meme: ['Floor is Lava', 'Subterranean', 'Buried', 'Underground', 'Real Estate'],
  },
  flying: {
    funny: ['Airmail', 'Feathers', 'Pigeon', 'Windmill', 'Frequent Flyer', 'Boeing'],
    tough: ['Zephyr', 'Aero', 'Jet', 'Falcon', 'Tornado', 'Gale', 'Vulture'],
    cute: ['Flappy', 'Chirp', 'Sky', 'Feather', 'Breeze', 'Pip', 'Cloudy'],
    meme: ['Drone', 'UFO', 'Air Conditioning', 'No Gravity', 'Free Falling'],
  },
  psychic: {
    funny: ['Big Brain', 'Mindreader', 'Spoiler', 'Brainstorm', 'Psychological'],
    tough: ['Oracle', 'Nebula', 'Genesis', 'Zenith', 'Matrix', 'Psi', 'Telepath'],
    cute: ['Cosmo', 'Wish', 'Pip', 'Sparky', 'Luna', 'Astrid', 'Nova'],
    meme: ['4D Chess', 'Big Brain Time', 'ESP', 'Calculated', 'Mind Control'],
  },
  bug: {
    funny: ['Cockroach', 'Glitch', 'Software Error', 'Pest', 'Termite', 'Buggy'],
    tough: ['Scythe', 'Web', 'Stinger', 'Titan', 'Carapace', 'Hornet', 'Venom'],
    cute: ['Caterpie', 'Ladybug', 'Flutter', 'Dot', 'Pip', 'Honey', 'Grub'],
    meme: ['Debugged', 'Feature Not Bug', 'Spider-Man', 'Flyswatter', 'Exterminator'],
  },
  rock: {
    funny: ['Stone Cold', 'Paperweight', 'Boulder', 'Sedimentary', 'Rockstar'],
    tough: ['Granite', 'Obsidian', 'Titan', 'Apex', 'Crusher', 'Geode', 'Monolith'],
    cute: ['Pebble', 'Rocky', 'Stonelet', 'Gravel', 'Chip', 'Nugget'],
    meme: ['The Rock', 'Hard Place', 'Stoned', 'Rolling Stone', 'Solid State'],
  },
  ghost: {
    funny: ['Bedsheet', 'Spooky', 'Phantom Tax', 'Jumpscare', 'Invisible', 'Boo'],
    tough: ['Spectre', 'Reaper', 'Shadow', ' Wraith', 'Phantasm', 'Hades', 'Necro'],
    cute: ['Spooklet', 'Casper', 'Wisp', 'Boo', 'Sprite', 'Shadowy', 'Shivers'],
    meme: ['Ghosted', 'Adblocker', 'Incognito Mode', 'Grave Mistake', 'Halloween'],
  },
  dragon: {
    funny: ['Lizard', 'Draco Malfoy', 'Salamander', 'Firebreather', 'Wings'],
    tough: ['Bahamut', 'Shenron', 'Wyvern', 'Tiamat', 'Draconic', 'Ryu', 'Apex'],
    cute: ['Pip', 'Dino', 'Sparky', 'Drake', 'Baby Draco', 'Noodle'],
    meme: ['Dragonite.png', 'Dracarys', 'Scale Model', 'Overpowered', 'Rawr'],
  },
  dark: {
    funny: ['Edgelord', 'Goth', 'Shadow the Hedgehog', 'Blackout', 'Night Light'],
    tough: ['Vader', 'Sauron', 'Rogue', 'Eclipse', 'Nocturne', 'Abyss', 'Grimm'],
    cute: ['Shadow', 'Midnight', 'Luna', 'Batty', 'Chocolat', 'Blackie'],
    meme: ['Incognito', 'Dark Mode Only', 'Edgy', 'Emo Phase', 'Underworld'],
  },
  steel: {
    funny: ['Tin Can', 'Screwdriver', 'Frying Pan', 'Wrench', 'Stainless', 'Toaster'],
    tough: ['Ironclad', 'Titan', 'Anvil', 'Chrome', 'Sabre', 'Shield', 'Mercury'],
    cute: ['Rust-eze', 'Rusty', 'Screws', 'Buttons', 'Metallet', 'Penny'],
    meme: ['Windows XP', 'Robot', 'Heavy Metal', 'Iron Deficient', 'Steel Beam'],
  },
  fairy: {
    funny: ['Glitter Bomb', 'Teacup', 'Pixie Dust', 'Fabulous', 'Toothfairy'],
    tough: ['Aura', 'Genesis', 'Valkyrie', 'Eclipse', 'Majesty', 'Siren'],
    cute: ['Mochi', 'Angel', 'Cupcake', 'Pixie', 'Sweetie', 'Peaches', 'Bella'],
    meme: ['Sparkle Spray', 'Cotton Candy', 'Magical Girl', 'Sugar Rush', 'Fairy Bread'],
  },
};

const THEMES = [
  { value: 'funny', label: 'Funny & Goofy', icon: Smile },
  { value: 'tough', label: 'Tough & Badass', icon: Trophy },
  { value: 'cute', label: 'Cute & Wholesome', icon: Heart },
  { value: 'meme', label: 'Meme & Gaming', icon: Sparkles },
];

export default function NicknamesPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('fire');
  const [selectedTheme, setSelectedTheme] = useState<string>('funny');
  const [generated, setGenerated] = useState<string[]>([]);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleGenerate = () => {
    const list = NICKNAMES_BY_TYPE[selectedType]?.[selectedTheme] || ['Sparky', 'Buddy', 'Champs'];
    // Shuffle and pick 5
    const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 5);
    setGenerated(shuffled);
  };

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      
      {/* Back button */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold bg-[#111622] hover:bg-[#181e2b] px-4 py-2 border border-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <span className="text-xs font-bold text-slate-550 flex items-center gap-1.5 uppercase">
          <Sparkles className="w-4 h-4 text-blue-500" />
          The Nicknames Generator
        </span>
      </div>

      <div className="text-center md:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          Nicknames <span className="text-blue-500">Generator</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Get the perfect nickname for your drafted squad members. Select their type and choice of personality!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-2">
        
        {/* Settings Side */}
        <div className="md:col-span-1 glass-panel border-slate-850 p-5 rounded-2xl flex flex-col gap-5">
          
          {/* Type Select */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Primary Type</label>
            <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto pr-1">
              {POKEMON_TYPES.map(type => {
                const color = TYPE_COLORS[type] || '#fff';
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      backgroundColor: isSelected ? `${color}15` : '#0b0e16',
                      borderColor: isSelected ? color : 'transparent',
                      color: isSelected ? color : '#9CA3AF',
                    }}
                    className="py-2 px-2 rounded-lg text-[9px] uppercase font-bold border text-center transition-all hover:bg-slate-900"
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme select */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Personality / Theme</label>
            <div className="flex flex-col gap-1.5">
              {THEMES.map(theme => {
                const Icon = theme.icon;
                const isSelected = selectedTheme === theme.value;
                return (
                  <button
                    key={theme.value}
                    onClick={() => setSelectedTheme(theme.value)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                        : 'bg-[#0b0e16] border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-blue-500" />
                    {theme.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action trigger */}
          <button
            onClick={handleGenerate}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider"
          >
            Generate Names
          </button>

        </div>

        {/* Results Panel */}
        <div className="md:col-span-2 flex flex-col gap-4">
          
          {generated.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Suggested Nicknames</h3>
              <div className="flex flex-col gap-2.5">
                {generated.map((name, idx) => (
                  <div
                    key={idx}
                    className="glass-panel border-slate-850 p-4 rounded-xl flex items-center justify-between hover:border-slate-800 transition-colors animate-fade-in"
                  >
                    <span className="font-extrabold text-slate-200 text-sm tracking-tight">{name}</span>
                    <button
                      onClick={() => handleCopy(name)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        copiedName === name
                          ? 'bg-green-500/10 border-green-500/25 text-green-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                      }`}
                    >
                      {copiedName === name ? <Check className="w-3.5 h-3.5 inline mr-1" /> : ''}
                      {copiedName === name ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel border-slate-900 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <Smile className="w-10 h-10 text-slate-800 animate-bounce" />
              <div>
                <h3 className="font-bold text-slate-350 text-sm uppercase">Generate suggestions</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Choose a type and a personality theme, then click "Generate Names" to view suggestions.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
