<script lang="ts">
	import type { AuctionProperty, PropertyType, GardenType, ParkingType, AreaRating, District } from '$lib/types/game';
	import { gameState } from '$lib/stores/gameState';
	import { formatCurrency } from '$lib/utils/format';
	import { formatDate } from '$lib/utils/date';
	import { DISTRICT_NAMES } from '$lib/types/game';

	let selectedOffers: { [key: string]: number} = {};
	let selectedDistrict: District | 'all' = 'all';

	$: filteredAuction = selectedDistrict === 'all' 
		? $gameState.auctionMarket 
		: $gameState.auctionMarket.filter(p => p.district === selectedDistrict);
	
	$: districtCounts = $gameState.auctionMarket.reduce((acc, prop) => {
		acc[prop.district] = (acc[prop.district] || 0) + 1;
		return acc;
	}, {} as Record<District, number>);

	function calculateAuctionPropertyValue(auctionProperty: AuctionProperty): number {
		return auctionProperty.baseValue * (0.5 + auctionProperty.maintenance / 200);
	}

	function calculateOfferAcceptanceChance(offerPercentage: number): number {
		// Auction properties: (offer%)^3 (much better than regular market)
		return Math.pow(offerPercentage / 100, 3) * 100;
	}

	function getMaintenanceColor(maintenance: number): string {
		if (maintenance >= 25) return 'text-orange-400';
		if (maintenance >= 10) return 'text-red-400';
		return 'text-red-600';
	}

	function getMaintenanceLabel(maintenance: number): string {
		if (maintenance >= 25) return 'Poor';
		if (maintenance >= 10) return 'Critical';
		return 'Derelict';
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

	function handleBuyInstant(auctionPropertyId: string) {
		gameState.buyAuctionPropertyInstant(auctionPropertyId);
	}

	function handleMakeOffer(auctionPropertyId: string) {
		const offerPercentage = selectedOffers[auctionPropertyId] || 90;
		gameState.makeAuctionOffer(auctionPropertyId, offerPercentage);
		delete selectedOffers[auctionPropertyId];
	}
</script>

<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
	<div class="mb-4">
		<h2 class="text-xl font-bold mb-2">🔨 Auction House ({$gameState.auctionMarket.length}/5)</h2>
		<p class="text-sm text-amber-300">⚠️ Distressed properties • Fixed 30-day listing • Cash only - No mortgages</p>
	</div>
	
	<!-- District Tabs -->
	<div class="mb-4 border-b border-slate-600 overflow-x-auto">
		<div class="flex space-x-1 min-w-max">
			<button
				onclick={() => selectedDistrict = 'all'}
				class="px-4 py-2 -mb-px font-semibold transition-colors {selectedDistrict === 'all' 
					? 'border-b-2 border-amber-500 text-amber-400' 
					: 'text-slate-400 hover:text-slate-300'}"
			>
				All Districts ({$gameState.auctionMarket.length})
			</button>
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as district}
				{@const count = districtCounts[district as District] || 0}
				<button
					onclick={() => selectedDistrict = district as District}
					class="px-4 py-2 -mb-px font-semibold transition-colors whitespace-nowrap {selectedDistrict === district 
						? 'border-b-2 border-amber-500 text-amber-400' 
						: 'text-slate-400 hover:text-slate-300'}"
				>
					{district}: {DISTRICT_NAMES[district as District]} ({count})
				</button>
			{/each}
		</div>
	</div>
	
	{#if filteredAuction.length === 0}
		<div class="text-center text-slate-400 py-8">
			<p class="text-lg">No auction properties available{selectedDistrict !== 'all' ? ' in this district' : ''}</p>
			<p class="text-sm mt-2">New auction properties may appear sporadically (10% chance per day, max 5)</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each filteredAuction as auctionProperty}
				{@const marketValue = calculateAuctionPropertyValue(auctionProperty)}
				{@const offerPercentage = selectedOffers[auctionProperty.id] || 90}
				{@const offerAmount = marketValue * (offerPercentage / 100)}
				{@const acceptanceChance = calculateOfferAcceptanceChance(offerPercentage)}
				{@const daysRemaining = 30 - auctionProperty.daysOnMarket}
				{@const area = $gameState.areas.find(a => a.name === auctionProperty.area)}
				<div class="bg-slate-700 rounded-lg p-4 border-2 border-amber-600">
					<div class="flex justify-between items-start mb-3">
						<h3 class="text-lg font-bold">{auctionProperty.features.bedrooms}-Bed {formatPropertyType(auctionProperty.features.propertyType)}</h3>
						<span class="inline-block px-2 py-1 bg-amber-600 text-white rounded text-xs font-semibold whitespace-nowrap">
							District {auctionProperty.district}
						</span>
					</div>
					<div class="space-y-2 text-sm mb-4">
						<div class="text-xs text-slate-400 mb-2">
							<span class="font-semibold text-amber-400">{DISTRICT_NAMES[auctionProperty.district]}</span>
							<span class="ml-2">Modifier: {auctionProperty.districtModifier.toFixed(2)}x</span>
						</div>
						<div class="flex items-center gap-2 text-slate-300">
							<span>🏠 {formatPropertyType(auctionProperty.features.propertyType)}</span>
							<span>•</span>
							<span>🛏️ {auctionProperty.features.bedrooms} Bed{auctionProperty.features.bedrooms > 1 ? 's' : ''}</span>
						</div>
						<div class="flex items-center gap-2 text-slate-300">
							<span>🌳 {formatGarden(auctionProperty.features.garden)}</span>
							<span>•</span>
							<span>🚗 {formatParking(auctionProperty.features.parking)}</span>
						</div>
						<div class="border-t border-slate-600 pt-2 mt-2">
							<div class="mb-2">
								<span class="text-slate-400">Location:</span>
								<span class="ml-2 font-semibold text-blue-400">📍 {auctionProperty.area}</span>
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
							<div class="bg-amber-900/30 rounded p-2 mb-2">
								<div class="flex justify-between items-center">
									<span class="text-amber-300 font-semibold">⏰ Auction Ends:</span>
									<span class="text-amber-300 font-bold text-lg">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>
								</div>
							</div>
							<div>
								<span class="text-slate-400">Listed:</span>
								<span class="ml-2 font-semibold text-cyan-400">{formatDate(auctionProperty.listedDate)}</span>
							</div>
							<div>
								<span class="text-slate-400">Base Value:</span>
								<span class="ml-2 font-semibold">{formatCurrency(auctionProperty.baseValue)}</span>
							</div>
							<div class="bg-red-900/30 rounded p-2 my-2">
								<span class="text-slate-400">Maintenance:</span>
								<span class="ml-2 font-semibold {getMaintenanceColor(auctionProperty.maintenance)}">
									{auctionProperty.maintenance.toFixed(1)}%
								</span>
								<span class="text-red-300 ml-1 font-bold">({getMaintenanceLabel(auctionProperty.maintenance)})</span>
								<div class="text-xs text-red-300 mt-1">⚠️ Requires significant repairs</div>
							</div>
							<div>
								<span class="text-slate-400">Market Value:</span>
								<span class="ml-2 font-semibold text-green-400">{formatCurrency(marketValue)}</span>
							</div>
						</div>
					</div>
					
					<div class="space-y-3">
						<button
							onclick={() => handleBuyInstant(auctionProperty.id)}
							disabled={$gameState.player.cash < marketValue}
							class="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
						>
							{#if $gameState.player.cash < marketValue}
								Insufficient Funds
							{:else}
								Buy Now (Cash Only) - {formatCurrency(marketValue)}
							{/if}
						</button>
						
						<div class="bg-slate-600 rounded p-3">
							<div class="text-sm font-semibold mb-2">Make an Offer (50-95%)</div>
							<input
								type="range"
								min="50"
								max="95"
								step="5"
								bind:value={selectedOffers[auctionProperty.id]}
								class="w-full mb-2"
							/>
							<div class="flex justify-between items-center text-xs mb-2">
								<span class="text-slate-300">Offer: {offerPercentage}%</span>
								<span class="font-semibold text-green-400">{formatCurrency(offerAmount)}</span>
							</div>
							<div class="text-xs text-slate-300 mb-2">
								<div class="font-bold">Acceptance Chance: <span class="text-green-400">{acceptanceChance.toFixed(1)}%</span></div>
								<div class="text-amber-300 mt-1">✨ Better odds than regular market!</div>
							</div>
							<button
								onclick={() => handleMakeOffer(auctionProperty.id)}
								disabled={$gameState.player.cash < offerAmount}
								class="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded font-semibold transition-colors text-sm"
							>
								{#if $gameState.player.cash < offerAmount}
									Insufficient Funds
								{:else}
									Submit Offer
								{/if}
							</button>
							<div class="text-xs text-amber-300 mt-2">⚠️ Rejected offers remove property from auction</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
