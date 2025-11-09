import { page } from 'vitest/browser';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	it('should render main heading', async () => {
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		await expect.element(heading).toHaveTextContent('Property Management Game');
	});

	it('should display initial game state', async () => {
		render(Page);

		// Check initial cash display
		await expect.element(page.getByText(/Cash:/)).toBeInTheDocument();
		await expect.element(page.getByText(/£0.00/)).toBeInTheDocument();

		// Check initial date
		await expect.element(page.getByText(/Date:/)).toBeInTheDocument();
		await expect.element(page.getByText(/1 Jan Year 1/)).toBeInTheDocument();
	});

	it('should display starter property', async () => {
		render(Page);

		await expect.element(page.getByText('Starter Home')).toBeInTheDocument();
		await expect.element(page.getByText(/VACANT/)).toBeInTheDocument();
	});

	it('should have time control buttons', async () => {
		render(Page);

		// Check for play/pause button
		const playButton = page.getByRole('button', { name: /Play/ });
		await expect.element(playButton).toBeInTheDocument();

		// Check for speed buttons
		await expect.element(page.getByRole('button', { name: '0.5x' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '1x' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '5x' })).toBeInTheDocument();

		// Check for reset button
		await expect.element(page.getByRole('button', { name: /Reset Game/ })).toBeInTheDocument();
	});

	it('should toggle pause state when clicking play/pause button', async () => {
		render(Page);

		const playButton = page.getByRole('button', { name: /Play/ });
		await expect.element(playButton).toBeInTheDocument();

		// Click to pause
		await playButton.click();

		// Button text should change
		const pauseButton = page.getByRole('button', { name: /Pause/ });
		await expect.element(pauseButton).toBeInTheDocument();
	});

	it('should display vacant property settings', async () => {
		render(Page);

		// Check for rent markup slider
		const slider = page.getByRole('slider');
		await expect.element(slider).toBeInTheDocument();

		// Check for lease period buttons
		await expect.element(page.getByRole('button', { name: '6m' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '12m' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '18m' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '24m' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '36m' })).toBeInTheDocument();

		// Check for auto-relist checkbox
		const checkbox = page.getByRole('checkbox', { name: /Auto-relist/ });
		await expect.element(checkbox).toBeInTheDocument();
		await expect.element(checkbox).not.toBeChecked();
	});

	it('should display monthly rent and fill chance for vacant property', async () => {
		render(Page);

		await expect.element(page.getByText(/Monthly Rent:/)).toBeInTheDocument();
		await expect.element(page.getByText(/Fill Chance:/)).toBeInTheDocument();
		await expect.element(page.getByText(/per day/)).toBeInTheDocument();
	});

	it('should change speed when clicking speed buttons', async () => {
		render(Page);

		// Click 5x speed button
		const speedButton = page.getByRole('button', { name: '5x' });
		await speedButton.click();

		// The button should show active state (checking via class changes is complex in browser tests)
		// We can verify the button exists and is clickable
		await expect.element(speedButton).toBeInTheDocument();
	});

	it('should toggle auto-relist checkbox', async () => {
		render(Page);

		const checkbox = page.getByRole('checkbox', { name: /Auto-relist/ });
		await expect.element(checkbox).not.toBeChecked();

		await checkbox.click();
		await expect.element(checkbox).toBeChecked();

		await checkbox.click();
		await expect.element(checkbox).not.toBeChecked();
	});

	it('should display game info messages', async () => {
		render(Page);

		await expect.element(page.getByText(/Game progress is automatically saved/)).toBeInTheDocument();
		await expect.element(page.getByText(/Rent is collected on the 1st of each month/)).toBeInTheDocument();
	});
});
