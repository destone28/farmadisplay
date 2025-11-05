import { test, expect } from '@playwright/test';

/**
 * Pharmacy Management Workflow E2E Tests
 * Tests creating, viewing, editing, and deleting pharmacies
 */

test.describe('Pharmacy Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@farmadisplay.com');
    await page.fill('input[name="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to pharmacies page
    await page.click('a[href="/pharmacies"], text=Farmacie');
    await page.waitForURL('/pharmacies');
  });

  test('should display pharmacies list', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: /farmacie/i })).toBeVisible();

    // Verify table is displayed
    await expect(page.locator('table, [role="table"]')).toBeVisible();

    // Verify at least one pharmacy row exists
    const rows = page.locator('tbody tr, [role="row"]');
    await expect(rows).not.toHaveCount(0);
  });

  test('should create a new pharmacy', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Nuova Farmacia"), button:has-text("Crea"), button:has-text("Aggiungi")');

    // Wait for form modal/page
    await expect(page.locator('form')).toBeVisible();

    // Fill pharmacy form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Farmacia Test ${timestamp}`);
    await page.fill('input[name="address"]', 'Via Test 123');
    await page.fill('input[name="city"]', 'Milano');
    await page.fill('input[name="province"]', 'MI');
    await page.fill('input[name="postal_code"]', '20100');
    await page.fill('input[name="phone"]', '0212345678');
    await page.fill('input[name="email"]', `test${timestamp}@farmacia.it`);
    await page.fill('input[name="latitude"]', '45.4642');
    await page.fill('input[name="longitude"]', '9.1900');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=/creata|success|successo/i')).toBeVisible({ timeout: 10000 });

    // Verify new pharmacy appears in list
    await expect(page.locator(`text=Farmacia Test ${timestamp}`)).toBeVisible();
  });

  test('should search pharmacies', async ({ page }) => {
    // Locate search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="cerca"], input[placeholder*="search"]').first();

    // Type search query
    await searchInput.fill('Farmacia');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify filtered results
    const rows = page.locator('tbody tr, [role="row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should view pharmacy details', async ({ page }) => {
    // Click first pharmacy row or view button
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Wait for details page/modal
    await expect(page.locator('text=/dettagli|details/i, h2, h3')).toBeVisible();

    // Verify pharmacy information is displayed
    await expect(page.locator('text=/indirizzo|address/i')).toBeVisible();
    await expect(page.locator('text=/telefono|phone/i')).toBeVisible();
    await expect(page.locator('text=/email/i')).toBeVisible();
  });

  test('should edit pharmacy', async ({ page }) => {
    // Click first pharmacy row
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Click edit button
    await page.click('button:has-text("Modifica"), button:has-text("Edit"), button[aria-label*="edit"]');

    // Wait for edit form
    await expect(page.locator('form')).toBeVisible();

    // Update pharmacy name
    const timestamp = Date.now();
    const nameInput = page.locator('input[name="name"]');
    await nameInput.clear();
    await nameInput.fill(`Farmacia Updated ${timestamp}`);

    // Update phone
    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.clear();
    await phoneInput.fill('0298765432');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=/aggiornata|updated|success/i')).toBeVisible({ timeout: 10000 });

    // Verify updated name appears
    await expect(page.locator(`text=Farmacia Updated ${timestamp}`)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Nuova Farmacia"), button:has-text("Crea"), button:has-text("Aggiungi")');

    // Wait for form
    await expect(page.locator('form')).toBeVisible();

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=/nome.*richiesto|name.*required/i')).toBeVisible();
    await expect(page.locator('text=/indirizzo.*richiesto|address.*required/i')).toBeVisible();
  });

  test('should delete pharmacy', async ({ page }) => {
    // First create a pharmacy to delete
    await page.click('button:has-text("Nuova Farmacia"), button:has-text("Crea"), button:has-text("Aggiungi")');
    await expect(page.locator('form')).toBeVisible();

    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Farmacia Delete ${timestamp}`);
    await page.fill('input[name="address"]', 'Via Delete 123');
    await page.fill('input[name="city"]', 'Roma');
    await page.fill('input[name="province"]', 'RM');
    await page.fill('input[name="postal_code"]', '00100');
    await page.fill('input[name="phone"]', '0611111111');
    await page.fill('input[name="email"]', `delete${timestamp}@test.it`);
    await page.fill('input[name="latitude"]', '41.9028');
    await page.fill('input[name="longitude"]', '12.4964');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/creata|success/i')).toBeVisible({ timeout: 10000 });

    // Find and click the pharmacy row
    await page.click(`text=Farmacia Delete ${timestamp}`);

    // Click delete button
    await page.click('button:has-text("Elimina"), button:has-text("Delete"), button[aria-label*="delete"]');

    // Confirm deletion in dialog
    await page.click('button:has-text("Conferma"), button:has-text("Confirm"), button:has-text("Sì")');

    // Wait for success message
    await expect(page.locator('text=/eliminata|deleted|success/i')).toBeVisible({ timeout: 10000 });

    // Verify pharmacy is no longer in list
    await expect(page.locator(`text=Farmacia Delete ${timestamp}`)).not.toBeVisible();
  });

  test('should sort pharmacies by name', async ({ page }) => {
    // Find sort header
    const nameHeader = page.locator('th:has-text("Nome"), th:has-text("Name")').first();

    // Click to sort ascending
    await nameHeader.click();
    await page.waitForTimeout(500);

    // Get first pharmacy name
    const firstPharmacy = await page.locator('tbody tr:first-child td:first-child, [role="row"]:first-child [role="cell"]:first-child').textContent();

    // Click to sort descending
    await nameHeader.click();
    await page.waitForTimeout(500);

    // Get new first pharmacy name
    const newFirstPharmacy = await page.locator('tbody tr:first-child td:first-child, [role="row"]:first-child [role="cell"]:first-child').textContent();

    // Verify order changed
    expect(firstPharmacy).not.toBe(newFirstPharmacy);
  });

  test('should paginate pharmacies list', async ({ page }) => {
    // Check if pagination exists
    const pagination = page.locator('[role="navigation"], .pagination');
    const hasPagination = await pagination.count() > 0;

    if (hasPagination) {
      // Click next page button
      await page.click('button:has-text("Next"), button:has-text("Avanti"), button[aria-label*="next"]');
      await page.waitForTimeout(500);

      // Verify URL or page number changed
      const pageIndicator = page.locator('text=/pagina|page/i');
      await expect(pageIndicator).toBeVisible();
    }
  });
});
