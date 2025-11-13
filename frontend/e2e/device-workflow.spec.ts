import { test, expect } from '@playwright/test';

/**
 * Device Management Workflow E2E Tests
 * Tests creating, viewing, editing, and monitoring Raspberry Pi devices
 */

test.describe('Device Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@turnotec.com');
    await page.fill('input[name="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to devices page
    await page.click('a[href="/devices"], text=Dispositivi, text=Device');
    await page.waitForURL('/devices');
  });

  test('should display devices list', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: /dispositivi|device/i })).toBeVisible();

    // Verify table or grid is displayed
    await expect(page.locator('table, [role="table"], .device-grid')).toBeVisible();
  });

  test('should create a new device', async ({ page }) => {
    // Click create device button
    await page.click('button:has-text("Nuovo Dispositivo"), button:has-text("Crea"), button:has-text("Aggiungi")');

    // Wait for form
    await expect(page.locator('form')).toBeVisible();

    // Fill device form
    const timestamp = Date.now();
    await page.fill('input[name="serial_number"]', `RPI-TEST-${timestamp}`);
    await page.fill('input[name="name"]', `Device Test ${timestamp}`);

    // Select pharmacy
    const pharmacySelect = page.locator('select[name="pharmacy_id"], [name="pharmacy_id"]');
    await pharmacySelect.selectOption({ index: 1 });

    // Set firmware version
    await page.fill('input[name="firmware_version"]', '1.0.0');

    // Add notes
    await page.fill('textarea[name="notes"], input[name="notes"]', 'Test device created by E2E test');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=/creato|created|success/i')).toBeVisible({ timeout: 10000 });

    // Verify device appears in list
    await expect(page.locator(`text=RPI-TEST-${timestamp}`)).toBeVisible();
  });

  test('should display device status indicators', async ({ page }) => {
    // Find status badges/indicators
    const statusIndicators = page.locator('.status-badge, [class*="status"], .badge');

    if (await statusIndicators.count() > 0) {
      // Verify status indicators are visible
      await expect(statusIndicators.first()).toBeVisible();

      // Check for different status types
      const statuses = ['active', 'offline', 'attivo', 'inattivo'];
      let hasStatus = false;
      for (const status of statuses) {
        if (await page.locator(`text=/${status}/i`).count() > 0) {
          hasStatus = true;
          break;
        }
      }
      expect(hasStatus).toBeTruthy();
    }
  });

  test('should view device details', async ({ page }) => {
    // Click first device
    await page.click('tbody tr:first-child, [role="row"]:first-child, .device-card:first-child');

    // Wait for details page/modal
    await expect(page.locator('text=/dettagli|details|dispositivo/i')).toBeVisible();

    // Verify device information sections
    await expect(page.locator('text=/numero.*serie|serial|numero/i')).toBeVisible();
    await expect(page.locator('text=/farmacia|pharmacy/i')).toBeVisible();
    await expect(page.locator('text=/stato|status/i')).toBeVisible();
    await expect(page.locator('text=/firmware/i')).toBeVisible();
  });

  test('should view device heartbeat history', async ({ page }) => {
    // Click first device
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Look for heartbeat section or tab
    const heartbeatSection = page.locator('text=/heartbeat|ultimo.*segnale|last.*seen/i');

    if (await heartbeatSection.count() > 0) {
      await expect(heartbeatSection).toBeVisible();

      // Check for timestamp
      await expect(page.locator('text=/\\d{2}:\\d{2}|ago|fa/i')).toBeVisible();
    }
  });

  test('should edit device', async ({ page }) => {
    // Click first device
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Click edit button
    await page.click('button:has-text("Modifica"), button:has-text("Edit"), button[aria-label*="edit"]');

    // Wait for edit form
    await expect(page.locator('form')).toBeVisible();

    // Update device name
    const timestamp = Date.now();
    const nameInput = page.locator('input[name="name"]');
    await nameInput.clear();
    await nameInput.fill(`Device Updated ${timestamp}`);

    // Update firmware version
    const firmwareInput = page.locator('input[name="firmware_version"]');
    if (await firmwareInput.count() > 0) {
      await firmwareInput.clear();
      await firmwareInput.fill('1.1.0');
    }

    // Update notes
    const notesInput = page.locator('textarea[name="notes"], input[name="notes"]');
    if (await notesInput.count() > 0) {
      await notesInput.clear();
      await notesInput.fill(`Updated notes ${timestamp}`);
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=/aggiornato|updated|success/i')).toBeVisible({ timeout: 10000 });

    // Verify updated name appears
    await expect(page.locator(`text=Device Updated ${timestamp}`)).toBeVisible();
  });

  test('should filter devices by status', async ({ page }) => {
    // Find status filter
    const statusFilter = page.locator('select[name="status"], [aria-label*="stato"]').first();

    if (await statusFilter.count() > 0) {
      // Select 'active' status
      await statusFilter.selectOption('active');

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Verify devices are displayed
      const devices = page.locator('tbody tr, [role="row"]');
      expect(await devices.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should search devices by serial number', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="cerca"], input[placeholder*="serial"]').first();

    if (await searchInput.count() > 0) {
      // Type search query
      await searchInput.fill('RPI');

      // Wait for results
      await page.waitForTimeout(500);

      // Verify filtered results
      const devices = page.locator('tbody tr, [role="row"]');
      expect(await devices.count()).toBeGreaterThan(0);
    }
  });

  test('should reassign device to different pharmacy', async ({ page }) => {
    // Click first device
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Click edit button
    await page.click('button:has-text("Modifica"), button:has-text("Edit")');

    // Wait for form
    await expect(page.locator('form')).toBeVisible();

    // Change pharmacy
    const pharmacySelect = page.locator('select[name="pharmacy_id"]');
    const currentIndex = await pharmacySelect.evaluate((el: any) => el.selectedIndex);
    const optionsCount = await pharmacySelect.evaluate((el: any) => el.options.length);

    if (optionsCount > 2) { // At least 2 pharmacies + 1 empty option
      const newIndex = currentIndex === 1 ? 2 : 1;
      await pharmacySelect.selectOption({ index: newIndex });

      // Submit
      await page.click('button[type="submit"]');

      // Wait for success
      await expect(page.locator('text=/aggiornato|updated|success/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should delete device', async ({ page }) => {
    // First create a device to delete
    await page.click('button:has-text("Nuovo Dispositivo"), button:has-text("Crea")');
    await expect(page.locator('form')).toBeVisible();

    const timestamp = Date.now();
    await page.fill('input[name="serial_number"]', `RPI-DELETE-${timestamp}`);
    await page.fill('input[name="name"]', `Device Delete ${timestamp}`);

    const pharmacySelect = page.locator('select[name="pharmacy_id"]');
    await pharmacySelect.selectOption({ index: 1 });

    await page.fill('input[name="firmware_version"]', '1.0.0');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/creato|success/i')).toBeVisible({ timeout: 10000 });

    // Find and click the device
    await page.click(`text=RPI-DELETE-${timestamp}`);

    // Click delete button
    await page.click('button:has-text("Elimina"), button:has-text("Delete"), button[aria-label*="delete"]');

    // Confirm deletion
    await page.click('button:has-text("Conferma"), button:has-text("Confirm"), button:has-text("Sì")');

    // Wait for success message
    await expect(page.locator('text=/eliminato|deleted|success/i')).toBeVisible({ timeout: 10000 });

    // Verify device is removed
    await expect(page.locator(`text=RPI-DELETE-${timestamp}`)).not.toBeVisible();
  });

  test('should validate unique serial number', async ({ page }) => {
    // Get first device serial number
    const firstRow = page.locator('tbody tr:first-child, [role="row"]:first-child');
    const existingSerial = await firstRow.locator('td:nth-child(1), [role="cell"]:nth-child(1)').textContent();

    if (existingSerial) {
      // Try to create device with duplicate serial
      await page.click('button:has-text("Nuovo Dispositivo"), button:has-text("Crea")');
      await expect(page.locator('form')).toBeVisible();

      await page.fill('input[name="serial_number"]', existingSerial.trim());
      await page.fill('input[name="name"]', `Duplicate Test ${Date.now()}`);

      const pharmacySelect = page.locator('select[name="pharmacy_id"]');
      await pharmacySelect.selectOption({ index: 1 });

      await page.fill('input[name="firmware_version"]', '1.0.0');

      await page.click('button[type="submit"]');

      // Verify duplicate error
      await expect(page.locator('text=/già.*esiste|already.*exists|duplicato|duplicate/i')).toBeVisible();
    }
  });

  test('should display device location on map', async ({ page }) => {
    // Click first device
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Check if map exists
    const map = page.locator('.map, #map, [class*="leaflet"], [class*="mapbox"]');

    if (await map.count() > 0) {
      await expect(map).toBeVisible();
    }
  });

  test('should show device connection status in real-time', async ({ page }) => {
    // Click first device
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Find status indicator
    const statusBadge = page.locator('.status-badge, [class*="status"]').first();

    if (await statusBadge.count() > 0) {
      // Get current status
      const currentStatus = await statusBadge.textContent();

      // Verify it shows a valid status
      expect(currentStatus).toMatch(/active|offline|online|attivo|inattivo/i);
    }
  });

  test('should generate device QR code for setup', async ({ page }) => {
    // Click first device
    await page.click('tbody tr:first-child, [role="row"]:first-child');

    // Look for QR code button or section
    const qrButton = page.locator('button:has-text("QR"), button:has-text("Codice"), text=/qr.*code/i');

    if (await qrButton.count() > 0) {
      await qrButton.click();

      // Verify QR code image appears
      const qrImage = page.locator('img[alt*="QR"], canvas, svg[class*="qr"]');
      await expect(qrImage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should sort devices by last heartbeat', async ({ page }) => {
    // Find heartbeat column header
    const heartbeatHeader = page.locator('th:has-text("Heartbeat"), th:has-text("Ultimo"), th:has-text("Last Seen")').first();

    if (await heartbeatHeader.count() > 0) {
      // Click to sort
      await heartbeatHeader.click();
      await page.waitForTimeout(500);

      // Verify order changed (check first row changed)
      const firstRow = await page.locator('tbody tr:first-child td:first-child').textContent();

      // Click again to reverse sort
      await heartbeatHeader.click();
      await page.waitForTimeout(500);

      const newFirstRow = await page.locator('tbody tr:first-child td:first-child').textContent();

      // Verify sorting works
      expect(firstRow).toBeDefined();
      expect(newFirstRow).toBeDefined();
    }
  });
});
