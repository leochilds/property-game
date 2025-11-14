<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import { formatCurrency } from '$lib/utils/format';
	import type { MarketProperty, MortgageType, DepositPercentage, TermLength, FixedPeriod } from '$lib/types/game';
	import { DEPOSIT_RATE_PREMIUMS, BTL_RATE_PREMIUM } from '$lib/types/game';

	export let marketProperty: MarketProperty;
	export let onClose: () => void;

	let mortgageType: MortgageType = 'standard';
	let depositPercentage: DepositPercentage = 25;
	let termLength: TermLength = 25;
	let fixedPeriod: FixedPeriod = 2;

	$: marketValue = marketProperty.baseValue * (0.5 + marketProperty.maintenance / 200);
	$: depositAmount = marketValue * (depositPercentage / 100);
	$: loanAmount = marketValue - depositAmount;
	$: depositPremium = DEPOSIT_RATE_PREMIUMS[depositPercentage];
	$: btlPremium = mortgageType === 'btl' ? BTL_RATE_PREMIUM : 0;
	$: interestRate = $gameState.economy.baseRate + depositPremium + btlPremium;
	$: monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, termLength, mortgageType);
	$: canAfford = $gameState.player.cash >= depositAmount;

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
		if (!canAfford) return;
		
		gameState.buyPropertyWithMortgage(
			marketProperty.id,
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
			<h2 class="text-2xl font-bold">Finance Property Purchase</h2>
			<button
				onclick={onClose}
				class="text-slate-400 hover:text-white transition-colors text-2xl"
			>
				×
			</button>
		</div>

		<div class="p-6 space-y-6">
			<!-- Property Info -->
			<div class="bg-slate-700 rounded-lg p-4">
				<h3 class="font-bold text-lg mb-2">{marketProperty.features.bedrooms}-Bed Property</h3>
				<div class="space-y-1 text-sm">
					<div>
						<span class="text-slate-400">Location:</span>
						<span class="ml-2 font-semibold">{marketProperty.area}, District {marketProperty.district}</span>
					</div>
					<div>
						<span class="text-slate-400">Base Value:</span>
						<span class="ml-2 font-semibold">{formatCurrency(marketProperty.baseValue)}</span>
					</div>
					<div>
						<span class="text-slate-400">Maintenance:</span>
						<span class="ml-2 font-semibold">{marketProperty.maintenance.toFixed(1)}%</span>
					</div>
					<div>
						<span class="text-slate-400">Market Value:</span>
						<span class="ml-2 font-semibold text-green-400">{formatCurrency(marketValue)}</span>
					</div>
				</div>
			</div>

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

			<!-- Deposit -->
			<div>
				<label class="block text-sm font-semibold mb-2">Deposit Amount</label>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
					{#each [10, 25, 50, 75] as percentage}
						<button
							onclick={() => depositPercentage = percentage as DepositPercentage}
							class="p-3 rounded-lg border-2 transition-colors {depositPercentage === percentage
								? 'border-blue-500 bg-blue-900/30'
								: 'border-slate-600 bg-slate-700 hover:border-slate-500'}"
						>
							<div class="font-bold">{percentage}%</div>
							<div class="text-xs text-slate-400">+{DEPOSIT_RATE_PREMIUMS[percentage as DepositPercentage]}% rate</div>
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

			<!-- Summary -->
			<div class="bg-slate-700 rounded-lg p-4 space-y-2">
				<h3 class="font-bold text-lg mb-3">Mortgage Summary</h3>
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div class="text-slate-400">Property Value:</div>
					<div class="font-semibold text-right">{formatCurrency(marketValue)}</div>
					
					<div class="text-slate-400">Deposit ({depositPercentage}%):</div>
					<div class="font-semibold text-right text-yellow-400">{formatCurrency(depositAmount)}</div>
					
					<div class="text-slate-400">Loan Amount:</div>
					<div class="font-semibold text-right">{formatCurrency(loanAmount)}</div>
					
					<div class="text-slate-400">Interest Rate:</div>
					<div class="font-semibold text-right text-blue-400">{interestRate.toFixed(2)}%</div>
					
					<div class="text-slate-400">Monthly Payment:</div>
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
					disabled={!canAfford}
					class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
				>
					{#if !canAfford}
						Insufficient Funds (Need {formatCurrency(depositAmount)})
					{:else}
						Confirm Purchase
					{/if}
				</button>
				<button
					onclick={onClose}
					class="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</div>
