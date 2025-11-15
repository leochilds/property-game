<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import { formatCurrency } from '$lib/utils/format';
	import { formatDate } from '$lib/utils/date';
	import type { Mortgage } from '$lib/types/game';
	import RemortgageModal from './RemortgageModal.svelte';

	let showRemortgageModal = false;
	let selectedMortgageForRemortgage: Mortgage | null = null;

	function calculateEquity(mortgage: Mortgage): number {
		const property = $gameState.player.properties.find(p => p.id === mortgage.propertyId);
		if (!property) return 0;
		
		const currentValue = property.baseValue * (property.maintenance / 100);
		return currentValue - mortgage.outstandingBalance;
	}

	function handlePayOff(mortgageId: string) {
		const mortgage = $gameState.player.mortgages.find(m => m.id === mortgageId);
		if (!mortgage) return;
		
		const confirmMessage = `Pay off mortgage for ${mortgage.propertyName}?\n\nCost: ${formatCurrency(mortgage.outstandingBalance)}`;
		if (confirm(confirmMessage)) {
			gameState.payOffMortgage(mortgageId);
		}
	}

	function isOnVariableRate(mortgage: Mortgage): boolean {
		const { year: currentYear, month: currentMonth, day: currentDay } = $gameState.gameTime.currentDate;
		const { year: endYear, month: endMonth, day: endDay } = mortgage.fixedPeriodEndDate;
		
		if (currentYear > endYear) return true;
		if (currentYear === endYear && currentMonth > endMonth) return true;
		if (currentYear === endYear && currentMonth === endMonth && currentDay >= endDay) return true;
		return false;
	}

	$: totalOutstanding = $gameState.player.mortgages.reduce((sum, m) => sum + m.outstandingBalance, 0);
	$: totalMonthlyPayment = $gameState.player.mortgages.reduce((sum, m) => {
		if (m.mortgageType === 'standard') {
			return sum + m.monthlyPayment;
		} else {
			// BTL - interest only
			return sum + (m.outstandingBalance * m.interestRate / 100) / 12;
		}
	}, 0);

	function handleOpenRemortgageModal(mortgage: Mortgage) {
		selectedMortgageForRemortgage = mortgage;
		showRemortgageModal = true;
		gameState.togglePause(); // Auto-pause game
	}

	function handleCloseRemortgageModal() {
		showRemortgageModal = false;
		selectedMortgageForRemortgage = null;
		if ($gameState.gameTime.isPaused) {
			gameState.togglePause(); // Resume game
		}
	}
</script>

