<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState } from '$lib/stores/gameState';
	import { TIME_SPEED_MS, type TimeSpeed } from '$lib/types/game';
	import MarketView from '$lib/components/MarketView.svelte';
	import PortfolioView from '$lib/components/PortfolioView.svelte';
	import PropertyDetail from '$lib/components/PropertyDetail.svelte';
	import StaffView from '$lib/components/StaffView.svelte';
	import { formatCurrency } from '$lib/utils/format';

	type View = 'market' | 'portfolio' | 'staff' | 'property-detail';
	
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

	function formatDate(date: { year: number; month: number; day: number }): string {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${date.day} ${monthNames[date.month - 1]} Year ${date.year}`;
	}

	function handleSelectProperty(propertyId: string) {
		selectedPropertyId = propertyId;
		currentView = 'property-detail';
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
			<div class="flex items-center gap-6 text-lg flex-wrap">
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
				<div>
					<span class="text-slate-400">Accrued Interest:</span>
					<span class="font-semibold ml-2 text-blue-400">
						{formatCurrency($gameState.player.accruedInterest)}
					</span>
				</div>
			</div>
		</header>

		<!-- Economic Indicators -->
		<div class="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
			<h2 class="text-xl font-bold mb-4">Economic Indicators</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="bg-slate-700 rounded-lg p-4">
					<div class="text-sm text-slate-400 mb-1">Bank Base Rate</div>
					<div class="text-2xl font-bold text-blue-400">{$gameState.economy.baseRate.toFixed(2)}%</div>
					<div class="text-xs text-slate-400 mt-1">Current rate for new tenancies</div>
				</div>
				<div class="bg-slate-700 rounded-lg p-4">
					<div class="text-sm text-slate-400 mb-1">Quarterly Inflation</div>
					<div class="text-2xl font-bold {$gameState.economy.inflationRate >= 0 ? 'text-orange-400' : 'text-purple-400'}">
						{$gameState.economy.inflationRate >= 0 ? '+' : ''}{$gameState.economy.inflationRate.toFixed(2)}%
					</div>
					<div class="text-xs text-slate-400 mt-1">Property values {$gameState.economy.inflationRate >= 0 ? 'rising' : 'falling'}</div>
				</div>
				<div class="bg-slate-700 rounded-lg p-4">
					<div class="text-sm text-slate-400 mb-1">Economic Phase</div>
					<div class="text-2xl font-bold capitalize {
						$gameState.economy.economicPhase === 'recession' ? 'text-red-400' :
						$gameState.economy.economicPhase === 'recovery' ? 'text-yellow-400' :
						$gameState.economy.economicPhase === 'expansion' ? 'text-green-400' :
						'text-orange-400'
					}">
						{$gameState.economy.economicPhase}
					</div>
					<div class="text-xs text-slate-400 mt-1">Quarter {$gameState.economy.quartersSincePhaseChange + 1} in this phase</div>
				</div>
			</div>
		</div>

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
				onclick={() => switchView('staff')}
				class="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors {currentView === 'staff'
					? 'bg-blue-600 text-white'
					: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
			>
				Staff ({$gameState.staff.estateAgents.length + $gameState.staff.caretakers.length})
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

		<!-- Content Area -->
		{#if currentView === 'market'}
			<MarketView />
		{:else if currentView === 'portfolio'}
			<PortfolioView onSelectProperty={handleSelectProperty} />
		{:else if currentView === 'staff'}
			<StaffView />
		{:else if currentView === 'property-detail'}
			{#if selectedProperty}
				<PropertyDetail property={selectedProperty} />
			{:else}
				<div class="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
					<div class="text-6xl mb-4">🏠</div>
					<h2 class="text-2xl font-bold mb-2">Property No Longer Available</h2>
					<p class="text-slate-400 mb-6">This property has been sold or is no longer in your portfolio.</p>
					<button
						onclick={() => switchView('portfolio')}
						class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
					>
						Return to Portfolio
					</button>
				</div>
			{/if}
		{/if}

		<!-- Info -->
		<div class="mt-8 text-center text-slate-400 text-sm">
			<p>Game progress is automatically saved to your browser's local storage.</p>
			<p class="mt-1">Rent and interest are paid out on the 1st of each month.</p>
			<p class="mt-1">Interest on cash is calculated daily at {($gameState.economy.baseRate - 1).toFixed(2)}% APR (base rate minus 1%).</p>
			<p class="mt-1">Economic conditions update quarterly. Inflation affects property base values permanently.</p>
		</div>
	</div>
</div>
