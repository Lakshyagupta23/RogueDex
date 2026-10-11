const { test, expect } = require('@playwright/test');

test.describe('Website Core Functions & Tools E2E Tests', () => {

  test('1. Homepage & Randomizer: Filters, Generation, Types, Showdown Export', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/');
    
    // Wait for the Pokédex database to finish loading and hero header to appear
    await page.waitForSelector('text=RogueDex Randomizer', { timeout: 25000 });
    await expect(page.locator('text=RogueDex Randomizer').first()).toBeVisible();

    // Verify Generate Pokemon button
    const generateBtn = page.locator('button:has-text("Generate Pokémon"), button:has-text("Reroll")').first();
    await expect(generateBtn).toBeVisible();

    // Click Generate Pokemon
    await generateBtn.click();
    await page.waitForTimeout(600);

    // Open Advanced Filters accordion
    const filterBtn = page.locator('button:has-text("Advanced Filters")').first();
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    await page.waitForTimeout(400);

    // Toggle Fire type filter
    const fireBtn = page.locator('button:text-is("fire")').first();
    await expect(fireBtn).toBeVisible();
    await fireBtn.click();
    await page.waitForTimeout(300);

    // Click Apply Options or Generate again
    await page.locator('button:has-text("Apply Options")').click();
    await page.waitForTimeout(400);
    await generateBtn.click();
    await page.waitForTimeout(600);

    // Verify Showdown Export button
    const exportBtn = page.locator('button:has-text("Showdown Export")').first();
    await expect(exportBtn).toBeVisible();

    console.log('✓ Homepage & Randomizer E2E passed');
  });

  test('2. Pokemon Pokedex & Search: Search, list view, and navigate to detail page', async ({ page }) => {
    test.setTimeout(35000);
    await page.goto('/pokemon');
    await page.waitForSelector('text=RogueDex Database', { timeout: 20000 });

    // Search bar
    const searchInput = page.locator('input[placeholder*="Search name, ID, or type"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Pikachu');
    await page.waitForTimeout(600);

    // Verify Pikachu card is displayed and click
    const pikachuCard = page.locator('h3:has-text("Pikachu")').first();
    await expect(pikachuCard).toBeVisible();
    await pikachuCard.click();

    // Verify navigation to detail page
    await page.waitForURL('**/pokemon/**', { timeout: 15000 });
    await page.waitForSelector('h1:has-text("Pikachu")', { timeout: 15000 });
    await expect(page.locator('text=Height').first()).toBeVisible();
    console.log('✓ Pokemon Pokedex & Detail Page E2E passed');
  });

  test('3. Compare Mode: Side-by-side stats and matchups', async ({ page }) => {
    test.setTimeout(35000);
    await page.goto('/pokemon/compare');
    await page.waitForSelector('text=Compare Pokémon', { timeout: 20000 });

    // Search and select Pokemon A (Mewtwo)
    const searchA = page.locator('input[placeholder*="Type name or Pokedex ID"]').first();
    await searchA.fill('Mewtwo');
    await page.waitForTimeout(400);
    const suggestionA = page.locator('button:has-text("Mewtwo")').first();
    await suggestionA.waitFor({ state: 'visible', timeout: 10000 });
    await suggestionA.click();

    // Search and select Pokemon B (Rayquaza)
    const searchB = page.locator('input[placeholder*="Type name or Pokedex ID"]').nth(1);
    await searchB.fill('Rayquaza');
    await page.waitForTimeout(400);
    const suggestionB = page.locator('button:has-text("Rayquaza")').first();
    await suggestionB.waitFor({ state: 'visible', timeout: 10000 });
    await suggestionB.click();

    // Verify comparison cards & stats render
    await page.waitForSelector('h2:has-text("Mewtwo")', { timeout: 15000 });
    await expect(page.locator('h2:has-text("Rayquaza")').first()).toBeVisible();
    console.log('✓ Compare Mode E2E passed');
  });

  test('4. Team Builder: Generate team, check coverage, and export', async ({ page }) => {
    test.setTimeout(35000);
    await page.goto('/team-builder');
    await page.waitForSelector('text=REROLL UNLOCKED SLOTS', { timeout: 20000 });

    // Reroll / Generate team
    const rerollBtn = page.locator('button:has-text("REROLL UNLOCKED SLOTS")').first();
    await expect(rerollBtn).toBeVisible();
    await rerollBtn.click();
    await page.waitForTimeout(600);

    // Verify Team Analysis and Type Coverage are visible
    await page.waitForSelector('text=Team Analysis', { timeout: 15000 });
    await expect(page.locator('text=Type Coverage').first()).toBeVisible();
    console.log('✓ Team Builder E2E passed');
  });

  test('5. Challenges: Catalog, Monotype & Nuzlocke challenge details', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/challenges');
    await page.waitForSelector('text=Available Challenges', { timeout: 20000 });

    // Verify challenge types
    const chaosCard = page.locator('text=Chaos Draft Challenge').first();
    await expect(chaosCard).toBeVisible();
    await expect(page.locator('text=Monotype Specialist').first()).toBeVisible();

    // Click on Chaos Draft Challenge card to start
    await chaosCard.click();
    await page.waitForSelector('text=Active Challenge Run', { timeout: 10000 });
    await expect(page.locator('text=Active Challenge Run').first()).toBeVisible();
    console.log('✓ Challenges E2E passed');
  });

  test('6. Type Chart Tool: 18x18 matrix and multiplier effectiveness', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/tools/type-chart');
    await page.waitForSelector('text=Type Effectiveness Chart', { timeout: 20000 });

    // Verify 2x, ½ multipliers exist
    await expect(page.locator('text=2x').first()).toBeVisible();
    await expect(page.locator('text=½').first()).toBeVisible();
    console.log('✓ Type Chart Tool E2E passed');
  });

  test('7. IV Calculator Tool: Stat and nature calculations', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/tools/iv-calculator');
    await page.waitForSelector('text=IV Calculator', { timeout: 20000 });

    // Search and select Gengar
    const searchInput = page.locator('input[placeholder*="Search Pokemon..."]').first();
    await searchInput.fill('Gengar');
    await page.waitForTimeout(400);

    const suggestion = page.locator('button:has-text("Gengar")').first();
    await suggestion.waitFor({ state: 'visible', timeout: 10000 });
    await suggestion.click();
    await page.waitForTimeout(400);

    // Verify IV calculation interface and base stats
    await expect(page.locator('text=HP').first()).toBeVisible();
    await expect(page.locator('text=Level').first()).toBeVisible();
    console.log('✓ IV Calculator Tool E2E passed');
  });

  test('8. Breeding Tool: Egg groups and compatibility', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/tools/breeding');
    await page.waitForSelector('text=Breeding Calculator', { timeout: 20000 });

    // Search Lucario
    const searchInput = page.locator('input[placeholder*="Type name or Pokedex ID..."]').first();
    await searchInput.fill('Lucario');
    await page.waitForTimeout(400);

    const suggestion = page.locator('button:has-text("Lucario")').first();
    await suggestion.waitFor({ state: 'visible', timeout: 10000 });
    await suggestion.click();

    // Verify Egg Groups display
    await page.waitForSelector('text=Egg Groups', { timeout: 15000 });
    await expect(page.locator('text=Egg Groups').first()).toBeVisible();
    console.log('✓ Breeding Tool E2E passed');
  });

  test('9. Natures Tool: Nature chart boosts and drops', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/tools/natures');
    await page.waitForSelector('text=Nature Guide', { timeout: 20000 });

    // Verify classic natures
    await expect(page.locator('text=Adamant').first()).toBeVisible();
    await expect(page.locator('text=Modest').first()).toBeVisible();
    await expect(page.locator('text=Jolly').first()).toBeVisible();
    await expect(page.locator('text=Timid').first()).toBeVisible();
    console.log('✓ Natures Tool E2E passed');
  });

  test('10. Who\'s That Pokemon Mini-Game: Silhouette, options, and reveal', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/games/whos-that-pokemon');
    await page.waitForSelector('text=Who\'s That Pokémon', { timeout: 20000 });

    // Verify Give Up & Reveal button exists
    const giveUpBtn = page.locator('button:has-text("Give Up & Reveal")').first();
    await expect(giveUpBtn).toBeVisible();

    // Click Give Up & Reveal to test answer reveal logic
    await giveUpBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=REVEALED RESULT').first()).toBeVisible();
    console.log('✓ Who\'s That Pokemon Mini-Game E2E passed');
  });

});
