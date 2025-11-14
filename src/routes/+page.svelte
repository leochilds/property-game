<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { gameState } from '$lib/stores/gameState';
	import { TIME_SPEED_MS, type TimeSpeed } from '$lib/types/game';
	import MarketView from '$lib/components/MarketView.svelte';
	import AuctionView from '$lib/components/AuctionView.svelte';
	import PortfolioView from '$lib/components/PortfolioView.svelte';
	import PropertyDetail from '$lib/components/PropertyDetail.svelte';
	import StaffView from '$lib/components/StaffView.svelte';
	import MortgageView from '$lib/components/MortgageView.svelte';
	import OverallBalanceSheetView from '$lib/components/OverallBalanceSheetView.svelte';
	import BalanceSheetModal from '$lib/components/BalanceSheetModal.svelte';
	import GameOverModal from '$lib/components/GameOverModal.svelte';
	import GameWinModal from '$lib/components/GameWinModal.svelte';
	import PrestigeModal from '$lib/components/PrestigeModal.svelte';
	import ForeclosureWarningBanner from '$lib/components/ForeclosureWarningBanner.svelte';
	import DevToolsModal from '$lib/components/DevToolsModal.svelte';
	import HelpModal from '$lib/components/HelpModal.svelte';
	import { formatCurrency } from '$lib/utils/format';

	type View = 'market' | 'auction' | 'portfolio' | 'staff' | 'mortgages' | 'balance-sheet' | 'property-detail';
	
	let currentView: View = 'portfolio';
	let selectedPropertyId: string | null = null;
	let timer: ReturnType<typeof setInterval> | null = null;
	let showDevTools = false;
	let showHelpModal = false;

	$: selectedProperty = selectedPropertyId 
		? $gameState.player.properties.find(p => p.id === selectedPropertyId) 
		: null;

	// Restart timer when speed changes
	$: if (timer !== null) {
		startTimer();
	}
	
	// Also watch for speed changes directly
	$: $gameState.gameTime.speed, restartTimerIfNeeded();
	
	function restartTimerIfNeeded() {
		if (timer !== null && !$gameState.gameTime.isPaused) {
			startTimer();
		}
	}

	function startTimer() {
		if (timer) clearInterval(timer);

		const speed = $gameState.gameTime.speed;
		// Calculate interval dynamically: base 2000ms (1x speed) divided by speed multiplier
		const interval = 2000 / speed;

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

	function handleKeyDown(event: KeyboardEvent) {
		// Ctrl+Shift+D or Cmd+Shift+D to toggle dev tools
		if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
			event.preventDefault();
			showDevTools = !showDevTools;
		}
	}

	onMount(() => {
		startTimer();
		if (browser) {
			window.addEventListener('keydown', handleKeyDown);
		}
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
		if (browser) {
			window.removeEventListener('keydown', handleKeyDown);
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
	<!-- Foreclosure Warning Banner -->
	{#if $gameState.foreclosureWarning}
		<ForeclosureWarningBanner foreclosureWarning={$gameState.foreclosureWarning} />
	{/if}
	
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<header class="mb-8">
			<div class="flex items-start justify-between mb-2">
				<h1 class="text-4xl font-bold">Property Management Game</h1>
				
				<!-- Prestige Level Indicator -->
				{#if $gameState.prestigeLevel > 0}
					<div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg px-4 py-2 border-2 border-purple-400 shadow-lg">
						<div class="flex items-center gap-2">
							<span class="text-2xl">✨</span>
							<div>
								<div class="text-xs text-purple-200 uppercase tracking-wide font-semibold">Prestige</div>
								<div class="text-2xl font-bold text-white leading-tight">Level {$gameState.prestigeLevel}</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
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
					<div class="text-xs text-slate-400 mt-1">Base rate for mortgages and interest</div>
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
			<h2 class="text-xl font-bold mb-4">Game Controls</h2>
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

				<div class="flex items-center gap-2">
					<span class="text-slate-400">Default Rent:</span>
					<input
						type="number"
						min="1"
						max="10"
						step="0.1"
						value={$gameState.settings.defaultRentMarkup}
						onchange={(e) => gameState.setDefaultRentMarkup(parseFloat(e.currentTarget.value))}
						class="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<span class="text-slate-400">%</span>
				</div>

				{#if $gameState.canPrestigeNow}
					<button
						onclick={() => gameState.openPrestigeModal()}
						class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors ml-auto"
					>
						✨ Prestige Now
					</button>
				{/if}
				
				<button
					onclick={handleReset}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors {$gameState.canPrestigeNow ? '' : 'ml-auto'}"
				>
					Reset Game
				</button>
			</div>
			<div class="mt-4 text-sm text-slate-400">
				<p>Speed multiplier: 1x = 2 seconds per day</p>
				<p class="mt-1">Default Rent: Target rent markup for all properties when they become vacant (estate agents adjust from this baseline)</p>
			</div>
		</div>

		<!-- Navigation Tabs -->
		<div class="bg-slate-800 rounded-lg p-2 mb-8 border border-slate-700 flex gap-2 flex-wrap">
			<button
				onclick={() => switchView('portfolio')}
				class="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors {currentView === 'portfolio'
					? 'bg-blue-600 text-white'
					: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
			>
				Portfolio ({$gameState.player.properties.length})
			</button>
			<button
				onclick={() => switchView('balance-sheet')}
				class="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors {currentView === 'balance-sheet'
					? 'bg-blue-600 text-white'
					: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
			>
				📊 Balance Sheet ({$gameState.balanceSheetHistory.length})
			</button>
			<button
				onclick={() => switchView('mortgages')}
				class="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors {currentView === 'mortgages'
					? 'bg-blue-600 text-white'
					: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
			>
				Mortgages ({$gameState.player.mortgages.length})
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
			<button
				onclick={() => switchView('auction')}
				class="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors {currentView === 'auction'
					? 'bg-amber-600 text-white'
					: 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
			>
				🔨 Auction ({$gameState.auctionMarket.length}/5)
			</button>
		</div>

		<!-- Content Area -->
		{#if currentView === 'market'}
			<MarketView />
		{:else if currentView === 'auction'}
			<AuctionView />
		{:else if currentView === 'portfolio'}
			<PortfolioView onSelectProperty={handleSelectProperty} />
		{:else if currentView === 'balance-sheet'}
			<OverallBalanceSheetView />
		{:else if currentView === 'mortgages'}
			<MortgageView />
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

		<!-- Footer -->
		<footer class="mt-12 pt-6 border-t border-slate-700 text-center">
			<div class="bg-slate-800/50 rounded-lg p-4 inline-block">
				<p class="text-slate-400 text-sm mb-2">
					<span class="font-semibold text-slate-300">Alpha v0.0.1</span>
				</p>
				<p class="text-slate-500 text-xs">
					⚠️ This is an alpha version. Expect bugs and breaking changes between versions.
				</p>
			</div>
		</footer>
	</div>
</div>

<!-- Fixed Help Button -->
<button
	onclick={() => showHelpModal = true}
	class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transition-all hover:scale-110 z-40"
	title="Help & Feedback"
>
	?
</button>

<!-- Balance Sheet Modal -->
{#if $gameState.gameTime.showBalanceSheetModal}
	<BalanceSheetModal />
{/if}

<!-- Game Over Modal -->
{#if $gameState.gameOver}
	<GameOverModal gameOver={$gameState.gameOver} />
{/if}

<!-- Game Win Modal -->
{#if $gameState.gameWin}
	<GameWinModal />
{/if}

<!-- Prestige Modal -->
{#if $gameState.canPrestigeNow}
	<PrestigeModal />
{/if}

<!-- Dev Tools Modal -->
{#if showDevTools}
	<DevToolsModal onClose={() => showDevTools = false} />
{/if}

<!-- Help Modal -->
{#if showHelpModal}
	<HelpModal onClose={() => showHelpModal = false} />
{/if}
