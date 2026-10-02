# RogueDex - Project Handoff & Architecture Summary

This document serves as a comprehensive summary of the current state of RogueDex, its underlying architecture, and the roadmap for future development. Use this file as context for new agent sessions to seamlessly continue work on the project.

## 1. Project Overview & Philosophy
**RogueDex** is a high-fidelity, highly interactive Pokémon draft and utility application. 
- **Aesthetic Core**: "Dope," cinematic, and highly polished. We prioritize micro-animations, rich hover states, sound effects (`src/lib/audio.ts`), and premium visual feedback. 
- **Hard Constraint**: No matter how crazy the draft mode gets (e.g., Chaos mode, Heist), the resulting Pokémon must *always* be 100% legal and battle-ready (valid abilities, movesets, etc.) for Pokémon Showdown exports.

## 2. Tech Stack & Architecture
- **Framework**: Next.js 16 (App Router), React, TypeScript.
- **Styling**: Tailwind CSS, Framer Motion (for animations).
- **Multiplayer State**: **Supabase Realtime Channels** (recently migrated from PeerJS due to WebRTC/TURN server unreliability).
- **Audio**: Custom audio clips triggered on UI interactions (hover, select, lock-in, attacks).
- **Core State**: Managed via `DraftState` object synced across clients via Supabase broadcasts.

## 3. What We Have Built So Far

### A. The Draft Engine (`src/app/draft/page.tsx`)
A massive, real-time multiplayer drafting system where two players draft teams of 6 Pokémon.
It supports **13 distinct Game Modes**:
1. **Standard Draft**: Classic pick/pass.
2. **Wildcard Draft**: 3 cards per round, 1 is a hidden trap (grants a random fully evolved Pokémon).
3. **Chaos Draft**: Guaranteed game-changing random event on Round 3.
4. **Snake Draft**: Shared pool of 18 Pokémon, turn-based picking.
5. **Forced Monotype**: Entire draft pool restricted to a randomly chosen type.
6. **Blind Draft**: See only the Pokémon's color or abilities.
7. **Shadow Protocol**: See only obscure clues (weight, height, shape, habitat).
8. **The Heist**: 3 normal rounds, then players steal 1 Pokémon from each other.
9. **Simple Auction**: Start with $100, live bidding war.
10. **Speedrun**: 7 seconds per pick, auto-picks worst Pokémon if time runs out.
11. **Protect the King (VIP)**: Round 1 picks a VIP. All subsequent picks must share a type with the VIP.
12. **Salary Cap (Nomination)**: Take turns nominating Pokémon for bidding.
13. **Nuzlocke Draft**: Draft 6 Pokémon, then secretly assassinate 1 of your opponent's team while protecting 1 of your own.

### B. Multiplayer Connection Layer (Supabase)
- **Previous Issue**: PeerJS connections failed consistently due to strict firewalls and expired TURN credentials.
- **Current Solution**: Refactored the entire connection layer to use `supabase-js`. 
- **Flow**: Host creates a channel `draft:{ROOM_CODE}`. Guest joins the channel and sends `guest_action` broadcasts. Host processes the logic and broadcasts `sync_state` back to the guest.
- **Bug Fix**: Fixed a silent crash where the "Create Draft Room" button was unclickable if the Next.js dev server hadn't picked up the new `.env.local` Supabase credentials.

### C. Showdown Export & Smart EVs (`src/lib/showdown.ts`)
- Implemented competitive role-to-EV mapping.
- Automatically assigns optimal natures, items, and EVs based on the Pokémon's stats (e.g., Physical Sweeper, Special Wall).

### D. General Utilities
- Pokédex, Type Chart, IV Calculator, Natures, Breeding tools, etc.

## 4. Current Roadmap (Next Steps)

1. **Evolution Roulette (Draft Mode)**
   - *Concept*: Draft unevolved Pokémon, but they evolve into completely random species during the draft phase. Needs careful implementation to maintain the "legal Pokémon" constraint.
2. **Team Rocket (Reverse) Draft (Draft Mode)**
   - *Concept*: You draft a team of the worst possible Pokémon to give to your opponent, and vice versa. 
3. **Daily Pokedle Game**
   - *Concept*: A daily word-based guessing game (like Wordle but for Pokémon) to serve as a daily hook for users.
4. **General Polish & Bug Hunting**
   - Continuously monitor multiplayer edge cases (e.g., disconnects, race conditions in rapid bidding).
   - Ensure all edge-case Pokémon forms (Mega, Regional, Paradox) render their sprites and types correctly.

## 5. Important Context for the Next Agent
- All draft logic lives heavily inside `src/app/draft/page.tsx`. If modifying game states, ensure both `p1` and `p2` states are handled synchronously.
- When generating UI, remember the aesthetic constraints: use `lucide-react` icons, add glassmorphism/gradients, and always bind interaction sounds (e.g., `playHoverTick()`, `playSelectClick()`).
- Supabase credentials are in `.env.local` and also hardcoded as a fallback in `src/app/draft/page.tsx` to prevent startup crashes.
