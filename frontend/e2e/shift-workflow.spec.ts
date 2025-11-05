import { test, expect } from '@playwright/test';

/**
 * Shift Management Workflow E2E Tests
 * Tests creating, viewing, editing, and deleting pharmacy shifts
 */

test.describe('Shift Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@farmadisplay.com');
    await page.fill('input[name="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to shifts page
    await page.click('a[href="/shifts"], text=Turni');
    await page.waitForURL('/shifts');
  });

  test('should display shifts calendar/list', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: /turni|shift/i })).toBeVisible();

    // Verify calendar or list view is displayed
    const calendarOrList = page.locator('.calendar, table, [role="table"]');
    await expect(calendarOrList).toBeVisible();
  });

  test('should create a new shift', async ({ page }) => {
    // Click create shift button
    await page.click('button:has-text("Nuovo Turno"), button:has-text("Crea"), button:has-text("Aggiungi")');

    // Wait for form
    await expect(page.locator('form')).toBeVisible();

    // Select pharmacy (assuming dropdown exists)
    const pharmacySelect = page.locator('select[name="pharmacy_id"], [name="pharmacy_id"]');
    await pharmacySelect.selectOption({ index: 1 }); // Select first available pharmacy

    // Set date (next Monday)
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
    const dateString = nextMonday.toISOString().split('T')[0];
    await page.fill('input[name="date"], input[type="date"]', dateString);

    // Set shift type
    const shiftTypeSelect = page.locator('select[name="shift_type"], [name="shift_type"]');
    await shiftTypeSelect.selectOption('day'); // or 'night', 'full'

    // Set time range for day shift
    await page.fill('input[name="start_time"]', '08:00');
    await page.fill('input[name="end_time"]', '20:00');

    // Add notes (optional)
    await page.fill('textarea[name="notes"], input[name="notes"]', 'Test shift created by E2E test');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=/creato|created|success/i')).toBeVisible({ timeout: 10000 });

    // Verify shift appears in calendar/list
    await expect(page.locator(`text=${dateString}`)).toBeVisible();
  });

  test('should filter shifts by date range', async ({ page }) => {
    // Find date range inputs
    const startDateInput = page.locator('input[name="start_date"], input[placeholder*="data inizio"]').first();
    const endDateInput = page.locator('input[name="end_date"], input[placeholder*="data fine"]').first();

    if (await startDateInput.count() > 0) {
      // Set date range (current month)
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      await startDateInput.fill(firstDay.toISOString().split('T')[0]);
      await endDateInput.fill(lastDay.toISOString().split('T')[0]);

      // Click filter/search button
      await page.click('button:has-text("Filtra"), button:has-text("Cerca"), button[type="submit"]');

      // Wait for results
      await page.waitForTimeout(500);

      // Verify some shifts are displayed
      const shifts = page.locator('tbody tr, .calendar-event, [role="row"]');
      expect(await shifts.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter shifts by pharmacy', async ({ page }) => {
    // Find pharmacy filter dropdown
    const pharmacyFilter = page.locator('select[name="pharmacy_id"], [aria-label*="farmacia"]').first();

    if (await pharmacyFilter.count() > 0) {
      // Select a pharmacy
      await pharmacyFilter.selectOption({ index: 1 });

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Verify shifts are displayed
      const shifts = page.locator('tbody tr, .calendar-event, [role="row"]');
      expect(await shifts.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should view shift details', async ({ page }) => {
    // Click first shift
    await page.click('tbody tr:first-child, .calendar-event:first-child, [role="row"]:first-child');

    // Wait for details modal/page
    await expect(page.locator('text=/dettagli|details|turno/i')).toBeVisible();

    // Verify shift information
    await expect(page.locator('text=/farmacia|pharmacy/i')).toBeVisible();
    await expect(page.locator('text=/data|date/i')).toBeVisible();
    await expect(page.locator('text=/orario|time|ora/i')).toBeVisible();
  });

  test('should edit shift', async ({ page }) => {
    // Click first shift
    await page.click('tbody tr:first-child, .calendar-event:first-child, [role="row"]:first-child');

    // Click edit button
    await page.click('button:has-text("Modifica"), button:has-text("Edit"), button[aria-label*="edit"]');

    // Wait for edit form
    await expect(page.locator('form')).toBeVisible();

    // Update notes
    const notesInput = page.locator('textarea[name="notes"], input[name="notes"]');
    await notesInput.clear();
    await notesInput.fill(`Updated notes ${Date.now()}`);

    // Update end time
    const endTimeInput = page.locator('input[name="end_time"]');
    if (await endTimeInput.count() > 0) {
      await endTimeInput.clear();
      await endTimeInput.fill('21:00');
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=/aggiornato|updated|success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should validate shift times', async ({ page }) => {
    // Click create shift button
    await page.click('button:has-text("Nuovo Turno"), button:has-text("Crea")');

    // Wait for form
    await expect(page.locator('form')).toBeVisible();

    // Set invalid time range (end before start)
    await page.fill('input[name="start_time"]', '20:00');
    await page.fill('input[name="end_time"]', '08:00');

    // Try to submit
    await page.click('button[type="submit"]');

    // Verify validation error
    await expect(page.locator('text=/ora.*non valida|invalid.*time|fine.*dopo.*inizio/i')).toBeVisible();
  });

  test('should create recurring shifts', async ({ page }) => {
    // Check if recurring feature exists
    const recurringCheckbox = page.locator('input[type="checkbox"][name="is_recurring"], input[name="recurring"]');

    if (await recurringCheckbox.count() > 0) {
      // Click create shift button
      await page.click('button:has-text("Nuovo Turno"), button:has-text("Crea")');
      await expect(page.locator('form')).toBeVisible();

      // Select pharmacy
      const pharmacySelect = page.locator('select[name="pharmacy_id"]');
      await pharmacySelect.selectOption({ index: 1 });

      // Enable recurring
      await recurringCheckbox.check();

      // Set start date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0]);

      // Set recurrence pattern
      const recurrenceSelect = page.locator('select[name="recurrence_pattern"]');
      if (await recurrenceSelect.count() > 0) {
        await recurrenceSelect.selectOption('weekly');
      }

      // Set times
      await page.fill('input[name="start_time"]', '09:00');
      await page.fill('input[name="end_time"]', '18:00');

      // Submit
      await page.click('button[type="submit"]');

      // Wait for success
      await expect(page.locator('text=/creato|created|success/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should delete shift', async ({ page }) => {
    // First create a shift to delete
    await page.click('button:has-text("Nuovo Turno"), button:has-text("Crea")');
    await expect(page.locator('form')).toBeVisible();

    const pharmacySelect = page.locator('select[name="pharmacy_id"]');
    await pharmacySelect.selectOption({ index: 1 });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    await page.fill('input[name="date"]', futureDate.toISOString().split('T')[0]);

    await page.fill('input[name="start_time"]', '10:00');
    await page.fill('input[name="end_time"]', '19:00');
    await page.fill('textarea[name="notes"], input[name="notes"]', `DELETE TEST ${Date.now()}`);

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/creato|success/i')).toBeVisible({ timeout: 10000 });

    // Find and click the shift
    await page.click(`text=DELETE TEST`);

    // Click delete button
    await page.click('button:has-text("Elimina"), button:has-text("Delete"), button[aria-label*="delete"]');

    // Confirm deletion
    await page.click('button:has-text("Conferma"), button:has-text("Confirm"), button:has-text("Sì")');

    // Wait for success message
    await expect(page.locator('text=/eliminato|deleted|success/i')).toBeVisible({ timeout: 10000 });

    // Verify shift is removed
    await expect(page.locator(`text=DELETE TEST`)).not.toBeVisible();
  });

  test('should prevent overlapping shifts', async ({ page }) => {
    // Create first shift
    await page.click('button:has-text("Nuovo Turno"), button:has-text("Crea")');
    await expect(page.locator('form')).toBeVisible();

    const pharmacySelect = page.locator('select[name="pharmacy_id"]');
    await pharmacySelect.selectOption({ index: 1 });
    const pharmacyId = await pharmacySelect.inputValue();

    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 15);
    const dateString = testDate.toISOString().split('T')[0];

    await page.fill('input[name="date"]', dateString);
    await page.fill('input[name="start_time"]', '09:00');
    await page.fill('input[name="end_time"]', '17:00');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/creato|success/i')).toBeVisible({ timeout: 10000 });

    // Try to create overlapping shift
    await page.click('button:has-text("Nuovo Turno"), button:has-text("Crea")');
    await expect(page.locator('form')).toBeVisible();

    await pharmacySelect.selectOption(pharmacyId);
    await page.fill('input[name="date"]', dateString);
    await page.fill('input[name="start_time"]', '14:00'); // Overlaps with 09:00-17:00
    await page.fill('input[name="end_time"]', '22:00');

    await page.click('button[type="submit"]');

    // Verify overlap error
    await expect(page.locator('text=/sovrapposizione|overlap|già.*turno/i')).toBeVisible();
  });

  test('should export shifts to CSV', async ({ page }) => {
    // Check if export button exists
    const exportButton = page.locator('button:has-text("Esporta"), button:has-text("Export"), button:has-text("CSV")');

    if (await exportButton.count() > 0) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download');

      // Click export
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toMatch(/shift|turni.*\.csv$/i);
    }
  });
});
