<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState } from '$lib/stores/gameState';
	import { TIME_SPEED_MS, type TimeSpeed } from '$lib/types/game';
	import MarketView from '$lib/components/MarketView.svelte';
	import PortfolioView from '$lib/components/PortfolioView.svelte';
	import PropertyDetail from '$lib/components/PropertyDetail.svelte';

	type View = 'market' | 'portfolio' | 'property-detail';
	
	let currentView: View = 'portfolio';
	let selectedPropertyId: string | null = null;
	let timer: ReturnType<typeof setInterval> | null = null;

	$: selectedProperty = selectedPropertyId 
		? $gameState.player.properties.find(p => p.id === selectedPropertyId) 
		: null;

	function startTimer() {
		if (timer) clearInterval(timer);

		const speed = $gameState.gameTime.speed;
		const interval = TIME_SPEED_MS[speed];

		timer = setInterval(() => {
			if (!$gameState.gameTime.isPaused) {
				gameState.advanceDay();
			}
		}, interval);
	}

	function handleSpeedChange(newSpeed: TimeSpeed) {
		gameState.setSpeed(newSpeed);
		startTimer();
	}

	function handleTogglePause() {
		gameState.togglePause();
	}

	function handleReset() {
		if (confirm('Are you sure you want to reset your game? This cannot be undone.')) {
			gameState.reset();
			currentView = 'portfolio';
			selectedPropertyId = null;
		}
	}

	function formatCurrency(amount: number): string {
		return `£${amount.toFixed(2)}`;
	}

	function formatDate(date: { year: number; month: number; day: number }): string {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${date.day} ${monthNames[date.month - 1]} Year ${date.year}`;
	}

	function handleSelectProperty(propertyId: string) {
		selectedPropertyId = propertyId;
		currentView = 'property-detail';
	}

	function handleBackToPortfolio() {
		selectedPropertyId = null;
		currentView = 'portfolio';
	}

	function switchView(view: View) {
		currentView = view;
		if (view !== 'property-detail') {
			selectedPropertyId = null;
		}
	}

	onMount(() => {
		startTimer();
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<header class="mb-8">
			<h1 class="text-4xl font-bold mb-2">Property Management Game</h1>
			<div class="flex items-center gap-6 text-lg">
				<div>
					<span class="text-slate-400">Date:</span>
					<span class="font-semibold ml-2">{formatDate($gameState.gameTime.currentDate)}</span>
				</div>
				<div>
					<span class="text-slate-400">Cash:</span>
					<span class="font-semibold ml-2 text-green-400">
						{formatCurrency($gameState.player.cash)}
					</span>
				</div>
			</div>
		</header>

		<!-- Time Controls -->
		<div class="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
			<h2 class="text-xl font-bold mb-4">Time Controls</h2>
			<div class="flex items-center gap-4 flex-wrap">
				<button
					onclick={handleTogglePause}
					class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
				>
					{$gameState.gameTime.isPaused ? '▶ Play' : '⏸ Pause'}
				</button>

				<div class="flex items-center gap-2">
					<span class="text-slate-400">Speed:</span>
					<button
						onclick={() => handleSpeedChange(0.5)}
						class="px-4 py-2 rounded-lg font-semibold transition-colors {$gameState.gameTime
							.speed === 0.5
							? 'bg-green-600'
							: 'bg-slate-700 hover:bg-slate-600'}"
					>
						0.5x
					</button>
					<button
						onclick={() => handleSpeedChange(1)}
						class="px-4 py-2 rounded-lg font-semibold transition-colors {$gameState.gameTime
							.speed === 1
							? 'bg-green-600'
							: 'bg-slate-700 hover:bg-slate-600'}"
					>
						1x
					</button>
					<button
						onclick={() => handleSpeedChange(5)}
						class="px-4 py-2 rounded-lg font-semibold transition-colors {$gameState.gameTime
							.speed === 5
							? 'bg-green-600'
							: 'bg-slate-700 hover:bg-slate-600'}"
					>
						5x
					</button>
				</div>

				<button
					onclick={handleReset}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors ml-auto"
				>
					Reset Game
				</button>
			</div>
			<div class="mt-4 text-sm text-slate-400">
				<p>0.5x = 10 seconds per day | 1x = 2 seconds per day | 5x = 0.5 seconds per day</p>
			</div>
		</div>

		<!-- Navigation Tabs -->
		{#if currentView !== 'property-detail'}
			<div class="bg-slate-800 rounded-lg p-2 mb-8 border border-slate-700 flex gap-2">
				<button
					onclick={() => switchView('portfolio')}
					class="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors {currentView === 'portfolio'
						? 'bg-blue-600 text-white'
						: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
				>
					Portfolio ({$gameState.player.properties.length})
				</button>
				<button
					onclick={() => switchView('market')}
					class="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors {currentView === 'market'
						? 'bg-blue-600 text-white'
						: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
				>
					Market ({$gameState.propertyMarket.length})
				</button>
			</div>
		{/if}

		<!-- Content Area -->
		{#if currentView === 'market'}
			<MarketView />
		{:else if currentView === 'portfolio'}
			<PortfolioView onSelectProperty={handleSelectProperty} />
		{:else if currentView === 'property-detail' && selectedProperty}
			<PropertyDetail property={selectedProperty} onBack={handleBackToPortfolio} />
		{/if}

		<!-- Info -->
		<div class="mt-8 text-center text-slate-400 text-sm">
			<p>Game progress is automatically saved to your browser's local storage.</p>
			<p class="mt-1">Rent is collected on the 1st of each month from occupied properties.</p>
		</div>
	</div>
</div>
