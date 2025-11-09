<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState } from '$lib/stores/gameState';
	import { TIME_SPEED_MS, type TimeSpeed } from '$lib/types/game';

	let timer: ReturnType<typeof setInterval> | null = null;

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
		}
	}

	function formatCurrency(amount: number): string {
		return `£${amount.toFixed(2)}`;
	}

	function formatDate(day: number): string {
		const month = Math.floor(day / 30) + 1;
		const dayOfMonth = (day % 30) + 1;
		const year = Math.floor(day / 365) + 1;
		return `Year ${year}, Month ${month}, Day ${dayOfMonth}`;
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
					<span class="font-semibold ml-2">{formatDate($gameState.gameTime.currentDay)}</span>
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

		<!-- Properties -->
		<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
			<h2 class="text-xl font-bold mb-4">Your Properties</h2>
			<div class="space-y-4">
				{#each $gameState.player.properties as property}
					<div class="bg-slate-700 rounded-lg p-4 border border-slate-600">
						<div class="flex justify-between items-start mb-2">
							<h3 class="text-lg font-bold">{property.name}</h3>
							<span class="text-slate-400">Value: {formatCurrency(property.baseValue)}</span>
						</div>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span class="text-slate-400">Monthly Income:</span>
								<span class="ml-2 text-green-400 font-semibold">
									{formatCurrency(property.monthlyIncome)}
								</span>
							</div>
							<div>
								<span class="text-slate-400">Total Earned:</span>
								<span class="ml-2 text-green-400 font-semibold">
									{formatCurrency(property.totalIncomeEarned)}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Info -->
		<div class="mt-8 text-center text-slate-400 text-sm">
			<p>Game progress is automatically saved to your browser's local storage.</p>
		</div>
	</div>
</div>
