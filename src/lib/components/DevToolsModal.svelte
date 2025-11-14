<script lang="ts">
	import { gameState } from '../stores/gameState';
	import { formatCurrency } from '../utils/format';
	import type { AreaName, District, EconomicPhase, AreaRating } from '../types/game';
	
	export let onClose: () => void;
	
	let activeTab: 'resources' | 'time' | 'economy' | 'properties' | 'staff' | 'areas' | 'misc' = 'resources';
	
	// Resources
	let cashAmount = 0;
	let cashPreset: 'broke' | 'comfortable' | 'wealthy' | 'millionaire' | '' = '';
	
	// Time
	let jumpYear = 1;
	let jumpMonth = 1;
	let jumpDay = 1;
	let advanceDays = 30;
	let customSpeed = 1;
	
	// Economy
	let baseRate = 5;
	let inflationRate = 1;
	let economicPhase: EconomicPhase = 'expansion';
	
	// Properties
	let propertyArea: AreaName = 'Suburbs';
	let propertyDistrict: District = 5;
	let propertyMaintenance = 100;
	let marketPropertiesCount = 10;
	let auctionPropertiesCount = 5;
	
	// Areas
	let selectedArea: AreaName = 'City Center';
	let crimeRating: AreaRating = 3;
	let schoolsRating: AreaRating = 3;
	let transportRating: AreaRating = 3;
	let economyRating: AreaRating = 3;
	
	const areas: AreaName[] = [
		'City Center',
		'Suburbs',
		'Uptown',
		'Industrial District',
		'Riverside',
		'Old Town',
		'Green Belt',
		'Business Quarter'
	];
	
	function handleCashPreset(preset: typeof cashPreset) {
		const presets = {
			broke: 100,
			comfortable: 50000,
			wealthy: 500000,
			millionaire: 1000000
		};
		if (preset) {
			gameState.devSetCash(presets[preset]);
		}
	}
	
	function handleSetCash() {
		gameState.devSetCash(cashAmount);
		cashAmount = 0;
	}
	
	function handleAddCash() {
		gameState.devAddCash(cashAmount);
		cashAmount = 0;
	}
	
	function handleJumpToDate() {
		gameState.devSetDate(jumpYear, jumpMonth, jumpDay);
	}
	
	function handleAdvanceTime() {
		gameState.devAdvanceTime(advanceDays);
	}
	
	function handleSetEconomy() {
		gameState.devSetEconomy(baseRate, inflationRate, economicPhase);
	}
	
	function handleAddProperty() {
		gameState.devAddProperty(propertyArea, propertyDistrict, propertyMaintenance);
	}
	
	function handleSetAreaRatings() {
		gameState.devSetAreaRatings(selectedArea, {
			crime: crimeRating,
			schools: schoolsRating,
			transport: transportRating,
			economy: economyRating
		});
	}
	
	// Load current area ratings when area changes
	$: {
		const area = $gameState.areas.find(a => a.name === selectedArea);
		if (area) {
			crimeRating = area.ratings.crime;
			schoolsRating = area.ratings.schools;
			transportRating = area.ratings.transport;
			economyRating = area.ratings.economy;
		}
	}
