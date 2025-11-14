<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import { formatCurrency } from '$lib/utils/format';
	import type { Property, Mortgage, MortgageType, DepositPercentage, TermLength, FixedPeriod } from '$lib/types/game';
	import { DEPOSIT_RATE_PREMIUMS, BTL_RATE_PREMIUM } from '$lib/types/game';

	export let property: Property;
	export let mortgage: Mortgage;
	export let onClose: () => void;

	let mortgageType: MortgageType = mortgage.mortgageType;
	let depositPercentage: DepositPercentage = 25;
	let termLength: TermLength = 25;
	let fixedPeriod: FixedPeriod = 2;

	$: currentValue = property.baseValue * (property.maintenance / 100);
	$: equity = currentValue - mortgage.outstandingBalance;
	$: depositAmount = currentValue * (depositPercentage / 100);
	$: loanAmount = currentValue - depositAmount;
	$: canRemortgage = equity >= depositAmount;
	$: depositPremium = DEPOSIT_RATE_PREMIUMS[depositPercentage];
	$: btlPremium = mortgageType === 'btl' ? BTL_RATE_PREMIUM : 0;
	$: newInterestRate = $gameState.economy.baseRate + depositPremium + btlPremium;
	$: monthlyPayment = calculateMonthlyPayment(loanAmount, newInterestRate, termLength, mortgageType);

	function calculateMonthlyPayment(
		loan: number,
		rate: number,
		years: TermLength,
		type: MortgageType
	): number {
		if (type === 'btl') {
			// BTL: Interest only
			return (loan * rate / 100) / 12;
		}
		
		// Standard: Amortization
		const monthlyRate = rate / 100 / 12;
		const numPayments = years * 12;
		return loan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
			(Math.pow(1 + monthlyRate, numPayments) - 1);
	}

	function handleConfirm() {
		if (!canRemortgage) return;
		
		gameState.remortgageProperty(
			property.id,
			mortgageType,
			depositPercentage,
			termLength,
			fixedPeriod
		);
		onClose();
	}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-slate-800 rounded-lg border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
		<div class="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
			<h2 class="text-2xl font-bold">Remortgage Property</h2>
			<button
				onclick={onClose}
				class="text-slate-400 hover:text-white transition-colors text-2xl"
			>
				×
			</button>
		</div>

		<div class="p-6 space-y-6">
			<!-- Property & Current Mortgage Info -->
			<div class="bg-slate-700 rounded-lg p-4">
				<h3 class="font-bold text-lg mb-2">{property.name}</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<div class="text-slate-400">Current Value:</div>
						<div class="font-semibold text-green-400">{formatCurrency(currentValue)}</div>
					</div>
					<div>
						<div class="text-slate-400">Current Mortgage:</div>
						<div class="font-semibold text-red-400">{formatCurrency(mortgage.outstandingBalance)}</div>
					</div>
					<div>
						<div class="text-slate-400">Available Equity:</div>
						<div class="font-semibold {equity >= 0 ? 'text-green-400' : 'text-red-400'}">
							{formatCurrency(equity)}
						</div>
					</div>
					<div>
						<div class="text-slate-400">Current Rate:</div>
						<div class="font-semibold text-blue-400">{mortgage.interestRate.toFixed(2)}%</div>
					</div>
				</div>
			</div>

			{#if equity < 0}
				<div class="bg-red-900/20 border border-red-600 rounded-lg p-4">
					<div class="text-red-400 font-bold mb-2">❌ Negative Equity</div>
					<p class="text-sm text-slate-300">
						Your property value ({formatCurrency(currentValue)}) is less than your outstanding mortgage ({formatCurrency(mortgage.outstandingBalance)}).
						You cannot remortgage while in negative equity.
					</p>
				</div>
			{:else}
				<!-- Mortgage Type -->
				<div>
					<label class="block text-sm font-semibold mb-2">Mortgage Type</label>
					<div class="grid grid-cols-2 gap-4">
						<button
							onclick={() => mortgageType = 'standard'}
							class="p-4 rounded-lg border-2 transition-colors {mortgageType === 'standard'
								? 'border-blue-500 bg-blue-900/30'
								: 'border-slate-600 bg-slate-700 hover:border-slate-500'}"
						>
							<div class="font-bold mb-1">Standard Mortgage</div>
							<div class="text-xs text-slate-400">Repay principal + interest</div>
							<div class="text-xs text-slate-400 mt-1">Base rate only</div>
						</button>
						<button
							onclick={() => mortgageType = 'btl'}
							class="p-4 rounded-lg border-2 transition-colors {mortgageType === 'btl'
								? 'border-blue-500 bg-blue-900/30'
								: 'border-slate-600 bg-slate-700 hover:border-slate-500'}"
						>
							<div class="font-bold mb-1">Buy-to-Let (BTL)</div>
							<div class="text-xs text-slate-400">Interest only</div>
							<div class="text-xs text-amber-400 mt-1">+{BTL_RATE_PREMIUM}% rate premium</div>
						</button>
					</div>
				</div>

				<!-- Deposit (Equity) -->
				<div>
					<label class="block text-sm font-semibold mb-2">Equity as Deposit</label>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
						{#each [10, 25, 50, 75] as percentage}
							{@const requiredEquity = currentValue * (percentage / 100)}
							{@const hasEnough = equity >= requiredEquity}
							<button
								onclick={() => depositPercentage = percentage as DepositPercentage}
								disabled={!hasEnough}
								class="p-3 rounded-lg border-2 transition-colors {depositPercentage === percentage
									? 'border-blue-500 bg-blue-900/30'
									: hasEnough
										? 'border-slate-600 bg-slate-700 hover:border-slate-500'
										: 'border-slate-700 bg-slate-800 cursor-not-allowed opacity-50'}"
							>
								<div class="font-bold">{percentage}%</div>
								<div class="text-xs text-slate-400">+{DEPOSIT_RATE_PREMIUMS[percentage as DepositPercentage]}% rate</div>
								{#if !hasEnough}
									<div class="text-xs text-red-400 mt-1">Need {formatCurrency(requiredEquity - equity)} more</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Term Length -->
				<div>
					<label class="block text-sm font-semibold mb-2">Term Length</label>
					<div class="grid grid-cols-5 gap-2">
						{#each [10, 15, 20, 25, 30] as years}
							<button
								onclick={() => termLength = years as TermLength}
								class="p-3 rounded-lg border-2 transition-colors {termLength === years
									? 'border-blue-500 bg-blue-900/30'
									: 'border-slate-600 bg-slate-700 hover:border-slate-500'}"
							>
								<div class="font-bold">{years}y</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Fixed Period -->
				<div>
					<label class="block text-sm font-semibold mb-2">Fixed Rate Period</label>
					<div class="grid grid-cols-3 gap-4">
						{#each [2, 3, 5] as years}
							<button
								onclick={() => fixedPeriod = years as FixedPeriod}
								class="p-3 rounded-lg border-2 transition-colors {fixedPeriod === years
									? 'border-blue-500 bg-blue-900/30'
									: 'border-slate-600 bg-slate-700 hover:border-slate-500'}"
							>
								<div class="font-bold">{years} Years</div>
								<div class="text-xs text-slate-400">Then variable</div>
							</button>
						{/each}
					</div>
					<p class="text-xs text-slate-400 mt-2">After fixed period, rate adjusts with base rate</p>
				</div>

				<!-- New Mortgage Summary -->
				<div class="bg-slate-700 rounded-lg p-4 space-y-2">
					<h3 class="font-bold text-lg mb-3">New Mortgage Summary</h3>
					<div class="grid grid-cols-2 gap-2 text-sm">
						<div class="text-slate-400">Property Value:</div>
						<div class="font-semibold text-right">{formatCurrency(currentValue)}</div>
						
						<div class="text-slate-400">Equity Used ({depositPercentage}%):</div>
						<div class="font-semibold text-right text-yellow-400">{formatCurrency(depositAmount)}</div>
						
						<div class="text-slate-400">New Loan Amount:</div>
						<div class="font-semibold text-right">{formatCurrency(loanAmount)}</div>
						
						<div class="text-slate-400">New Interest Rate:</div>
						<div class="font-semibold text-right text-blue-400">{newInterestRate.toFixed(2)}%</div>
						
						<div class="text-slate-400">Old Interest Rate:</div>
						<div class="font-semibold text-right text-slate-400">{mortgage.interestRate.toFixed(2)}%</div>
						
						<div class="text-slate-400">New Monthly Payment:</div>
						<div class="font-semibold text-right text-green-400">{formatCurrency(monthlyPayment)}</div>
						
						{#if mortgageType === 'btl'}
							<div class="col-span-2 text-xs text-amber-400 mt-2">
								⚠️ BTL: Interest only - loan balance never decreases
							</div>
						{/if}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-4">
					<button
						onclick={handleConfirm}
						disabled={!canRemortgage}
						class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
					>
						{#if !canRemortgage}
							Insufficient Equity
						{:else}
							Confirm Remortgage
						{/if}
					</button>
					<button
						onclick={onClose}
						class="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors"
					>
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
