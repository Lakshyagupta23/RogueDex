const { test, expect } = require('@playwright/test');

test.describe('Draft Modes E2E Tests', () => {
  test('Standard Mode - 3 Rounds Keep and Give', async ({ browser }) => {
    test.setTimeout(120000); // 2 minutes max

    // We need 2 browser contexts to act as Host and Guest
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    // 1. Host creates room
    await host.goto('http://localhost:3000/draft');
    await host.locator('text="Your Username"').locator('..').locator('input').fill('HostPlayer');
    await host.click('button:has-text("Create Draft Room")');
    
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

    // 4. Play 3 rounds
    for (let round = 1; round <= 3; round++) {
      console.log(`Starting Round ${round}`);
      await host.waitForSelector(`text=Round ${round}`, { timeout: 15000 });
      await guest.waitForSelector(`text=Round ${round}`, { timeout: 15000 });
      
      // Select Keep for host
      await host.locator('button:text-is("Keep")').nth(0).click();
      // Select Give for host
      await host.locator('button:text-is("Give")').nth(1).click();
      await host.click('button:text-is("Confirm Selection")');

      // Select Keep for guest
      await guest.locator('button:text-is("Keep")').nth(0).click();
      // Select Give for guest
      await guest.locator('button:text-is("Give")').nth(1).click();
      await guest.click('button:text-is("Confirm Selection")');
    }

    // 5. Reveal Phase
    console.log('Waiting for Reveal Phase');
    await host.waitForSelector('text=Final Teams!', { timeout: 15000 });
    await guest.waitForSelector('text=Final Teams!', { timeout: 15000 });

    console.log('Standard mode passed successfully!');
    
    await hostContext.close();
    await guestContext.close();
  });
});
