import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests login, logout, and protected route functionality
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[name="email"]', 'admin@farmadisplay.com');
    await page.fill('input[name="password"]', 'AdminPassword123!');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard');

    // Verify user info is displayed
    await expect(page.locator('text=admin@farmadisplay.com')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=/credenziali non valide|invalid credentials/i')).toBeVisible();

    // Verify we're still on login page
    expect(page.url()).toContain('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'admin@farmadisplay.com');
    await page.fill('input[name="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click logout button (adjust selector as needed)
    await page.click('button:has-text("Logout"), button:has-text("Esci")');

    // Wait for redirect to login
    await page.waitForURL('/login');

    // Verify we're on login page
    expect(page.url()).toContain('/login');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');

    // Verify we're on login page
    expect(page.url()).toContain('/login');
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', 'admin@farmadisplay.com');
    await page.fill('input[name="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Reload page
    await page.reload();

    // Verify still on dashboard (not redirected to login)
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('text=admin@farmadisplay.com')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling fields
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=/email.*richiesto|email.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*richiesto|password.*required/i')).toBeVisible();
  });
});
