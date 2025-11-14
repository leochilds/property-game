<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import type { PrestigeBonusType } from '$lib/types/game';
	
	$: canPrestigeNow = $gameState.canPrestigeNow;
	$: prestigeLevel = $gameState.prestigeLevel;
	$: currentStartingCash = 50000 * Math.pow(2, Math.min(prestigeLevel, Math.ceil(Math.log2(1000000 / 50000)))) + 
		Math.max(0, prestigeLevel - Math.ceil(Math.log2(1000000 / 50000))) * 1000000;
	
	let selectedBonus: PrestigeBonusType | null = null;
	let pointsToAllocate = 1;
	let cashPoints = 0;
	let propertyPoints = 0;
	
	// Calculate next starting cash with allocation
	$: nextStartingCash = (() => {
		const totalCashPoints = prestigeLevel + cashPoints;
		// Double up to £1m
		const doublingPoints = Math.ceil(Math.log2(1000000 / 50000)); // Points needed to reach £1m
		if (totalCashPoints <= doublingPoints) {
			return 50000 * Math.pow(2, totalCashPoints);
		} else {
			// After £1m, add £1m per point
			return 1000000 + (totalCashPoints - doublingPoints) * 1000000;
		}
	})();
	
	// Calculate starting property district with allocation
	$: startingPropertyDistrict = (() => {
		const totalPropertyPoints = prestigeLevel + propertyPoints;
		if (totalPropertyPoints === 0) return null;
		// District cycles: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, then 1+10, 2+10, etc.
		const mainDistrict = ((totalPropertyPoints - 1) % 10) + 1;
		const extraProperties = Math.floor((totalPropertyPoints - 1) / 10);
		if (extraProperties === 0) {
			return { main: mainDistrict, extra: [] };
		} else {
			return { main: mainDistrict, extra: [10] }; // Always get district 10 as bonus
		}
	})();
	
	function allocateToCash() {
		if (pointsToAllocate > 0) {
			cashPoints++;
			pointsToAllocate--;
		}
	}
	
	function allocateToProperty() {
		if (pointsToAllocate > 0) {
			propertyPoints++;
			pointsToAllocate--;
		}
	}
	
	function removeFromCash() {
		if (cashPoints > 0) {
			cashPoints--;
			pointsToAllocate++;
		}
	}
	
	function removeFromProperty() {
		if (propertyPoints > 0) {
			propertyPoints--;
			pointsToAllocate++;
		}
	}
	
	function handlePrestige() {
		const bonuses: Array<{ type: PrestigeBonusType; points: number }> = [];
		if (cashPoints > 0) {
			bonuses.push({ type: 'cash', points: cashPoints });
		}
		if (propertyPoints > 0) {
			bonuses.push({ type: 'property', points: propertyPoints });
		}
		
		gameState.prestigeReset(bonuses);
	}
	
	function handleCancel() {
		gameState.cancelPrestige();
	}
</script>