<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
	<h2 class="text-xl font-bold mb-4">Mortgages ({$gameState.player.mortgages.length})</h2>

	{#if $gameState.player.mortgages.length === 0}
		<div class="text-center text-slate-400 py-8">
			<div class="text-6xl mb-4">🏦</div>
			<p class="text-lg mb-2">No Active Mortgages</p>
			<p class="text-sm">Purchase properties with finance from the Market tab</p>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
			<div class="bg-slate-700 rounded-lg p-4">
				<div class="text-sm text-slate-400 mb-1">Total Outstanding</div>
				<div class="text-2xl font-bold text-red-400">{formatCurrency(totalOutstanding)}</div>
			</div>
			<div class="bg-slate-700 rounded-lg p-4">
				<div class="text-sm text-slate-400 mb-1">Total Monthly Payment</div>
				<div class="text-2xl font-bold text-orange-400">{formatCurrency(totalMonthlyPayment)}</div>
			</div>
		</div>

		<!-- Mortgage List -->
		<div class="space-y-4">
			{#each $gameState.player.mortgages as mortgage}
				{@const property = $gameState.player.properties.find(p => p.id === mortgage.propertyId)}
				{@const equity = calculateEquity(mortgage)}
				{@const onVariableRate = isOnVariableRate(mortgage)}
				{@const monthlyInterest = (mortgage.outstandingBalance * mortgage.interestRate / 100) / 12}
				{@const canPayOff = $gameState.player.cash >= mortgage.outstandingBalance}
				
				<div class="bg-slate-700 rounded-lg p-4 border-2 {mortgage.mortgageType === 'btl' ? 'border-amber-600' : 'border-blue-600'}">
					{#if !mortgage.propertyId}
						<div class="mb-3 text-sm bg-orange-900/30 border border-orange-600 rounded p-3">
							<div class="font-bold text-orange-400 mb-1">⚠️ Orphaned Mortgage</div>
							<div class="text-xs text-orange-200">
								Property was sold but proceeds did not cover the full mortgage. This debt must still be paid monthly.
							</div>
						</div>
					{/if}
					<div class="flex justify-between items-start mb-3">
						<div>
							<h3 class="text-lg font-bold">{mortgage.propertyName || 'Unknown Property'}</h3>
							<div class="flex items-center gap-2 mt-1">
								<span class="px-2 py-0.5 rounded text-xs font-semibold {mortgage.mortgageType === 'btl' ? 'bg-amber-600' : 'bg-blue-600'}">
									{mortgage.mortgageType === 'btl' ? 'BTL (Interest Only)' : 'Standard'}
								</span>
								{#if !mortgage.propertyId}
									<span class="px-2 py-0.5 rounded text-xs font-semibold bg-orange-600">
										Property Sold
									</span>
								{/if}
								{#if onVariableRate}
									<span class="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-600">
										Variable Rate
									</span>
								{:else}
									<span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-600">
										Fixed Rate
									</span>
								{/if}
							</div>
						</div>
						{#if !property}
							<span class="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">
								Property Sold
							</span>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-4 text-sm mb-4">
						<div>
							<div class="text-slate-400">Original Loan:</div>
							<div class="font-semibold">{formatCurrency(mortgage.originalLoanAmount)}</div>
						</div>
						<div>
							<div class="text-slate-400">Outstanding:</div>
							<div class="font-semibold text-red-400">{formatCurrency(mortgage.outstandingBalance)}</div>
						</div>
						<div>
							<div class="text-slate-400">Interest Rate:</div>
							<div class="font-semibold text-blue-400">{mortgage.interestRate.toFixed(2)}%</div>
						</div>
						<div>
							<div class="text-slate-400">Monthly Payment:</div>
							<div class="font-semibold text-orange-400">
								{#if mortgage.mortgageType === 'btl'}
									{formatCurrency(monthlyInterest)} (interest)
								{:else}
									{formatCurrency(mortgage.monthlyPayment)}
								{/if}
							</div>
						</div>
						<div>
							<div class="text-slate-400">Term:</div>
							<div class="font-semibold">{mortgage.termLengthYears} years</div>
						</div>
						<div>
							<div class="text-slate-400">Fixed Until:</div>
							<div class="font-semibold {onVariableRate ? 'text-yellow-400' : 'text-green-400'}">
								{formatDate(mortgage.fixedPeriodEndDate)}
								{#if !onVariableRate}
									<span class="text-xs text-slate-400 ml-1">(Year {mortgage.fixedPeriodEndDate.year})</span>
								{/if}
							</div>
						</div>
						{#if property}
							<div>
								<div class="text-slate-400">Property Value:</div>
								<div class="font-semibold">{formatCurrency(property.baseValue * (property.maintenance / 100))}</div>
							</div>
							<div>
								<div class="text-slate-400">Equity:</div>
								<div class="font-semibold {equity >= 0 ? 'text-green-400' : 'text-red-400'}">
									{formatCurrency(equity)}
								</div>
							</div>
						{/if}
					</div>

					<div class="flex gap-2">
						<button
							onclick={() => handlePayOff(mortgage.id)}
							disabled={!canPayOff}
							class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-sm"
						>
							{#if canPayOff}
								Pay Off ({formatCurrency(mortgage.outstandingBalance)})
							{:else}
								Insufficient Funds
							{/if}
						</button>
						{#if property && equity >= 0}
							<button
								onclick={() => handleOpenRemortgageModal(mortgage)}
								class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-sm"
							>
								Remortgage
							</button>
						{:else if property}
							<button
								class="flex-1 px-4 py-2 bg-slate-600 cursor-not-allowed rounded-lg font-semibold text-sm"
								disabled
								title="Cannot remortgage - negative equity"
							>
								Negative Equity
							</button>
						{/if}
					</div>

					{#if onVariableRate}
						<div class="mt-3 text-xs text-yellow-400 bg-yellow-900/20 rounded p-2">
							⚠️ This mortgage is on a variable rate and will adjust with the base rate
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showRemortgageModal && selectedMortgageForRemortgage}
	{@const selectedMortgage = selectedMortgageForRemortgage}
	{@const property = $gameState.player.properties.find(p => p.id === selectedMortgage.propertyId)}
	{#if property}
		<RemortgageModal 
			property={property}
			mortgage={selectedMortgage}
			onClose={handleCloseRemortgageModal}
		/>
	{/if}
{/if}
