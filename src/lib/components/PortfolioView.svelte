<script lang="ts">
	import type { Property, District } from '$lib/types/game';
	import { gameState } from '$lib/stores/gameState';
	import { calculateDaysRemaining } from '$lib/utils/date';
	import { formatCurrency } from '$lib/utils/format';
	import { DISTRICT_NAMES } from '$lib/types/game';

	export let onSelectProperty: (propertyId: string) => void;
	
	let selectedDistrict: District | 'all' = 'all';

	$: filteredProperties = selectedDistrict === 'all' 
		? $gameState.player.properties 
		: $gameState.player.properties.filter(p => p.district === selectedDistrict);
	
	$: districtCounts = $gameState.player.properties.reduce((acc, prop) => {
		acc[prop.district] = (acc[prop.district] || 0) + 1;
		return acc;
	}, {} as Record<District, number>);

	function calculateMarketValue(property: Property): number {
		return property.baseValue * (property.maintenance / 100);
	}

	function calculateMonthlyRent(property: Property): number {
		if (!property.tenancy) {
			const marketValue = calculateMarketValue(property);
			const annualRate = $gameState.economy.baseRate + property.vacantSettings.rentMarkup;
			const annualRent = (marketValue * annualRate) / 100;
			return annualRent / 12;
		}
		const annualRate = property.tenancy.baseRateAtStart + property.tenancy.rentMarkup;
		const annualRent = (property.tenancy.marketValueAtStart * annualRate) / 100;
		return annualRent / 12;
	}

	function getMaintenanceColor(maintenance: number): string {
		if (maintenance >= 75) return 'text-green-400';
		if (maintenance >= 50) return 'text-yellow-400';
		if (maintenance >= 25) return 'text-orange-400';
		return 'text-red-400';
	}

	function getPropertyStateInfo(property: Property): { badge: string; color: string; icon: string } {
		if (property.isUnderMaintenance) {
			return { badge: 'MAINTENANCE', color: 'bg-purple-600', icon: '🔧' };
		} else if (property.saleInfo) {
			return { badge: 'FOR SALE', color: 'bg-blue-600', icon: '🏷️' };
		} else if (property.tenancy) {
			return { badge: 'OCCUPIED', color: 'bg-green-600', icon: '🏠' };
		} else {
			return { badge: 'VACANT', color: 'bg-amber-600', icon: '📭' };
		}
	}

	function hasMortgage(propertyId: string): boolean {
		return $gameState.player.mortgages.some(m => m.propertyId === propertyId);
	}

	function getMortgageInfo(propertyId: string) {
		return $gameState.player.mortgages.find(m => m.propertyId === propertyId);
	}
</script>

