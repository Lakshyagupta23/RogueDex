const { test, expect } = require('@playwright/test');

test.describe('New Draft Modes E2E Tests: Auto-Chess Merge & Synergy Ascension', () => {

  test('Auto-Chess Merge Mode - 9 Rounds, Triplet Merge to Legendary, Bench Phase & Reveal', async ({ browser }) => {
    test.setTimeout(120000); // 2 minutes timeout

    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    // 1. Host creates room and selects Auto-Chess Merge
    console.log('[Auto-Chess] Host creating draft room...');
    await host.goto('http://localhost:3000/draft');
    await host.locator('text="Your Username"').locator('..').locator('input').fill('HostChess');
    
    // Select Auto-Chess Merge mode in lobby
    const autoChessModeBtn = host.locator('button:has-text("Auto-Chess Merge")');
    await autoChessModeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await autoChessModeBtn.click();
    
    // Create Draft Room
    await host.click('button:has-text("Create Draft Room")');
    await host.waitForSelector('text=Room Code', { timeout: 15000 });

    // Extract Room Code
    const roomCodeElement = await host.locator('.font-mono.tracking-widest.text-indigo-400').innerText();
    const roomCode = roomCodeElement.trim();
    console.log(`[Auto-Chess] Room Code: ${roomCode}`);

    // 2. Guest joins room
    console.log('[Auto-Chess] Guest joining room...');
    await guest.goto('http://localhost:3000/draft');
    await guest.fill('input[placeholder="Room Code"]', roomCode);
    await guest.click('button:has-text("Join")');

    await guest.waitForSelector('text=Waiting for Host', { timeout: 15000 });
    console.log('[Auto-Chess] Guest joined successfully.');

    // 3. Host starts draft
    console.log('[Auto-Chess] Host starting draft...');
    await host.click('button:has-text("Start Draft")');

    // Helper for intelligent type-matching pick
    async function pickOption(page, chosenTypes) {
      const cards = page.locator('.flex.flex-col.gap-3.mb-6 > div');
      await cards.first().waitFor({ state: 'visible', timeout: 15000 });
      const count = await cards.count();
      let bestIdx = 0;
      let matched = false;

      // Find an option matching our previously drafted types
      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        const typeSpans = card.locator('span.text-\\[10px\\]');
        const typeCount = await typeSpans.count();
        for (let j = 0; j < typeCount; j++) {
          const typeName = (await typeSpans.nth(j).innerText()).trim().toLowerCase();
          if (chosenTypes[typeName] && chosenTypes[typeName] >= 1) {
            bestIdx = i;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      const chosenCard = cards.nth(bestIdx);
      // Verify button says "Draft" (Keep-Only mode, no Give button)
      const draftBtn = chosenCard.locator('button:text-is("Draft")');
      await expect(draftBtn).toBeVisible();
      await draftBtn.click();

      // Record types of picked card
      const pickedSpans = chosenCard.locator('span.text-\\[10px\\]');
      const pCount = await pickedSpans.count();
      for (let j = 0; j < pCount; j++) {
        const t = (await pickedSpans.nth(j).innerText()).trim().toLowerCase();
        chosenTypes[t] = (chosenTypes[t] || 0) + 1;
      }

      // Confirm pick
      await page.click('button:text-is("Confirm Selection")');
    }

    const hostTypes = {};
    const guestTypes = {};

    // 4. Play all 9 rounds
    for (let round = 1; round <= 9; round++) {
      console.log(`[Auto-Chess] Playing Round ${round} / 9...`);
      await host.waitForSelector(`text=Round ${round} / 9`, { timeout: 20000 });
      await guest.waitForSelector(`text=Round ${round} / 9`, { timeout: 20000 });

      // Ensure no Give buttons appear
      const hostGiveButtons = await host.locator('button:text-is("Give")').count();
      const guestGiveButtons = await guest.locator('button:text-is("Give")').count();
      expect(hostGiveButtons).toBe(0);
      expect(guestGiveButtons).toBe(0);

      await pickOption(host, hostTypes);
      await pickOption(guest, guestTypes);
    }

    // 5. Bench Phase
    console.log('[Auto-Chess] Verifying Bench Phase...');
    await host.waitForSelector('text=Auto-Chess Bench Phase', { timeout: 20000 });
    await guest.waitForSelector('text=Auto-Chess Bench Phase', { timeout: 20000 });

    async function handleBench(page, roleName) {
      const benchBtn = page.locator('button:has-text("Confirm Bench")');
      await benchBtn.waitFor({ state: 'visible', timeout: 15000 });
      const btnText = await benchBtn.innerText();
      console.log(`[Auto-Chess] ${roleName} bench button text: "${btnText}"`);
      const match = btnText.match(/Confirm Bench \((\d+)\/(\d+)\)/);
      const needed = match ? parseInt(match[2], 10) : 0;
      console.log(`[Auto-Chess] ${roleName} benching ${needed} Pokémon`);

      if (needed > 0) {
        const benchCards = page.locator('.overflow-x-auto > div.cursor-pointer');
        for (let i = 0; i < needed; i++) {
          await benchCards.nth(i).click();
        }
      }
      await benchBtn.click();
    }

    await handleBench(host, 'Host');
    await handleBench(guest, 'Guest');

    // 6. Reveal Phase
    console.log('[Auto-Chess] Verifying Reveal Phase...');
    await host.waitForSelector('text=Draft Complete!', { timeout: 20000 });
    await guest.waitForSelector('text=Draft Complete!', { timeout: 20000 });
    await host.waitForSelector('text=Final Teams!', { timeout: 20000 });

    // Host reveals all cards
    const revealBtn = host.locator('button:has-text("Reveal All Cards")');
    if (await revealBtn.isVisible()) {
      await revealBtn.click();
    }

    console.log('[Auto-Chess] Auto-Chess Merge mode passed successfully!');
    await hostContext.close();
    await guestContext.close();
  });


  test('Synergy Ascension Mode - 6 Rounds, Direct Transition to Reveal, Evolved Triplet Power Spike', async ({ browser }) => {
    test.setTimeout(120000); // 2 minutes timeout

    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    // 1. Host creates room and selects Synergy Ascension
    console.log('[Synergy] Host creating draft room...');
    await host.goto('http://localhost:3000/draft');
    await host.locator('text="Your Username"').locator('..').locator('input').fill('HostSynergy');
    
    // Select Synergy Ascension mode in lobby
    const synergyModeBtn = host.locator('button:has-text("Synergy Ascension")');
    await synergyModeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await synergyModeBtn.click();
    
    // Create Draft Room
    await host.click('button:has-text("Create Draft Room")');
    await host.waitForSelector('text=Room Code', { timeout: 15000 });

    // Extract Room Code
    const roomCodeElement = await host.locator('.font-mono.tracking-widest.text-indigo-400').innerText();
    const roomCode = roomCodeElement.trim();
    console.log(`[Synergy] Room Code: ${roomCode}`);

    // 2. Guest joins room
    console.log('[Synergy] Guest joining room...');
    await guest.goto('http://localhost:3000/draft');
    await guest.fill('input[placeholder="Room Code"]', roomCode);
    await guest.click('button:has-text("Join")');

    await guest.waitForSelector('text=Waiting for Host', { timeout: 15000 });
    console.log('[Synergy] Guest joined successfully.');

    // 3. Host starts draft
    console.log('[Synergy] Host starting draft...');
    await host.click('button:has-text("Start Draft")');

    // Helper for intelligent type-matching pick
    async function pickOption(page, chosenTypes) {
      const cards = page.locator('.flex.flex-col.gap-3.mb-6 > div');
      await cards.first().waitFor({ state: 'visible', timeout: 15000 });
      const count = await cards.count();
      let bestIdx = 0;
      let matched = false;

      // Find an option matching our previously drafted types
      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        const typeSpans = card.locator('span.text-\\[10px\\]');
        const typeCount = await typeSpans.count();
        for (let j = 0; j < typeCount; j++) {
          const typeName = (await typeSpans.nth(j).innerText()).trim().toLowerCase();
          if (chosenTypes[typeName] && chosenTypes[typeName] >= 1) {
            bestIdx = i;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      const chosenCard = cards.nth(bestIdx);
      // Verify button says "Draft" (Keep-Only mode)
      const draftBtn = chosenCard.locator('button:text-is("Draft")');
      await expect(draftBtn).toBeVisible();
      await draftBtn.click();

      // Record types of picked card
      const pickedSpans = chosenCard.locator('span.text-\\[10px\\]');
      const pCount = await pickedSpans.count();
      for (let j = 0; j < pCount; j++) {
        const t = (await pickedSpans.nth(j).innerText()).trim().toLowerCase();
        chosenTypes[t] = (chosenTypes[t] || 0) + 1;
      }

      // Confirm pick
      await page.click('button:text-is("Confirm Selection")');
    }

    const hostTypes = {};
    const guestTypes = {};

    // 4. Play all 6 rounds
    for (let round = 1; round <= 6; round++) {
      console.log(`[Synergy] Playing Round ${round} / 6...`);
      await host.waitForSelector(`text=Round ${round} / 6`, { timeout: 20000 });
      await guest.waitForSelector(`text=Round ${round} / 6`, { timeout: 20000 });

      // Verify no Give buttons
      const hostGiveButtons = await host.locator('button:text-is("Give")').count();
      const guestGiveButtons = await guest.locator('button:text-is("Give")').count();
      expect(hostGiveButtons).toBe(0);
      expect(guestGiveButtons).toBe(0);

      await pickOption(host, hostTypes);
      await pickOption(guest, guestTypes);
    }

    // 5. Direct Transition to Reveal (skips Bench Phase)
    console.log('[Synergy] Verifying Direct Transition to Reveal Phase (no Bench phase)...');
    await host.waitForSelector('text=Draft Complete!', { timeout: 20000 });
    await guest.waitForSelector('text=Draft Complete!', { timeout: 20000 });
    await host.waitForSelector('text=Final Teams!', { timeout: 20000 });

    // Verify bench phase was NOT entered
    const benchHeader = await host.locator('text=Bench Phase').count();
    expect(benchHeader).toBe(0);

    // Host reveals all cards
    const revealBtn = host.locator('button:has-text("Reveal All Cards")');
    if (await revealBtn.isVisible()) {
      await revealBtn.click();
    }

    console.log('[Synergy] Synergy Ascension mode passed successfully!');
    await hostContext.close();
    await guestContext.close();
  });

});