</script>

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-container" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h1 class="modal-title">🛠️ Development Tools</h1>
			<p class="modal-subtitle">Testing utilities for modifying game state</p>
		</div>

		<!-- Tabs -->
		<div class="tabs">
			<button
				class:active={activeTab === 'resources'}
				onclick={() => activeTab = 'resources'}
			>
				💰 Resources
			</button>
			<button
				class:active={activeTab === 'time'}
				onclick={() => activeTab = 'time'}
			>
				⏰ Time
			</button>
			<button
				class:active={activeTab === 'economy'}
				onclick={() => activeTab = 'economy'}
			>
				📊 Economy
			</button>
			<button
				class:active={activeTab === 'properties'}
				onclick={() => activeTab = 'properties'}
			>
				🏠 Properties
			</button>
			<button
				class:active={activeTab === 'staff'}
				onclick={() => activeTab = 'staff'}
			>
				👥 Staff
			</button>
			<button
				class:active={activeTab === 'areas'}
				onclick={() => activeTab = 'areas'}
			>
				🗺️ Areas
			</button>
			<button
				class:active={activeTab === 'misc'}
				onclick={() => activeTab = 'misc'}
			>
				⚙️ Misc
			</button>
		</div>

		<div class="modal-body">
			{#if activeTab === 'resources'}
				<section class="section">
					<h2>💰 Player Resources</h2>
					
					<div class="control-group">
						<h3>Quick Presets</h3>
						<div class="button-row">
							<button class="action-button" onclick={() => handleCashPreset('broke')}>
								Broke ({formatCurrency(100)})
							</button>
							<button class="action-button" onclick={() => handleCashPreset('comfortable')}>
								Comfortable ({formatCurrency(50000)})
							</button>
							<button class="action-button" onclick={() => handleCashPreset('wealthy')}>
								Wealthy ({formatCurrency(500000)})
							</button>
							<button class="action-button" onclick={() => handleCashPreset('millionaire')}>
								Millionaire ({formatCurrency(1000000)})
							</button>
						</div>
					</div>
					
					<div class="control-group">
						<h3>Custom Amount</h3>
						<div class="input-row">
							<input
								type="number"
								bind:value={cashAmount}
								placeholder="Amount"
								class="number-input"
							/>
							<button class="action-button" onclick={handleSetCash}>Set Cash</button>
							<button class="action-button" onclick={handleAddCash}>Add Cash</button>
						</div>
					</div>
					
					<div class="info-panel">
						<div class="info-item">
							<span class="label">Current Cash:</span>
							<span class="value">{formatCurrency($gameState.player.cash)}</span>
						</div>
						<div class="info-item">
							<span class="label">Accrued Interest:</span>
							<span class="value">{formatCurrency($gameState.player.accruedInterest)}</span>
						</div>
					</div>
				</section>
			{:else if activeTab === 'time'}
				<section class="section">
					<h2>⏰ Time Manipulation</h2>
					
					<div class="control-group">
						<h3>Jump to Specific Date</h3>
						<div class="input-row">
							<div class="input-field">
								<label>Year</label>
								<input type="number" bind:value={jumpYear} min="1" class="number-input" />
							</div>
							<div class="input-field">
								<label>Month</label>
								<input type="number" bind:value={jumpMonth} min="1" max="12" class="number-input" />
							</div>
							<div class="input-field">
								<label>Day</label>
								<input type="number" bind:value={jumpDay} min="1" max="31" class="number-input" />
							</div>
							<button class="action-button" onclick={handleJumpToDate}>Jump to Date</button>
						</div>
					</div>
					
					<div class="control-group">
						<h3>Game Speed</h3>
						<div class="input-row">
							<input
								type="number"
								bind:value={customSpeed}
								min="0.1"
								max="1000"
								step="0.5"
								placeholder="Speed multiplier"
								class="number-input"
							/>
							<button class="action-button" onclick={() => gameState.devSetSpeed(customSpeed)}>
								Set Speed to {customSpeed}x
							</button>
						</div>
						<div class="button-row">
							<button class="action-button" onclick={() => { customSpeed = 10; gameState.devSetSpeed(10); }}>
								10x Speed
							</button>
							<button class="action-button" onclick={() => { customSpeed = 50; gameState.devSetSpeed(50); }}>
								50x Speed
							</button>
							<button class="action-button" onclick={() => { customSpeed = 100; gameState.devSetSpeed(100); }}>
								100x Speed
							</button>
							<button class="action-button" onclick={() => { customSpeed = 500; gameState.devSetSpeed(500); }}>
								500x Speed
							</button>
						</div>
						<p class="hint">Custom speeds will take effect immediately when you close this modal and the game resumes.</p>
					</div>
					
					<div class="control-group">
						<h3>Fast Forward</h3>
						<div class="input-row">
							<input
								type="number"
								bind:value={advanceDays}
								min="1"
								placeholder="Days"
								class="number-input"
							/>
							<button class="action-button" onclick={handleAdvanceTime}>Advance {advanceDays} Days</button>
						</div>
						<div class="button-row">
							<button class="action-button" onclick={() => { advanceDays = 30; handleAdvanceTime(); }}>
								+1 Month
							</button>
							<button class="action-button" onclick={() => { advanceDays = 90; handleAdvanceTime(); }}>
								+1 Quarter
							</button>
							<button class="action-button" onclick={() => { advanceDays = 365; handleAdvanceTime(); }}>
								+1 Year
							</button>
						</div>
					</div>
					
					<div class="info-panel">
						<div class="info-item">
							<span class="label">Current Date:</span>
							<span class="value">
								{$gameState.gameTime.currentDate.day}/{$gameState.gameTime.currentDate.month}/Year {$gameState.gameTime.currentDate.year}
							</span>
						</div>
					</div>
				</section>
			{:else if activeTab === 'economy'}
				<section class="section">
					<h2>📊 Economic Controls</h2>
					
					<div class="control-group">
						<h3>Set Economic Parameters</h3>
						<div class="input-field">
							<label>Base Rate (%)</label>
							<input type="number" bind:value={baseRate} min="0.1" max="20" step="0.1" class="number-input" />
						</div>
						<div class="input-field">
							<label>Quarterly Inflation Rate (%)</label>
							<input type="number" bind:value={inflationRate} min="-5" max="5" step="0.1" class="number-input" />
						</div>
						<div class="input-field">
							<label>Economic Phase</label>
							<select bind:value={economicPhase} class="select-input">
								<option value="recession">Recession</option>
								<option value="recovery">Recovery</option>
								<option value="expansion">Expansion</option>
								<option value="peak">Peak</option>
							</select>
						</div>
						<button class="action-button" onclick={handleSetEconomy}>Apply Changes</button>
					</div>
					
					<div class="control-group">
						<h3>Quick Actions</h3>
						<button class="action-button" onclick={() => gameState.devForceQuarterlyUpdate()}>
							Force Quarterly Update
						</button>
					</div>
					
					<div class="info-panel">
						<div class="info-item">
							<span class="label">Current Base Rate:</span>
							<span class="value">{$gameState.economy.baseRate.toFixed(2)}%</span>
						</div>
						<div class="info-item">
							<span class="label">Current Inflation:</span>
							<span class="value">{$gameState.economy.inflationRate.toFixed(2)}%</span>
						</div>
						<div class="info-item">
							<span class="label">Current Phase:</span>
							<span class="value capitalize">{$gameState.economy.economicPhase}</span>
						</div>
					</div>
				</section>
			{:else if activeTab === 'properties'}
				<section class="section">
					<h2>🏠 Property Management</h2>
					
					<div class="control-group">
						<h3>Add Property</h3>
						<div class="input-field">
							<label>Area</label>
							<select bind:value={propertyArea} class="select-input">
								{#each areas as area}
									<option value={area}>{area}</option>
								{/each}
							</select>
						</div>
						<div class="input-field">
							<label>District (1-10)</label>
							<input type="number" bind:value={propertyDistrict} min="1" max="10" class="number-input" />
						</div>
						<div class="input-field">
							<label>Maintenance (%)</label>
							<input type="number" bind:value={propertyMaintenance} min="0" max="100" class="number-input" />
						</div>
						<button class="action-button" onclick={handleAddProperty}>Add Random Property</button>
					</div>
					
					<div class="control-group">
						<h3>Modify Existing Properties</h3>
						<div class="button-row">
							<button class="action-button" onclick={() => gameState.devSetAllMaintenance(100)}>
								Set All Maintenance to 100%
							</button>
							<button class="action-button" onclick={() => gameState.devFillAllProperties()}>
								Fill All Vacant Properties
							</button>
							<button class="action-button danger" onclick={() => gameState.devClearAllTenancies()}>
								Clear All Tenancies
							</button>
						</div>
					</div>
					
					<div class="control-group">
						<h3>Market Properties</h3>
						<div class="input-row">
							<input
								type="number"
								bind:value={marketPropertiesCount}
								min="1"
								max="50"
								class="number-input"
							/>
							<button class="action-button" onclick={() => gameState.devGenerateMarketProperties(marketPropertiesCount)}>
								Generate Market Properties
							</button>
						</div>
						<div class="input-row">
							<input
								type="number"
								bind:value={auctionPropertiesCount}
								min="1"
								max="5"
								class="number-input"
							/>
							<button class="action-button" onclick={() => gameState.devGenerateAuctionProperties(auctionPropertiesCount)}>
								Generate Auction Properties
							</button>
						</div>
					</div>
					
					<div class="info-panel">
						<div class="info-item">
							<span class="label">Properties Owned:</span>
							<span class="value">{$gameState.player.properties.length}</span>
						</div>
						<div class="info-item">
							<span class="label">Market Properties:</span>
							<span class="value">{$gameState.propertyMarket.length}/50</span>
						</div>
						<div class="info-item">
							<span class="label">Auction Properties:</span>
							<span class="value">{$gameState.auctionMarket.length}/5</span>
						</div>
					</div>
				</section>
			{:else if activeTab === 'staff'}
				<section class="section">
					<h2>👥 Staff Management</h2>
					
					<div class="control-group">
						<h3>Staff Actions</h3>
						<div class="button-row">
							<button class="action-button" onclick={() => gameState.devMaxAllStaffXP()}>
								Max All Staff XP (Level 6)
							</button>
							<button class="action-button" onclick={() => gameState.devPayAllWages()}>
								Pay All Unpaid Wages
							</button>
						</div>
					</div>
					
					<div class="info-panel">
						<div class="info-item">
							<span class="label">Estate Agents:</span>
							<span class="value">{$gameState.staff.estateAgents.length}</span>
						</div>
						<div class="info-item">
							<span class="label">Caretakers:</span>
							<span class="value">{$gameState.staff.caretakers.length}</span>
						</div>
						<div class="info-item">
							<span class="label">Total Staff:</span>
							<span class="value">{$gameState.staff.estateAgents.length + $gameState.staff.caretakers.length}</span>
						</div>
					</div>
				</section>
			{:else if activeTab === 'areas'}
				<section class="section">
					<h2>🗺️ Area Management</h2>
					
					<div class="control-group">
						<h3>Modify Area Ratings</h3>
						<div class="input-field">
							<label>Select Area</label>
							<select bind:value={selectedArea} class="select-input">
								{#each areas as area}
									<option value={area}>{area}</option>
								{/each}
							</select>
						</div>
						<div class="input-field">
							<label>Crime Rating (1=High Crime, 5=Very Safe)</label>
							<input type="number" bind:value={crimeRating} min="1" max="5" class="number-input" />
						</div>
						<div class="input-field">
							<label>Schools Rating (1=Poor, 5=Excellent)</label>
							<input type="number" bind:value={schoolsRating} min="1" max="5" class="number-input" />
						</div>
						<div class="input-field">
							<label>Transport Rating (1=Poor, 5=Excellent)</label>
							<input type="number" bind:value={transportRating} min="1" max="5" class="number-input" />
						</div>
						<div class="input-field">
							<label>Economy Rating (1=Depressed, 5=Thriving)</label>
							<input type="number" bind:value={economyRating} min="1" max="5" class="number-input" />
						</div>
						<button class="action-button" onclick={handleSetAreaRatings}>Apply Ratings</button>
					</div>
					
					<div class="control-group">
						<h3>Quick Presets</h3>
						<div class="button-row">
							<button class="action-button" onclick={() => {
								crimeRating = 1;
								schoolsRating = 1;
								transportRating = 1;
								economyRating = 1;
								handleSetAreaRatings();
							}}>
								Set All to 1 (Poor)
							</button>
							<button class="action-button" onclick={() => {
								crimeRating = 5;
								schoolsRating = 5;
								transportRating = 5;
								economyRating = 5;
								handleSetAreaRatings();
							}}>
								Set All to 5 (Excellent)
							</button>
						</div>
					</div>
				</section>
			{:else if activeTab === 'misc'}
				<section class="section">
					<h2>⚙️ Miscellaneous</h2>
					
					<div class="control-group">
						<h3>Mortgages</h3>
						<div class="button-row">
							<button class="action-button danger" onclick={() => gameState.devClearAllMortgages()}>
								Clear All Mortgages
							</button>
						</div>
						<div class="info-panel">
							<div class="info-item">
								<span class="label">Active Mortgages:</span>
								<span class="value">{$gameState.player.mortgages.length}</span>
							</div>
						</div>
					</div>
					
					<div class="control-group">
						<h3>Game Status</h3>
						<div class="button-row">
							{#if $gameState.foreclosureWarning}
								<button class="action-button" onclick={() => gameState.devClearForeclosureWarning()}>
									Clear Foreclosure Warning
								</button>
							{/if}
						</div>
						<div class="info-panel">
							<div class="info-item">
								<span class="label">Foreclosure Warning:</span>
								<span class="value">{$gameState.foreclosureWarning ? 'Active' : 'None'}</span>
							</div>
							<div class="info-item">
								<span class="label">Game Over:</span>
								<span class="value">{$gameState.gameOver ? 'Yes' : 'No'}</span>
							</div>
							<div class="info-item">
								<span class="label">Game Win:</span>
								<span class="value">{$gameState.gameWin ? 'Yes' : 'No'}</span>
							</div>
						</div>
					</div>
				</section>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="close-button" onclick={onClose}>Close</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 20px;
	}

	.modal-container {
		background: linear-gradient(to bottom, #1e293b, #0f172a);
		border-radius: 12px;
		border: 2px solid #8b5cf6;
		max-width: 1000px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.5);
	}

	.modal-header {
		padding: 24px;
		border-bottom: 2px solid #334155;
	}

	.modal-title {
		font-size: 2rem;
		font-weight: bold;
		color: white;
		margin: 0 0 8px 0;
		text-align: center;
	}

	.modal-subtitle {
		text-align: center;
		color: #94a3b8;
		margin: 0;
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 12px 24px;
		border-bottom: 2px solid #334155;
		overflow-x: auto;
	}

	.tabs button {
		padding: 8px 16px;
		background: #334155;
		color: #94a3b8;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.tabs button:hover {
		background: #475569;
		color: white;
	}

	.tabs button.active {
		background: linear-gradient(to bottom, #8b5cf6, #7c3aed);
		color: white;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	.section {
		margin-bottom: 24px;
	}

	.section h2 {
		color: #e2e8f0;
		font-size: 1.5rem;
		margin: 0 0 20px 0;
		border-bottom: 2px solid #8b5cf6;
		padding-bottom: 8px;
	}

	.control-group {
		background: #334155;
		padding: 16px;
		border-radius: 8px;
		margin-bottom: 16px;
	}

	.control-group h3 {
		color: #cbd5e1;
		font-size: 1.1rem;
		margin: 0 0 12px 0;
	}

	.input-field {
		margin-bottom: 12px;
	}

	.input-field label {
		display: block;
		color: #94a3b8;
		font-size: 0.9rem;
		margin-bottom: 6px;
	}

	.number-input,
	.select-input {
		width: 100%;
		padding: 10px;
		background: #1e293b;
		border: 1px solid #475569;
		border-radius: 6px;
		color: white;
		font-size: 1rem;
	}

	.number-input:focus,
	.select-input:focus {
		outline: none;
		border-color: #8b5cf6;
	}

	.input-row {
		display: flex;
		gap: 8px;
		align-items: end;
		margin-bottom: 12px;
	}

	.input-row .input-field {
		flex: 1;
		margin-bottom: 0;
	}

	.button-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.action-button {
		padding: 10px 16px;
		background: linear-gradient(to bottom, #3b82f6, #2563eb);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.action-button:hover {
		background: linear-gradient(to bottom, #2563eb, #1d4ed8);
		transform: translateY(-1px);
	}

	.action-button.danger {
		background: linear-gradient(to bottom, #ef4444, #dc2626);
	}

	.action-button.danger:hover {
		background: linear-gradient(to bottom, #dc2626, #b91c1c);
	}

	.info-panel {
		background: #1e293b;
		padding: 12px;
		border-radius: 6px;
		margin-top: 12px;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		border-bottom: 1px solid #334155;
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.info-item .label {
		color: #94a3b8;
	}

	.info-item .value {
		color: white;
		font-weight: 600;
	}

	.value.capitalize {
		text-transform: capitalize;
	}

	.hint {
		color: #94a3b8;
		font-size: 0.85rem;
		margin-top: 8px;
		font-style: italic;
	}

	.modal-footer {
		padding: 20px 24px;
		border-top: 2px solid #334155;
		display: flex;
		justify-content: center;
	}

	.close-button {
		padding: 12px 48px;
		background: linear-gradient(to bottom, #64748b, #475569);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: linear-gradient(to bottom, #475569, #334155);
		transform: translateY(-2px);
	}

	/* Scrollbar styling */
	.modal-body::-webkit-scrollbar,
	.tabs::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.modal-body::-webkit-scrollbar-track,
	.tabs::-webkit-scrollbar-track {
		background: #0f172a;
		border-radius: 4px;
	}

	.modal-body::-webkit-scrollbar-thumb,
	.tabs::-webkit-scrollbar-thumb {
		background: #475569;
		border-radius: 4px;
	}

	.modal-body::-webkit-scrollbar-thumb:hover,
	.tabs::-webkit-scrollbar-thumb:hover {
		background: #64748b;
	}
</style>