<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
	<h2 class="text-xl font-bold mb-4">Your Properties ({$gameState.player.properties.length})</h2>
	
	<!-- District Tabs -->
	{#if $gameState.player.properties.length > 0}
		<div class="mb-4 border-b border-slate-600 overflow-x-auto">
			<div class="flex space-x-1 min-w-max">
				<button
					onclick={() => selectedDistrict = 'all'}
					class="px-4 py-2 -mb-px font-semibold transition-colors {selectedDistrict === 'all' 
						? 'border-b-2 border-blue-500 text-blue-400' 
						: 'text-slate-400 hover:text-slate-300'}"
				>
					All Districts ({$gameState.player.properties.length})
				</button>
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as district}
					{@const count = districtCounts[district as District] || 0}
					{#if count > 0}
						<button
							onclick={() => selectedDistrict = district as District}
							class="px-4 py-2 -mb-px font-semibold transition-colors whitespace-nowrap {selectedDistrict === district 
								? 'border-b-2 border-blue-500 text-blue-400' 
								: 'text-slate-400 hover:text-slate-300'}"
						>
							{district}: {DISTRICT_NAMES[district as District]} ({count})
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
	
	{#if filteredProperties.length === 0 && $gameState.player.properties.length === 0}
		<div class="text-center text-slate-400 py-8">
			<p class="text-lg">You don't own any properties yet</p>
			<p class="text-sm mt-2">Visit the Market to purchase your first property</p>
		</div>
	{:else if filteredProperties.length === 0}
		<div class="text-center text-slate-400 py-8">
			<p class="text-lg">No properties in this district</p>
			<p class="text-sm mt-2">Try selecting a different district</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredProperties as property}
				{@const stateInfo = getPropertyStateInfo(property)}
				{@const marketValue = calculateMarketValue(property)}
				{@const valueChange = property.baseValue - property.purchaseBaseValue}
				{@const percentChange = ((valueChange / property.purchaseBaseValue) * 100)}
				<button
					onclick={() => onSelectProperty(property.id)}
					class="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all cursor-pointer text-left"
				>
					<div class="flex justify-between items-start mb-3">
						<div class="flex-1">
							<h3 class="text-lg font-bold">{property.name}</h3>
							<div class="text-xs text-slate-400 mt-1">
								<span class="font-semibold text-indigo-400">{DISTRICT_NAMES[property.district]}</span>
								<span class="ml-2">District {property.district}</span>
							</div>
							{#if hasMortgage(property.id)}
								<div class="mt-1">
									<span class="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-xs font-semibold">
										🏦 MORTGAGED
									</span>
								</div>
							{/if}
						</div>
						<span class="inline-block px-2 py-1 {stateInfo.color} text-white rounded text-xs font-semibold whitespace-nowrap ml-2">
							{stateInfo.icon} {stateInfo.badge}
						</span>
					</div>
					
					<div class="space-y-2 text-sm">
						<div>
							<span class="text-slate-400">Value:</span>
							<span class="ml-2 font-semibold {getMaintenanceColor(property.maintenance)}">
								{formatCurrency(marketValue)}
							</span>
							{#if valueChange !== 0}
								<span class="ml-1 text-xs {valueChange >= 0 ? 'text-green-400' : 'text-red-400'}">
									({valueChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
								</span>
							{/if}
						</div>
						
						<div>
							<span class="text-slate-400">Maintenance:</span>
							<span class="ml-2 font-semibold {getMaintenanceColor(property.maintenance)}">
								{property.maintenance.toFixed(1)}%
							</span>
						</div>
						
						{#if property.tenancy}
							<div>
								<span class="text-slate-400">Rent:</span>
								<span class="ml-2 font-semibold text-green-400">
									{formatCurrency(calculateMonthlyRent(property))}/mo
								</span>
							</div>
							<div>
								<span class="text-slate-400">Days Left:</span>
								<span class="ml-2 font-semibold">
									{calculateDaysRemaining($gameState.gameTime.currentDate, property.tenancy.endDate)}
								</span>
							</div>
						{:else if property.isUnderMaintenance}
							<div class="text-purple-400 text-xs">
								In progress...
							</div>
						{:else if property.saleInfo}
							<div>
								<span class="text-slate-400">Asking:</span>
								<span class="ml-2 font-semibold text-green-400">
									{formatCurrency(marketValue * (property.saleInfo.askingPricePercentage / 100))}
								</span>
							</div>
							<div>
								<span class="text-slate-400">Days Listed:</span>
								<span class="ml-2 font-semibold">
									{property.saleInfo.daysOnMarket}
								</span>
							</div>
						{:else}
							<div class="text-amber-400 text-xs">
								Seeking tenants...
							</div>
						{/if}

						{#if hasMortgage(property.id)}
							{@const mortgage = getMortgageInfo(property.id)}
							{#if mortgage}
								<div class="mt-2 pt-2 border-t border-slate-600">
									<div>
										<span class="text-slate-400">Mortgage:</span>
										<span class="ml-2 font-semibold text-red-400">
											{formatCurrency(mortgage.outstandingBalance)}
										</span>
									</div>
									<div>
										<span class="text-slate-400">Rate:</span>
										<span class="ml-2 font-semibold text-blue-400">
											{mortgage.interestRate.toFixed(2)}%
										</span>
									</div>
								</div>
							{/if}
						{/if}
					</div>
					
					<div class="mt-3 pt-3 border-t border-slate-600 text-xs text-slate-400">
						Click to manage →
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
