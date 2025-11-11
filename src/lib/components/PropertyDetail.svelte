<script lang="ts">
	import type { Property, RentMarkup, TenancyPeriod, PropertyType, GardenType, ParkingType, AreaRating } from '$lib/types/game';
	import { gameState } from '$lib/stores/gameState';
	import { calculateDaysRemaining, addMonths } from '$lib/utils/date';
	import { BASE_RATE, BASE_FILL_CHANCE, BASE_SALE_CHANCE } from '$lib/types/game';

	export let property: Property;
	export let onBack: () => void;

	let selectedSalePrice = 100;
	
	$: area = $gameState.areas.find(a => a.name === property.area);

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

	function calculateMarketValue(prop: Property): number {
		return prop.baseValue * (prop.maintenance / 100);
	}

	function calculateMonthlyRent(prop: Property): number {
		if (!prop.tenancy) {
			const marketValue = calculateMarketValue(prop);
			const annualRate = BASE_RATE + prop.vacantSettings.rentMarkup;
			const annualRent = (marketValue * annualRate) / 100;
			return annualRent / 12;
		}
		const annualRate = BASE_RATE + prop.tenancy.rentMarkup;
		const annualRent = (prop.tenancy.marketValueAtStart * annualRate) / 100;
		return annualRent / 12;
	}

	function calculateMaintenanceCost(prop: Property): number {
		const percentageNeeded = 100 - prop.maintenance;
		const baseCost = prop.baseValue * (percentageNeeded / 100);
		return baseCost * 0.25;
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

	function calculateDailySaleChance(prop: Property): number {
		if (!prop.saleInfo) return 0;
		const priceRatio = prop.saleInfo.askingPricePercentage / 100;
		return BASE_SALE_CHANCE * (1 / Math.pow(priceRatio, 2));
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

	function formatCurrency(amount: number): string {
		return `£${amount.toFixed(2)}`;
	}

	function formatDate(date: { year: number; month: number; day: number }): string {
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		return `${date.day} ${monthNames[date.month - 1]} Year ${date.year}`;
	}

	function handleVacantSettingsChange(rentMarkup: RentMarkup, periodMonths: TenancyPeriod, autoRelist: boolean) {
		gameState.setPropertyVacantSettings(property.id, rentMarkup, periodMonths, autoRelist);
	}

	function handlePerformMaintenance() {
		gameState.performMaintenance(property.id);
	}

	function handleToggleScheduleMaintenance() {
		gameState.toggleScheduleMaintenance(property.id);
	}

	function handleListForSale() {
		gameState.listPropertyForSale(property.id, selectedSalePrice);
	}

	function handleCancelListing() {
		gameState.cancelListing(property.id);
	}
</script>

<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
	<div class="flex items-center gap-4 mb-6">
		<button
			onclick={onBack}
			class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
		>
			← Back to Portfolio
		</button>
		<h2 class="text-2xl font-bold">{property.name}</h2>
	</div>

	<!-- Property Info -->
	<div class="bg-slate-700 rounded-lg p-4 mb-6">
		<div class="mb-4 pb-4 border-b border-slate-600">
			<h3 class="text-sm font-semibold text-slate-400 mb-2">Property Features</h3>
			<div class="flex flex-wrap items-center gap-3 text-sm text-slate-300">
				<span>🏠 {formatPropertyType(property.features.propertyType)}</span>
				<span>•</span>
				<span>🛏️ {property.features.bedrooms} Bedroom{property.features.bedrooms > 1 ? 's' : ''}</span>
				<span>•</span>
				<span>🌳 {formatGarden(property.features.garden)}</span>
				<span>•</span>
				<span>🚗 {formatParking(property.features.parking)}</span>
			</div>
		</div>
		<div class="mb-4 pb-4 border-b border-slate-600">
			<h3 class="text-sm font-semibold text-slate-400 mb-2">Location</h3>
			<div class="flex items-center gap-2 mb-2">
				<span class="text-blue-400 font-semibold">📍 {property.area}</span>
			</div>
			{#if area}
				<div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
					<div>
						<span class="text-slate-400">Crime:</span>
						<span class="ml-1 {getRatingColor(area.ratings.crime)}">{getRatingLabel(area.ratings.crime)}</span>
					</div>
					<div>
						<span class="text-slate-400">Schools:</span>
						<span class="ml-1 {getRatingColor(area.ratings.schools)}">{getRatingLabel(area.ratings.schools)}</span>
					</div>
					<div>
						<span class="text-slate-400">Transport:</span>
						<span class="ml-1 {getRatingColor(area.ratings.transport)}">{getRatingLabel(area.ratings.transport)}</span>
					</div>
					<div>
						<span class="text-slate-400">Economy:</span>
						<span class="ml-1 {getRatingColor(area.ratings.economy)}">{getRatingLabel(area.ratings.economy)}</span>
					</div>
				</div>
			{/if}
		</div>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
			<div>
				<span class="text-slate-400">Base Value:</span>
				<div class="font-semibold">{formatCurrency(property.baseValue)}</div>
			</div>
			<div>
				<span class="text-slate-400">Market Value:</span>
				<div class="font-semibold {getMaintenanceColor(property.maintenance)}">
					{formatCurrency(calculateMarketValue(property))}
				</div>
			</div>
			<div>
				<span class="text-slate-400">Maintenance:</span>
				<div class="font-semibold {getMaintenanceColor(property.maintenance)}">
					{property.maintenance.toFixed(1)}% ({getMaintenanceLabel(property.maintenance)})
				</div>
			</div>
			<div>
				<span class="text-slate-400">Total Income:</span>
				<div class="font-semibold text-green-400">{formatCurrency(property.totalIncomeEarned)}</div>
			</div>
		</div>
	</div>

	<!-- State-specific content -->
	{#if property.tenancy}
		<!-- Occupied Property -->
		<div class="space-y-6">
			<div class="bg-green-900/30 border border-green-600/50 rounded-lg p-6">
				<h3 class="text-xl font-bold mb-4 flex items-center gap-2">
					🏠 Currently Occupied
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-slate-400">Monthly Rent:</span>
						<div class="text-lg font-semibold text-green-400">
							{formatCurrency(calculateMonthlyRent(property))}
						</div>
						<div class="text-xs text-slate-500">
							(Base {BASE_RATE}% + {property.tenancy.rentMarkup}% markup)
						</div>
					</div>
					<div>
						<span class="text-slate-400">Lease Period:</span>
						<div class="font-semibold">{property.tenancy.periodMonths} months</div>
					</div>
					<div>
						<span class="text-slate-400">Lease Started:</span>
						<div class="font-semibold">{formatDate(property.tenancy.startDate)}</div>
					</div>
					<div>
						<span class="text-slate-400">Lease Ends:</span>
						<div class="font-semibold">{formatDate(property.tenancy.endDate)}</div>
					</div>
					<div>
						<span class="text-slate-400">Days Remaining:</span>
						<div class="font-semibold text-yellow-400">
							{calculateDaysRemaining($gameState.gameTime.currentDate, property.tenancy.endDate)}
						</div>
					</div>
				</div>
			</div>

			<!-- Settings for when lease ends -->
			<div class="bg-slate-700 rounded-lg p-4">
				<h4 class="font-bold mb-3">When Lease Ends</h4>
				<div class="space-y-3">
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							checked={property.vacantSettings.autoRelist}
							onchange={(e) => handleVacantSettingsChange(
								property.vacantSettings.rentMarkup,
								property.vacantSettings.periodMonths,
								e.currentTarget.checked
							)}
							class="w-4 h-4"
						/>
						<span class="text-slate-300">Auto-relist when lease ends</span>
					</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							checked={property.scheduleMaintenance}
							onchange={handleToggleScheduleMaintenance}
							class="w-4 h-4"
						/>
						<span class="text-slate-300">Schedule maintenance when lease ends</span>
					</label>
				</div>
				{#if property.maintenance < 75}
					<div class="bg-amber-900/30 border border-amber-600/50 rounded p-3 text-xs text-amber-300 mt-3">
						⚠️ Maintenance degrading: {property.maintenance.toFixed(1)}%. 
						{#if property.maintenance < 25}
							Property cannot be re-let below 25%!
						{:else}
							Consider scheduling maintenance.
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{:else if property.isUnderMaintenance}
		<!-- Under Maintenance -->
		<div class="bg-purple-900/30 border border-purple-600/50 rounded-lg p-6">
			<h3 class="text-xl font-bold mb-4 flex items-center gap-2">
				🔧 Property Under Maintenance
			</h3>
			<div class="space-y-3 text-sm">
				<div>
					<span class="text-slate-400">Started:</span>
					<span class="ml-2 font-semibold">{formatDate(property.maintenanceStartDate!)}</span>
				</div>
				<div>
					<span class="text-slate-400">Completes:</span>
					<span class="ml-2 font-semibold">{formatDate(addMonths(property.maintenanceStartDate!, 1))}</span>
				</div>
				<div>
					<span class="text-slate-400">Days Remaining:</span>
					<span class="ml-2 font-semibold text-yellow-400">
						{calculateDaysRemaining($gameState.gameTime.currentDate, addMonths(property.maintenanceStartDate!, 1))}
					</span>
				</div>
			</div>
			<div class="mt-4 text-xs text-slate-400">
				Maintenance will restore property to 100% when complete.
				{#if property.vacantSettings.autoRelist}
					Property will auto-relist after maintenance.
				{/if}
			</div>
		</div>
	{:else if property.saleInfo}
		<!-- Listed for Sale -->
		{@const marketValue = calculateMarketValue(property)}
		{@const askingPrice = marketValue * (property.saleInfo.askingPricePercentage / 100)}
		{@const dailyChance = calculateDailySaleChance(property)}
		<div class="space-y-6">
			<div class="bg-blue-900/30 border border-blue-600/50 rounded-lg p-6">
				<h3 class="text-xl font-bold mb-4 flex items-center gap-2">
					🏷️ Listed for Sale
				</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
					<div>
						<span class="text-slate-400">Market Value:</span>
						<div class="font-semibold">{formatCurrency(marketValue)}</div>
					</div>
					<div>
						<span class="text-slate-400">Asking Price:</span>
						<div class="text-lg font-semibold text-green-400">{formatCurrency(askingPrice)}</div>
					</div>
					<div>
						<span class="text-slate-400">Price Percentage:</span>
						<div class="font-semibold">{property.saleInfo.askingPricePercentage}% of value</div>
					</div>
					<div>
						<span class="text-slate-400">Days Listed:</span>
						<div class="font-semibold">{property.saleInfo.daysOnMarket}</div>
					</div>
					<div>
						<span class="text-slate-400">Daily Sale Chance:</span>
						<div class="font-semibold text-yellow-400">{dailyChance.toFixed(2)}%</div>
					</div>
				</div>
				<button
					onclick={handleCancelListing}
					class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
				>
					Cancel Listing
				</button>
			</div>
		</div>
	{:else}
		<!-- Vacant Property - Actions -->
		<div class="space-y-6">
			<div class="bg-amber-900/30 border border-amber-600/50 rounded-lg p-6">
				<h3 class="text-xl font-bold mb-4 flex items-center gap-2">
					📭 Vacant - Seeking Tenants
				</h3>
				<div class="space-y-4">
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
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							checked={property.vacantSettings.autoRelist}
							onchange={(e) => handleVacantSettingsChange(
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

			{#if property.maintenance < 25}
				<div class="bg-red-900/30 border border-red-600/50 rounded p-4 text-sm text-red-300">
					🚫 Property cannot be let out with maintenance below 25%. Perform maintenance to restore.
				</div>
			{/if}

			<!-- Maintenance Action -->
			{#if property.maintenance < 100}
				<div class="bg-slate-700 rounded-lg p-4">
					<h4 class="font-bold mb-3">Maintenance</h4>
					<div class="flex justify-between items-center mb-3">
						<div class="text-sm">
							Restore from {property.maintenance.toFixed(1)}% to 100%
						</div>
						<div class="text-sm">
							Cost: <span class="text-red-400 font-semibold">{formatCurrency(calculateMaintenanceCost(property))}</span>
						</div>
					</div>
					<div class="text-xs text-slate-400 mb-3">
						Takes 1 month to complete
					</div>
					<button
						onclick={handlePerformMaintenance}
						disabled={$gameState.player.cash < calculateMaintenanceCost(property)}
						class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
					>
						{#if $gameState.player.cash < calculateMaintenanceCost(property)}
							Insufficient Funds
						{:else}
							Perform Maintenance
						{/if}
					</button>
				</div>
			{/if}

			<!-- Sell Action -->
			{#if !property.saleInfo && property.maintenance > 0}
				{@const marketValue = calculateMarketValue(property)}
				{@const askingPrice = marketValue * (selectedSalePrice / 100)}
				{@const priceRatio = selectedSalePrice / 100}
				{@const dailyChance = BASE_SALE_CHANCE * (1 / Math.pow(priceRatio, 2))}
				<div class="bg-slate-700 rounded-lg p-4">
					<h4 class="font-bold mb-3">List for Sale</h4>
					<div class="text-xs text-slate-400 mb-3">
						Market Value: {formatCurrency(marketValue)}
					</div>
					<div class="mb-3">
						<label class="block text-xs text-slate-400 mb-2">
							Asking Price (75-125%)
						</label>
						<input
							type="range"
							min="75"
							max="125"
							step="5"
							bind:value={selectedSalePrice}
							class="w-full mb-2"
						/>
						<div class="flex justify-between items-center text-xs">
							<span class="text-slate-300">{selectedSalePrice}% of value</span>
							<span class="font-semibold text-green-400">{formatCurrency(askingPrice)}</span>
						</div>
						<div class="text-xs text-slate-300 mt-1">
							Daily Sale Chance: <span class="font-semibold text-yellow-400">{dailyChance.toFixed(2)}%</span>
						</div>
					</div>
					<button
						onclick={handleListForSale}
						class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
					>
						List Property
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
