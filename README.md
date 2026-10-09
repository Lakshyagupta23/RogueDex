# RogueDex

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-13.0-f08?style=flat&logo=framer)](https://www.framer.com/motion/)
[![Supabase Realtime](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![E2E Testing](https://img.shields.io/badge/Playwright-Tested-45ba4b?style=flat&logo=playwright)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

A high-fidelity, real-time multiplayer competitive Pokémon drafting and team analysis platform. **RogueDex** transforms casual Pokémon drafting into a tactical, high-octane esports arena featuring **13+ distinct game modes** (Auto-Chess ascension, auctions, chaos modifiers, heists, and Nuzlockes), synchronized peer-to-peer multiplayer lobbies, holographic tactile UI, and an algorithmic **Pokémon Showdown export engine** that guarantees 100% legal, competitively optimized builds.

---

## Table of Contents

- [Overview & Philosophy](#overview--philosophy)
- [Key Features](#key-features)
- [The Draft Arena: 13+ Game Modes](#the-draft-arena-13-game-modes)
- [Real-Time Multiplayer Architecture](#real-time-multiplayer-architecture)
- [Competitive Showdown Engine & Smart EV Optimizer](#competitive-showdown-engine--smart-ev-optimizer)
- [Tactical Utility Suite](#tactical-utility-suite)
- [Sensory Engineering & Aesthetic Craft](#sensory-engineering--aesthetic-craft)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Development Server](#running-the-development-server)
  - [Production Build](#production-build)
- [Repository Architecture](#repository-architecture)
- [License](#license)

---

## Overview & Philosophy

Traditional Pokémon drafting tools are static tables or spreadsheets. **RogueDex** reimagines the experience as an immersive, broadcast-quality competitive suite designed around three core pillars:

1. **Cinematic Tactile Feedback:** Every card hover, lock-in, bid, and draft round is accompanied by physics-based 3D holographic tilt, dynamic particles, and synthesized Web Audio cues.
2. **Dynamic Strategic Depth:** Beyond basic snake drafts, trainers battle through 13+ tactical modes including Auto-Chess triplet merging, high-stakes auctions, blind drafting, and strategic assassination rounds.
3. **Showdown Battle-Ready Guarantees:** Regardless of the draft rules or chaos mutations applied, all exported teams are validated to be **100% legal for Pokémon Showdown**, complete with optimal competitive natures, battle items, and role-tailored EV spreads.

---

## Key Features

- **Real-Time Multiplayer Mesh:** Room code-based instant matchmaking powered by Supabase Realtime Channels with host-authoritative state synchronization.
- **13+ Specialized Draft Modes:** Ranging from classic draft formats to high-stakes rogue-lite variants.
- **Auto-Chess Triplet Merging:** Drafting 3 Pokémon of the same type automatically merges and ascends them into powerful Mega Evolutions or Legendaries, extending draft rounds dynamically.
- **Smart EV & Role Analyzer:** Automatically detects strategic team roles (Physical Sweeper, Special Wall, Bulky Pivot, Speed Cleaner) and assigns optimal EV distributions, battle items, and legal competitive movesets.
- **Competitive Tool Suite:** Interactive dual-type weakness matrix, IV/EV stat calculator with battle stage modifiers, nature compendium, breeding compatibility guide, and head-to-head Pokémon comparison tool.
- **Offline & Fallback Ready:** Includes a standalone Node.js WebSocket signaling server (`scripts/battle-server.mjs`) for isolated local tournaments without third-party cloud dependencies.
- **Zero-Compromise Performance:** Built on Next.js 16 with Turbopack, Tailwind CSS v4, and comprehensive Playwright end-to-end test coverage.

---

## The Draft Arena: 13+ Game Modes

RogueDex offers the most diverse array of Pokémon draft modes ever engineered:

| Game Mode | Mechanics & Ruleset | Strategic Focus |
| :--- | :--- | :--- |
| **Standard Draft** | Classic 6-round pick-and-pass drafting between two players. | Fundamental synergy and drafting counter-picks. |
| **Auto-Chess & Synergy** | Drafting 3 Pokémon sharing an elemental type triggers **Ascension**, merging them into a Mega Evolution or high-tier Legendary and extending total rounds. | Type clustering and unit compounding. |
| **The Heist** | 3 normal draft rounds, followed by an infiltration round where players secretly steal one Pokémon directly from their opponent's lineup. | Drafting bait units vs. protecting core anchors. |
| **Simple Auction** | Both coaches start with a $100 budget. Players engage in real-time live bidding wars for each card on the block. | Budget economy and high-value resource rationing. |
| **Salary Cap (Nomination)** | Coaches take turns nominating Pokémon onto the auction block from a finite pool of funds. | Price inflation traps and late-round budget leverage. |
| **Chaos Draft** | Normal drafting with a guaranteed catastrophic or game-altering rule modifier triggered on Round 3. | Rapid adaptability to sudden rule mutations. |
| **Wildcard Draft** | 3 card choices per round, with 1 hidden mystery card containing a random fully-evolved apex threat. | Risk-reward gambling vs. stable picks. |
| **Snake Draft** | 18 Pokémon revealed in a shared pool; players draft in alternating sequence (1-2-2-1 order). | Predictive denial and blocking opponent synergies. |
| **Blind Draft** | Card artwork is silhouetted; players only see the Pokémon's primary color, generation, or passive abilities. | Deep Pokédex trivia knowledge and deduction. |
| **Shadow Protocol** | Strict biometric obfuscation: cards display only physical attributes (weight, height, body shape, habitat). | Physical data analysis and species identification. |
| **Protect the King (VIP)** | Round 1 selects the team's designated "King". All subsequent 5 draft picks must share at least one elemental type with the King. | Monotype archetype building and protecting VIP weaknesses. |
| **Forced Monotype** | The system locks the arena into a single randomly chosen type. Both players must construct teams entirely around that type. | Mirror-match mechanics and coverage move mastery. |
| **Speedrun** | High-pressure blitz clock (7 seconds per pick). If the timer expires, the system automatically drafts the lowest-stat available Pokémon. | Rapid intuition under extreme cognitive load. |
| **Nuzlocke Draft** | Draft 6 Pokémon normally, followed by a covert assassination phase: eliminate 1 opposing threat while shielding 1 of your own. | Threat assessment and mitigating key team counters. |

---

## Real-Time Multiplayer Architecture

```
 Trainer A (Host Client)                            Trainer B (Guest Client)
+-----------------------+                         +-------------------------+
| - Host Authority Engine|                         | - Guest Input Actions   |
| - Round State Machine |                         | - Local Optimistic UI   |
| - Timer & Bidding Sync |                         | - Audio SFX Trigger     |
+-----------+-----------+                         +------------+------------+
            |                                                  |
            | Broadcasts `sync_state`                          | Broadcasts `guest_action`
            v                                                  v
    +------------------------------------------------------------------+
    |                    Supabase Realtime Channel                     |
    |                   Channel Topic: `draft:{CODE}`                  |
    |               (Low-latency WebSockets broadcast mesh)            |
    +------------------------------------------------------------------+
```

### Protocol & State Machine:
1. **Lobby Handshake:** Host generates a unique 6-character room code. Guest joins the channel via the Supabase broadcast bus.
2. **Deterministic State Synchronization:** The Host client maintains the authoritative `DraftState` tree and broadcasts state diffs (`sync_state`) upon every turn transition, bid increment, or lock-in.
3. **Optimistic Audio & Haptic Feedback:** Guest actions (`guest_action`) trigger instant local audio ticks before network confirmation, maintaining a zero-latency tactile feel.
4. **Local Fallback Signaling:** For environments without cloud connectivity, a dedicated WebSocket signaling server (`scripts/battle-server.mjs`) provides standard WebSocket transport on port `5001`.

---

## Competitive Showdown Engine & Smart EV Optimizer

Drafted teams are seamlessly exported for instant competitive play on **Pokémon Showdown** via `src/lib/showdown.ts`.

### Automated Role Classification:
The engine analyzes base stats, typing, and movesets to dynamically categorize each drafted Pokémon into an optimal competitive archetype:
- **Physical Sweeper:** High Attack & Speed $\rightarrow$ Max 252 Atk / 252 Spe / 4 HP, Jolly/Adamant nature, Life Orb or Choice Band.
- **Special Sweeper:** High Sp. Atk & Speed $\rightarrow$ Max 252 SpA / 252 Spe / 4 HP, Timid/Modest nature, Choice Specs or Life Orb.
- **Physical Wall:** High HP & Defense $\rightarrow$ 252 HP / 252 Def / 4 SpD, Impish/Bold nature, Leftovers or Rocky Helmet.
- **Special Wall:** High HP & Sp. Def $\rightarrow$ 252 HP / 252 SpD / 4 Def, Calm/Careful nature, Leftovers or Heavy-Duty Boots.
- **Bulky Pivot / Hazard Setter:** Balanced defenses $\rightarrow$ Optimized bulk distribution, defensive utility moves (Stealth Rock, Toxic, Will-O-Wisp).

### One-Click Showdown Export:
```text
Dragapult @ Choice Specs
Ability: Infiltrator
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Shadow Ball
- Draco Meteor
- Flamethrower
- U-turn

Corviknight @ Leftovers
Ability: Pressure
EVs: 252 HP / 252 Def / 4 SpD
Impish Nature
- Roost
- Defog
- Brave Bird
- U-turn
```

---

## Tactical Utility Suite

Beyond drafting, RogueDex houses an integrated suite of competitive preparation utilities:

- **Interactive Type Chart (`/tools/type-chart`):** Comprehensive 18x18 offensive and defensive multiplier matrix supporting dual-type permutations, showing 4x quad-weaknesses and immunities.
- **IV / EV Stat Calculator (`/tools/iv-calculator`):** Full Generation 9 formula implementation computing exact stats at level 50 or 100, including nature multipliers (+10% / -10%) and in-battle stat stage stages (-6 to +6).
- **Nature Matrix (`/tools/natures`):** Interactive matrix categorizing all 25 natures by boosted and hindered attributes.
- **Breeding & Egg Group Companion (`/tools/breeding`):** Cross-references species egg groups, egg move inheritance pathways, and gender ratios.
- **Pokémon Comparison Radar (`/tools/compare`):** Side-by-side radar charts visualizing base stat differentials, speed tiers, and dual matchup projections.
- **"Who's That Pokémon?" Minigame (`/games/whos-that-pokemon`):** Interactive silhouette trivia game testing Pokédex mastery with custom score streaks and timers.

---

## Sensory Engineering & Aesthetic Craft

- **Web Audio API Sound Engine (`src/lib/audio.ts`):** Synthesizes procedural micro-sounds (card hover ticks, lock-in chords, timer warnings, and victory fanfares) using oscillator nodes without depending on external asset files.
- **Holographic Card Shaders (`HoloCard.tsx`):** Mouse position-aware 3D card tilt with specular glare, foil rainbow gradients, and smooth spring physics via Framer Motion.
- **Cinematic Overlays (`CinematicOverlay.tsx`):** Ambient background particles, arena transitions, and confetti celebrations upon completing a successful draft.

---

## Testing & Quality Assurance

RogueDex maintains rigorous quality assurance across both unit logic and end-to-end player journeys.

### Automated Unit Tests
Validates Auto-Chess triplet merging, dynamic round extension, and synergy mechanics:
```bash
node tests/test-autochess-synergy.js
```

### End-to-End Testing (Playwright)
Validates real-time multiplayer draft flows, card selection, and Showdown export generation:
```bash
npx playwright test
```

Test specifications include:
- `tests/e2e-standard.spec.js`: Complete 6-round standard draft flow.
- `tests/e2e-autochess-synergy.spec.js`: Automated verification of ascension transformations.
- `tests/e2e.spec.js`: Core navigation, Pokédex search, and utility calculations.

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm** or **pnpm** package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lakshyagupta23/RogueDex.git
   cd RogueDex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env.local` file in the root directory (optional for offline mode; required for cloud multiplayer):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
*(Note: A development fallback is included in the draft client so local lobbies work out of the box.)*

### Running the Development Server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start exploring and drafting.

### Production Build

```bash
npm run build
npm run start
```

---

## Repository Architecture

```
RogueDex/
├── public/
│   ├── arenas/               # Atmospheric battlefield background artwork
│   ├── data/                 # Comprehensive static Pokédex dataset (Gen 1-9)
│   └── icons/                # High-resolution type and navigation icons
├── scripts/
│   ├── battle-server.mjs     # Standalone WebSocket signaling server fallback
│   └── fetch-pokemon-data.mjs# Pokédex ingestion and enrichment pipeline
├── src/
│   ├── app/                  # Next.js 16 App Router pages
│   │   ├── draft/            # Multiplayer Draft Arena core page
│   │   ├── pokemon/          # Pokédex explorer & detail pages
│   │   ├── tools/            # Type chart, IV calc, natures, breeding tools
│   │   └── games/            # Who's That Pokémon interactive game
│   ├── components/           # Reusable UI components
│   │   ├── battle/           # Draft screen, chat box, auction controls
│   │   ├── HoloCard.tsx      # 3D interactive holographic card component
│   │   ├── SynergyHUD.tsx    # Live draft synergy & type counter HUD
│   │   └── SearchBar.tsx     # Instant debounced search bar
│   ├── context/              # React Context state providers
│   │   ├── BattleContext.tsx # Multiplayer session & lobby context
│   │   └── PokemonContext.tsx# Pokédex data cache provider
│   └── lib/                  # Core algorithms and utilities
│       ├── audio.ts          # Web Audio API procedural sound synthesizer
│       ├── showdown.ts       # Legal competitive Showdown export generator
│       └── pokemon/          # Stat calculations, chaos rules, synergy logic
├── tests/                    # Playwright E2E and unit test suites
│   ├── test-autochess-synergy.js
│   ├── e2e-standard.spec.js
│   └── e2e-autochess-synergy.spec.js
├── package.json              # Project dependencies and run scripts
├── playwright.config.js      # E2E test runner configuration
└── tsconfig.json             # TypeScript compiler options
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc., and Game Freak.
