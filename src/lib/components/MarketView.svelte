<script lang="ts">
	import type { MarketProperty, PropertyType, GardenType, ParkingType, AreaRating, District } from '$lib/types/game';
	import { gameState } from '$lib/stores/gameState';
	import { BASE_RATE, DISTRICT_NAMES } from '$lib/types/game';

	let selectedOffers: { [key: string]: number} = {};
	let selectedDistrict: District | 'all' = 'all';

	$: filteredMarket = selectedDistrict === 'all' 
		? $gameState.propertyMarket 
		: $gameState.propertyMarket.filter(p => p.district === selectedDistrict);
	
	$: districtCounts = $gameState.propertyMarket.reduce((acc, prop) => {
		acc[prop.district] = (acc[prop.district] || 0) + 1;
		return acc;
	}, {} as Record<District, number>);

	function calculateMarketPropertyValue(marketProperty: MarketProperty): number {
		return marketProperty.baseValue * (marketProperty.maintenance / 100);
	}

	function calculateOfferAcceptanceChance(offerPercentage: number): number {
		return Math.pow(offerPercentage / 100, 10) * 100;
	}

	function getMaintenanceColor(maintenance: number): string {
		if (maintenance >= 75) return 'text-green-400';
		if (maintenance >= 50) return 'text-yellow-400';
		if (maintenance >= 25) return 'text-orange-400';
		return 'text-red-400';
	}

	function getMaintenanceLabel(maintenance: number): string {
		if (maintenance >= 75) return 'Good';
		if (maintenance >= 50) return 'Fair';
		if (maintenance >= 25) return 'Poor';
		return 'Critical';
	}

	function formatPropertyType(type: PropertyType): string {
		const typeNames: Record<PropertyType, string> = {
			flat: 'Flat',
			terraced: 'Terraced House',
			'semi-detached': 'Semi-Detached House',
			detached: 'Detached House'
		};
		return typeNames[type];
	}

	function formatGarden(garden: GardenType): string {
		const gardenNames: Record<GardenType, string> = {
			none: 'No Garden',
			small: 'Small Garden',
			large: 'Large Garden'
		};
		return gardenNames[garden];
	}

	function formatParking(parking: ParkingType): string {
		const parkingNames: Record<ParkingType, string> = {
			none: 'No Parking',
			street: 'Street Parking',
			driveway: 'Driveway',
			garage: 'Garage'
		};
		return parkingNames[parking];
	}

	function getRatingColor(rating: AreaRating): string {
		if (rating >= 4) return 'text-green-400';
		if (rating === 3) return 'text-yellow-400';
		return 'text-red-400';
	}

	function getRatingLabel(rating: AreaRating): string {
		const labels: Record<AreaRating, string> = {
			1: 'Poor',
			2: 'Below Avg',
			3: 'Average',
			4: 'Good',
			5: 'Excellent'
		};
		return labels[rating];
	}

	function formatCurrency(amount: number): string {
		return `£${amount.toFixed(2)}`;
	}

	function handleBuyInstant(marketPropertyId: string) {
		gameState.buyPropertyInstant(marketPropertyId);
	}

	function handleMakeOffer(marketPropertyId: string) {
		const offerPercentage = selectedOffers[marketPropertyId] || 95;
		gameState.makeOffer(marketPropertyId, offerPercentage);
		delete selectedOffers[marketPropertyId];
	}
</script>

