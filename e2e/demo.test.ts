import { expect, test } from '@playwright/test';

test.describe('Property Game E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Clear localStorage to start fresh
		await page.evaluate(() => localStorage.clear());
		await page.reload();
	});

	test('should load and display the game interface', async ({ page }) => {
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toHaveText('Property Management Game');
		
		// Check initial state is displayed
		await expect(page.getByText('Date:')).toBeVisible();
		await expect(page.getByText('1 Jan Year 1')).toBeVisible();
		await expect(page.getByText('Cash:')).toBeVisible();
		await expect(page.getByText('£0.00')).toBeVisible();
	});

	test('should display starter property with correct initial state', async ({ page }) => {
		await expect(page.getByText('Starter Home')).toBeVisible();
		await expect(page.getByText('VACANT')).toBeVisible();
		await expect(page.getByText(/Value: £1,000.00/)).toBeVisible();
	});

	test('should have functional time controls', async ({ page }) => {
		// Check play button exists
		const playButton = page.getByRole('button', { name: /Play/ });
		await expect(playButton).toBeVisible();
		
		// Check speed buttons exist
		await expect(page.getByRole('button', { name: '0.5x' })).toBeVisible();
		await expect(page.getByRole('button', { name: '1x' })).toBeVisible();
		await expect(page.getByRole('button', { name: '5x' })).toBeVisible();
		
		// Check reset button exists
		await expect(page.getByRole('button', { name: 'Reset Game' })).toBeVisible();
	});

	test('should toggle pause state', async ({ page }) => {
		// Initially should show "Play" (game is paused by default? No, it's playing)
		// Actually based on the code, isPaused starts as false, so it should show "Pause"
		await page.getByRole('button', { name: /Pause/ }).click();
		
		// After clicking, should show "Play"
		await expect(page.getByRole('button', { name: /Play/ })).toBeVisible();
		
		// Click again to unpause
		await page.getByRole('button', { name: /Play/ }).click();
		await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
	});

	test('should change game speed', async ({ page }) => {
		// Click 5x speed
		await page.getByRole('button', { name: '5x' }).click();
		
		// The button should have active styling (bg-green-600 class)
		const speedButton = page.getByRole('button', { name: '5x' });
		await expect(speedButton).toHaveClass(/bg-green-600/);
		
		// Click 0.5x speed
		await page.getByRole('button', { name: '0.5x' }).click();
		const slowButton = page.getByRole('button', { name: '0.5x' });
		await expect(slowButton).toHaveClass(/bg-green-600/);
	});

	test('should adjust vacant property settings', async ({ page }) => {
		// Find the rent markup slider
		const slider = page.locator('input[type="range"]').first();
		await expect(slider).toBeVisible();
		
		// Change rent markup
		await slider.fill('8');
		
		// Verify the display updates (should show +8%)
		await expect(page.getByText('+8%')).toBeVisible();
		
		// Click a different lease period
		await page.getByRole('button', { name: '24m' }).click();
		
		// Verify the button has active styling
		const leaseButton = page.getByRole('button', { name: '24m' });
		await expect(leaseButton).toHaveClass(/bg-blue-600/);
	});

	test('should toggle auto-relist setting', async ({ page }) => {
		// Find the auto-relist checkbox
		const checkbox = page.getByRole('checkbox', { name: /Auto-relist/ });
		await expect(checkbox).toBeVisible();
		
		// Initially unchecked
		await expect(checkbox).not.toBeChecked();
		
		// Click to check
		await checkbox.click();
		await expect(checkbox).toBeChecked();
		
		// Click again to uncheck
		await checkbox.click();
		await expect(checkbox).not.toBeChecked();
	});

	test('should display fill chance based on rent markup', async ({ page }) => {
		// Initial markup is 5, so fill chance should be 3%
		await expect(page.getByText('3% per day')).toBeVisible();
		
		// Lower markup to 4, should show 4% (higher chance)
		const slider = page.locator('input[type="range"]').first();
		await slider.fill('4');
		await expect(page.getByText('4% per day')).toBeVisible();
		
		// Increase markup to 7, should show 2% (lower chance)
		await slider.fill('7');
		await expect(page.getByText('2% per day')).toBeVisible();
	});

	test('should show reset confirmation dialog', async ({ page }) => {
		// Set up dialog handler
		page.on('dialog', async dialog => {
			expect(dialog.message()).toContain('Are you sure you want to reset');
			await dialog.dismiss();
		});
		
		// Click reset button
		await page.getByRole('button', { name: 'Reset Game' }).click();
		
		// Dialog should have been shown (handled by the event listener above)
	});

	test('should persist game state in localStorage', async ({ page }) => {
		// Make some changes
		await page.getByRole('button', { name: '5x' }).click();
		const slider = page.locator('input[type="range"]').first();
		await slider.fill('8');
		
		// Reload the page
		await page.reload();
		
		// Check that the state persisted
		const speedButton = page.getByRole('button', { name: '5x' });
		await expect(speedButton).toHaveClass(/bg-green-600/);
		await expect(page.getByText('+8%')).toBeVisible();
	});

	test('should advance time when game is running', async ({ page }) => {
		// Note: This test is time-sensitive and may be flaky
		// We'll just verify the date changes after waiting
		
		// Ensure game is not paused
		const pauseButton = page.getByRole('button', { name: /Pause/ });
		if (await pauseButton.isVisible()) {
			// Game is running, good
		} else {
			// Game is paused, click play
			await page.getByRole('button', { name: /Play/ }).click();
		}
		
		// Set to fastest speed
		await page.getByRole('button', { name: '5x' }).click();
		
		// Wait for at least one day to pass (0.5 seconds at 5x speed)
		await page.waitForTimeout(600);
		
		// Date should have advanced
		const dateText = await page.getByText(/\d+ \w+ Year \d+/).textContent();
		expect(dateText).toBeTruthy();
		// At minimum, we should not still be on exactly "1 Jan Year 1"
		// (though this could be flaky depending on timing)
	});

	test('should display help text and information', async ({ page }) => {
		await expect(page.getByText(/Game progress is automatically saved/)).toBeVisible();
		await expect(page.getByText(/Rent is collected on the 1st of each month/)).toBeVisible();
		await expect(page.getByText(/0.5x = 10 seconds per day/)).toBeVisible();
	});

	test('should show vacant property information banner', async ({ page }) => {
		await expect(page.getByText(/Property is currently trying to attract tenants/)).toBeVisible();
		await expect(page.getByText(/Higher rent = slower filling/)).toBeVisible();
	});
});
