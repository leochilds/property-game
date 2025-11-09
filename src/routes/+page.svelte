<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState } from '$lib/stores/gameState';
	import { TIME_SPEED_MS, BASE_RATE, BASE_FILL_CHANCE, type TimeSpeed, type RentMarkup, type TenancyPeriod, type Property, type GameDate } from '$lib/types/game';

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

	function handleVacantSettingsChange(propertyId: string, rentMarkup: RentMarkup, periodMonths: TenancyPeriod, autoRelist: boolean) {
		gameState.setPropertyVacantSettings(propertyId, rentMarkup, periodMonths, autoRelist);
	}

	function formatCurrency(amount: number): string {
		return `£${amount.toFixed(2)}`;
	}

	function formatDate(date: GameDate): string {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${date.day} ${monthNames[date.month - 1]} Year ${date.year}`;
	}

	function calculateMonthlyRent(property: Property): number {
		if (!property.tenancy) {
			// Show potential rent
			const annualRate = BASE_RATE + property.vacantSettings.rentMarkup;
			const annualRent = (property.baseValue * annualRate) / 100;
			return annualRent / 12;
		}
		const annualRate = BASE_RATE + property.tenancy.rentMarkup;
		const annualRent = (property.baseValue * annualRate) / 100;
		return annualRent / 12;
	}

	function calculateFillChance(rentMarkup: RentMarkup): number {
		if (rentMarkup < 5) {
			return BASE_FILL_CHANCE + 1;
		} else if (rentMarkup <= 6) {
			return BASE_FILL_CHANCE;
		} else {
			return BASE_FILL_CHANCE - 1;
		}
	}

	function calculateDaysRemaining(currentDate: GameDate, endDate: GameDate): number {
		// Simple approximation
		const currentDays = currentDate.year * 365 + currentDate.month * 30 + currentDate.day;
		const endDays = endDate.year * 365 + endDate.month * 30 + endDate.day;
		return Math.max(0, endDays - currentDays);
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

		<!-- Properties -->
		<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
			<h2 class="text-xl font-bold mb-4">Your Properties</h2>
			<div class="space-y-4">
				{#each $gameState.player.properties as property}
					<div class="bg-slate-700 rounded-lg p-4 border border-slate-600">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h3 class="text-lg font-bold">{property.name}</h3>
								<span class="text-slate-400 text-sm">Value: {formatCurrency(property.baseValue)}</span>
							</div>
							<div class="text-right">
								{#if property.tenancy}
									<span class="inline-block px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
										🏠 OCCUPIED
									</span>
								{:else}
									<span class="inline-block px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-semibold">
										📭 VACANT
									</span>
								{/if}
							</div>
						</div>

						{#if property.tenancy}
							<!-- Occupied Property -->
							<div class="space-y-3 mt-4">
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span class="text-slate-400">Monthly Rent:</span>
										<span class="ml-2 text-green-400 font-semibold">
											{formatCurrency(calculateMonthlyRent(property))}
										</span>
										<span class="text-slate-500 text-xs ml-1">
											(Base {BASE_RATE}% + {property.tenancy.rentMarkup}%)
										</span>
									</div>
									<div>
										<span class="text-slate-400">Total Earned:</span>
										<span class="ml-2 text-green-400 font-semibold">
											{formatCurrency(property.totalIncomeEarned)}
										</span>
									</div>
								</div>
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span class="text-slate-400">Lease Period:</span>
										<span class="ml-2 font-semibold">
											{property.tenancy.periodMonths} months
										</span>
									</div>
									<div>
										<span class="text-slate-400">Days Remaining:</span>
										<span class="ml-2 font-semibold">
											{calculateDaysRemaining($gameState.gameTime.currentDate, property.tenancy.endDate)}
										</span>
									</div>
								</div>
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span class="text-slate-400">Lease Started:</span>
										<span class="ml-2 font-semibold">
											{formatDate(property.tenancy.startDate)}
										</span>
									</div>
									<div>
										<span class="text-slate-400">Lease Ends:</span>
										<span class="ml-2 font-semibold">
											{formatDate(property.tenancy.endDate)}
										</span>
									</div>
								</div>
								<div class="mt-3 pt-3 border-t border-slate-600">
									<label class="flex items-center gap-2 text-sm cursor-pointer">
										<input
											type="checkbox"
											checked={property.vacantSettings.autoRelist}
											onchange={(e) => handleVacantSettingsChange(
												property.id,
												property.vacantSettings.rentMarkup,
												property.vacantSettings.periodMonths,
												e.currentTarget.checked
											)}
											class="w-4 h-4"
										/>
										<span class="text-slate-300">Auto-relist when lease ends</span>
									</label>
								</div>
							</div>
						{:else}
							<!-- Vacant Property -->
							<div class="space-y-4 mt-4">
								<div class="grid grid-cols-1 gap-4">
									<div>
										<label class="block text-sm text-slate-400 mb-2">
											Rent Rate (Base {BASE_RATE}% + Markup)
										</label>
										<div class="flex items-center gap-3">
											<input
												type="range"
												min="1"
												max="10"
												value={property.vacantSettings.rentMarkup}
												oninput={(e) => handleVacantSettingsChange(
													property.id,
													parseInt(e.currentTarget.value) as RentMarkup,
													property.vacantSettings.periodMonths,
													property.vacantSettings.autoRelist
												)}
												class="flex-1"
											/>
											<span class="font-semibold text-lg w-16 text-center">
												+{property.vacantSettings.rentMarkup}%
											</span>
										</div>
										<div class="mt-2 text-sm">
											<span class="text-slate-400">Monthly Rent:</span>
											<span class="ml-2 text-green-400 font-semibold">
												{formatCurrency(calculateMonthlyRent(property))}
											</span>
											<span class="text-slate-500 text-xs ml-2">
												(Total: {BASE_RATE + property.vacantSettings.rentMarkup}%)
											</span>
										</div>
										<div class="mt-1 text-sm">
											<span class="text-slate-400">Fill Chance:</span>
											<span class="ml-2 font-semibold {
												calculateFillChance(property.vacantSettings.rentMarkup) > BASE_FILL_CHANCE
													? 'text-green-400'
													: calculateFillChance(property.vacantSettings.rentMarkup) < BASE_FILL_CHANCE
													? 'text-red-400'
													: 'text-yellow-400'
											}">
												{calculateFillChance(property.vacantSettings.rentMarkup)}% per day
											</span>
										</div>
									</div>
									<div>
										<label class="block text-sm text-slate-400 mb-2">
											Lease Period
										</label>
										<div class="flex gap-2 flex-wrap">
											{#each [6, 12, 18, 24, 36] as period}
												<button
													onclick={() => handleVacantSettingsChange(
														property.id,
														property.vacantSettings.rentMarkup,
														period as TenancyPeriod,
														property.vacantSettings.autoRelist
													)}
													class="px-4 py-2 rounded-lg font-semibold transition-colors {property.vacantSettings.periodMonths === period
														? 'bg-blue-600'
														: 'bg-slate-600 hover:bg-slate-500'}"
												>
													{period}m
												</button>
											{/each}
										</div>
									</div>
									<div>
										<label class="flex items-center gap-2 text-sm cursor-pointer">
											<input
												type="checkbox"
												checked={property.vacantSettings.autoRelist}
												onchange={(e) => handleVacantSettingsChange(
													property.id,
													property.vacantSettings.rentMarkup,
													property.vacantSettings.periodMonths,
													e.currentTarget.checked
												)}
												class="w-4 h-4"
											/>
											<span class="text-slate-300">Auto-relist when lease ends</span>
										</label>
									</div>
								</div>
								<div class="bg-slate-600 rounded p-3 text-sm text-slate-300">
									<p>💡 Property is currently trying to attract tenants with these settings.</p>
									<p class="mt-1 text-xs text-slate-400">
										Higher rent = slower filling | Lower rent = faster filling
									</p>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Info -->
		<div class="mt-8 text-center text-slate-400 text-sm">
			<p>Game progress is automatically saved to your browser's local storage.</p>
			<p class="mt-1">Rent is collected on the 1st of each month from occupied properties.</p>
		</div>
	</div>
</div>