{#if canPrestigeNow}
	<div class="modal-backdrop">
		<div class="modal">
			<h1>✨ Prestige System ✨</h1>
			
			<div class="info-section">
				<p>You have earned <strong class="highlight">1 Prestige Point</strong> for completing 50 years!</p>
				<p class="mt-2">Current Prestige Level: <strong class="highlight">{prestigeLevel}</strong></p>
				<p class="mt-2">Allocate your point(s) to gain permanent bonuses for your next playthrough.</p>
			</div>
			
			<div class="allocation-section">
				<h2>Points to Allocate: <span class="points-remaining">{pointsToAllocate}</span></h2>
				
				<div class="bonus-options">
					<div class="bonus-option">
						<div class="bonus-header">
							<h3>💰 Cash Bonus</h3>
							<div class="allocation-controls">
								<button 
									class="btn-small" 
									onclick={removeFromCash}
									disabled={cashPoints === 0}
								>
									-
								</button>
								<span class="points-allocated">{cashPoints}</span>
								<button 
									class="btn-small" 
									onclick={allocateToCash}
									disabled={pointsToAllocate === 0}
								>
									+
								</button>
							</div>
						</div>
						<div class="bonus-description">
							<p>Increases starting cash. Doubles each point up to £1m, then adds £1m per point.</p>
							<div class="bonus-preview">
								<p>Current: <strong>£{currentStartingCash.toLocaleString()}</strong></p>
								<p>With allocation: <strong class="preview-value">£{nextStartingCash.toLocaleString()}</strong></p>
							</div>
						</div>
					</div>
					
					<div class="bonus-option">
						<div class="bonus-header">
							<h3>🏠 Property Bonus</h3>
							<div class="allocation-controls">
								<button 
									class="btn-small" 
									onclick={removeFromProperty}
									disabled={propertyPoints === 0}
								>
									-
								</button>
								<span class="points-allocated">{propertyPoints}</span>
								<button 
									class="btn-small" 
									onclick={allocateToProperty}
									disabled={pointsToAllocate === 0}
								>
									+
								</button>
							</div>
						</div>
						<div class="bonus-description">
							<p>Start with a mortgage-free property. District upgrades with each point (cycles after 10).</p>
							<div class="bonus-preview">
								{#if startingPropertyDistrict}
									<p>District: <strong class="preview-value">{startingPropertyDistrict.main}</strong></p>
									{#if startingPropertyDistrict.extra.length > 0}
										<p>Bonus Property: <strong class="preview-value">District {startingPropertyDistrict.extra[0]}</strong></p>
									{/if}
								{:else}
									<p class="preview-value">No property bonus</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="actions">
				<button 
					class="btn-primary" 
					onclick={handlePrestige}
					disabled={pointsToAllocate > 0}
				>
					Prestige & Reset
				</button>
				<button class="btn-secondary" onclick={handleCancel}>
					Cancel
				</button>
			</div>
			
			{#if pointsToAllocate > 0}
				<p class="warning">You must allocate all points before prestiging!</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 2rem;
		overflow-y: auto;
	}

	.modal {
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		border: 3px solid #a855f7;
		border-radius: 1rem;
		padding: 2rem;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 0 40px rgba(168, 85, 247, 0.3);
	}

	h1 {
		color: #a855f7;
		text-align: center;
		margin: 0 0 1.5rem 0;
		font-size: 2rem;
		text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
	}

	h2 {
		color: #c084fc;
		margin: 0 0 1rem 0;
		font-size: 1.3rem;
	}

	h3 {
		color: #4ade80;
		margin: 0;
		font-size: 1.2rem;
	}

	.info-section {
		background: rgba(168, 85, 247, 0.1);
		border: 1px solid rgba(168, 85, 247, 0.3);
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.info-section p {
		color: #e5e7eb;
		margin: 0;
	}

	.highlight {
		color: #a855f7;
		font-weight: bold;
	}

	.allocation-section {
		margin-bottom: 2rem;
	}

	.points-remaining {
		color: #fbbf24;
		font-weight: bold;
		font-size: 1.5rem;
	}

	.bonus-options {
		display: grid;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.bonus-option {
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1.5rem;
		transition: border-color 0.2s;
	}

	.bonus-option:hover {
		border-color: rgba(168, 85, 247, 0.5);
	}

	.bonus-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.allocation-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.btn-small {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 0.5rem;
		background: #6366f1;
		color: white;
		font-size: 1.2rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-small:hover:not(:disabled) {
		background: #4f46e5;
		transform: scale(1.1);
	}

	.btn-small:disabled {
		background: #374151;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.points-allocated {
		font-size: 1.5rem;
		font-weight: bold;
		color: #fbbf24;
		min-width: 2rem;
		text-align: center;
	}

	.bonus-description {
		color: #e5e7eb;
	}

	.bonus-description p {
		margin: 0.5rem 0;
	}

	.bonus-preview {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-top: 1rem;
	}

	.preview-value {
		color: #a855f7;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	button {
		padding: 1rem 2rem;
		font-size: 1.1rem;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
		min-width: 180px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
	}

	.btn-primary:disabled {
		background: #374151;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.warning {
		text-align: center;
		color: #fbbf24;
		font-weight: 600;
		margin-top: 1rem;
	}

	.mt-2 {
		margin-top: 0.5rem;
	}

	@media (max-width: 768px) {
		.modal {
			padding: 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.bonus-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		button {
			min-width: 140px;
			padding: 0.875rem 1.5rem;
			font-size: 1rem;
		}
	}
</style>