<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
	<h2 class="text-xl font-bold mb-4">Property Market ({$gameState.propertyMarket.length}/10)</h2>
	
	<!-- District Tabs -->
	<div class="mb-4 border-b border-slate-600 overflow-x-auto">
		<div class="flex space-x-1 min-w-max">
			<button
				onclick={() => selectedDistrict = 'all'}
				class="px-4 py-2 -mb-px font-semibold transition-colors {selectedDistrict === 'all' 
					? 'border-b-2 border-blue-500 text-blue-400' 
					: 'text-slate-400 hover:text-slate-300'}"
			>
				All Districts ({$gameState.propertyMarket.length})
			</button>
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as district}
				{@const count = districtCounts[district as District] || 0}
				<button
					onclick={() => selectedDistrict = district as District}
					class="px-4 py-2 -mb-px font-semibold transition-colors whitespace-nowrap {selectedDistrict === district 
						? 'border-b-2 border-blue-500 text-blue-400' 
						: 'text-slate-400 hover:text-slate-300'}"
				>
					{district}: {DISTRICT_NAMES[district as District]} ({count})
				</button>
			{/each}
		</div>
	</div>
	
	{#if filteredMarket.length === 0}
		<div class="text-center text-slate-400 py-8">
			<p class="text-lg">No properties available{selectedDistrict !== 'all' ? ' in this district' : ' on the market'}</p>
			<p class="text-sm mt-2">New properties may appear sporadically (5% chance per day)</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each filteredMarket as marketProperty}
				{@const marketValue = calculateMarketPropertyValue(marketProperty)}
				{@const offerPercentage = selectedOffers[marketProperty.id] || 95}
				{@const offerAmount = marketValue * (offerPercentage / 100)}
				{@const acceptanceChance = calculateOfferAcceptanceChance(offerPercentage)}
				{@const area = $gameState.areas.find(a => a.name === marketProperty.area)}
				<div class="bg-slate-700 rounded-lg p-4 border border-slate-600">
					<div class="flex justify-between items-start mb-3">
						<h3 class="text-lg font-bold">{marketProperty.features.bedrooms}-Bed {formatPropertyType(marketProperty.features.propertyType)}</h3>
						<span class="inline-block px-2 py-1 bg-indigo-600 text-white rounded text-xs font-semibold whitespace-nowrap">
							District {marketProperty.district}
						</span>
					</div>
					<div class="space-y-2 text-sm mb-4">
						<div class="text-xs text-slate-400 mb-2">
							<span class="font-semibold text-indigo-400">{DISTRICT_NAMES[marketProperty.district]}</span>
							<span class="ml-2">Modifier: {marketProperty.districtModifier.toFixed(2)}x</span>
						</div>
						<div class="flex items-center gap-2 text-slate-300">
							<span>🏠 {formatPropertyType(marketProperty.features.propertyType)}</span>
							<span>•</span>
							<span>🛏️ {marketProperty.features.bedrooms} Bed{marketProperty.features.bedrooms > 1 ? 's' : ''}</span>
						</div>
						<div class="flex items-center gap-2 text-slate-300">
							<span>🌳 {formatGarden(marketProperty.features.garden)}</span>
							<span>•</span>
							<span>🚗 {formatParking(marketProperty.features.parking)}</span>
						</div>
						<div class="border-t border-slate-600 pt-2 mt-2">
							<div class="mb-2">
								<span class="text-slate-400">Location:</span>
								<span class="ml-2 font-semibold text-blue-400">📍 {marketProperty.area}</span>
							</div>
							{#if area}
								<div class="grid grid-cols-2 gap-1 text-xs mb-2">
									<div>
										<span class="text-slate-500">Crime:</span>
										<span class="ml-1 {getRatingColor(area.ratings.crime)}">{getRatingLabel(area.ratings.crime)}</span>
									</div>
									<div>
										<span class="text-slate-500">Schools:</span>
										<span class="ml-1 {getRatingColor(area.ratings.schools)}">{getRatingLabel(area.ratings.schools)}</span>
									</div>
									<div>
										<span class="text-slate-500">Transport:</span>
										<span class="ml-1 {getRatingColor(area.ratings.transport)}">{getRatingLabel(area.ratings.transport)}</span>
									</div>
									<div>
										<span class="text-slate-500">Economy:</span>
										<span class="ml-1 {getRatingColor(area.ratings.economy)}">{getRatingLabel(area.ratings.economy)}</span>
									</div>
								</div>
							{/if}
						</div>
						<div class="border-t border-slate-600 pt-2">
							<div>
								<span class="text-slate-400">Base Value:</span>
								<span class="ml-2 font-semibold">{formatCurrency(marketProperty.baseValue)}</span>
							</div>
							<div>
								<span class="text-slate-400">Maintenance:</span>
								<span class="ml-2 font-semibold {getMaintenanceColor(marketProperty.maintenance)}">
									{marketProperty.maintenance.toFixed(1)}%
								</span>
								<span class="text-slate-500 ml-1">({getMaintenanceLabel(marketProperty.maintenance)})</span>
							</div>
							<div>
								<span class="text-slate-400">Market Value:</span>
								<span class="ml-2 font-semibold text-green-400">{formatCurrency(marketValue)}</span>
							</div>
						</div>
					</div>
					
					<div class="space-y-3">
						<button
							onclick={() => handleBuyInstant(marketProperty.id)}
							disabled={$gameState.player.cash < marketValue}
							class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
						>
							{#if $gameState.player.cash < marketValue}
								Insufficient Funds
							{:else}
								Buy Now - {formatCurrency(marketValue)}
							{/if}
						</button>
						
						<div class="bg-slate-600 rounded p-3">
							<div class="text-sm font-semibold mb-2">Make an Offer (50-95%)</div>
							<input
								type="range"
								min="50"
								max="95"
								step="5"
								bind:value={selectedOffers[marketProperty.id]}
								class="w-full mb-2"
							/>
							<div class="flex justify-between items-center text-xs mb-2">
								<span class="text-slate-300">Offer: {offerPercentage}%</span>
								<span class="font-semibold text-green-400">{formatCurrency(offerAmount)}</span>
							</div>
							<div class="text-xs text-slate-300 mb-2">
								Acceptance Chance: <span class="font-semibold text-yellow-400">{acceptanceChance.toFixed(2)}%</span>
							</div>
							<button
								onclick={() => handleMakeOffer(marketProperty.id)}
								disabled={$gameState.player.cash < offerAmount}
								class="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded font-semibold transition-colors text-sm"
							>
								{#if $gameState.player.cash < offerAmount}
									Insufficient Funds
								{:else}
									Submit Offer
								{/if}
							</button>
							<div class="text-xs text-amber-300 mt-2">⚠️ Rejected offers remove property from market</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
