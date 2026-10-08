const { test, expect } = require('@playwright/test');

test.describe('Draft Modes E2E Tests', () => {

  test('Time Warp Mode - 9 Rounds + 3 Bench', async ({ browser }) => {
    test.setTimeout(120000);
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    // 1. Host creates room
    await host.goto('http://localhost:3000/draft');
    await host.locator('text="Your Username"').locator('..').locator('input').fill('HostPlayer');
    await host.click('button:has-text("Create Draft Room")');
    
    await host.waitForSelector('text=Room Code', { timeout: 10000 });
    
    // Switch mode to Time Warp
    await host.click('text=Time Warp');
    
    // Extract Room Code
    const roomCodeElement = await host.locator('.font-mono.tracking-widest.text-indigo-400').innerText();
    const roomCode = roomCodeElement.trim();
    console.log('Room Code:', roomCode);

    // 2. Guest joins room
    await guest.goto('http://localhost:3000/draft');
    await guest.fill('input[placeholder="Room Code"]', roomCode);
    await guest.click('button:has-text("Join")');

    await guest.waitForSelector('text=Waiting for Host', { timeout: 10000 });
    
    // 3. Host starts draft
    await host.click('button:has-text("Start Draft")');

    // 4. Play 9 rounds
    for (let round = 1; round <= 9; round++) {
      console.log(`Starting Round ${round}`);
      await host.waitForSelector(`text=Round ${round}`, { timeout: 15000 });
      await guest.waitForSelector(`text=Round ${round}`, { timeout: 15000 });
      
      // Select first option for host (clicking the pokemon card)
      await host.locator('button:text-is("Draft")').first().click();
      await host.click('button:text-is("Confirm Selection")');

      // Select first option for guest
      await guest.locator('button:text-is("Draft")').first().click();
      await guest.click('button:text-is("Confirm Selection")');
    }

    // 5. Bench Phase
    console.log('Waiting for Bench Phase');
    await host.waitForSelector('text=Time Warp Bench Phase', { timeout: 15000 });
    await guest.waitForSelector('text=Time Warp Bench Phase', { timeout: 15000 });

    // Host benches 3
    const hostBenchOptions = await host.locator('.overflow-x-auto > div.cursor-pointer');
    for (let i = 0; i < 3; i++) {
      await hostBenchOptions.nth(i).click();
    }
    await host.click('button:has-text("Confirm Bench")');

    // Guest benches 3
    const guestBenchOptions = await guest.locator('.overflow-x-auto > div.cursor-pointer');
    for (let i = 0; i < 3; i++) {
      await guestBenchOptions.nth(i).click();
    }
    await guest.click('button:has-text("Confirm Bench")');

    // 6. Reveal Phase
    console.log('Waiting for Reveal Phase');
    await host.waitForSelector('text=Draft Complete!', { timeout: 15000 });
    await guest.waitForSelector('text=Draft Complete!', { timeout: 15000 });
    
    // Ensure 6 Pokemon are visible in the team list
    const hostTeamSlots = await host.locator('h3:has-text("HostPlayer") + div > div').count();
    expect(hostTeamSlots).toBe(6);
    
    console.log('Time Warp mode passed successfully!');
    
    await hostContext.close();
    await guestContext.close();
  });

});
