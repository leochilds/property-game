<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import { formatCurrency } from '$lib/utils/format';
	
	$: gameWin = $gameState.gameWin;
	
	function handleContinue() {
		gameState.dismissGameWinModal();
	}
	
	function handlePrestige() {
		gameState.openPrestigeModal();
	}
</script>

{#if gameWin}
	<div class="modal-backdrop">
		<div class="modal">
			<h1>🎉 Congratulations! 50 Years Complete! 🎉</h1>
			
			<div class="stats-grid">
				<div class="stat-section">
					<h2>Game Duration</h2>
					<p class="stat-value">
						{gameWin.finalStats.gameDuration.years} years, 
						{gameWin.finalStats.gameDuration.months} months, 
						{gameWin.finalStats.gameDuration.days} days
					</p>
				</div>
				
				<div class="stat-section">
					<h2>Portfolio Summary</h2>
					<p>Total Properties Owned: <strong>{gameWin.finalStats.totalPropertiesOwned}</strong></p>
					<p>Properties Sold: <strong>{gameWin.finalStats.totalPropertiesSold}</strong></p>
					<p>Current Portfolio: <strong>{gameWin.finalStats.currentPortfolio}</strong></p>
					<p>Peak Properties Owned: <strong>{gameWin.finalStats.peakPropertiesOwned}</strong></p>
				</div>
				
				<div class="stat-section">
					<h2>Financial Performance</h2>
					<p>Total Rent Income: <strong>{formatCurrency(gameWin.finalStats.totalRentIncome)}</strong></p>
					<p>Total Maintenance: <strong>{formatCurrency(gameWin.finalStats.totalMaintenanceCosts)}</strong></p>
					<p>Total Mortgage Interest: <strong>{formatCurrency(gameWin.finalStats.totalMortgageInterest)}</strong></p>
					<p>Total Staff Wages: <strong>{formatCurrency(gameWin.finalStats.totalStaffWages)}</strong></p>
				</div>
				
				<div class="stat-section">
					<h2>Net Worth</h2>
					<p>Final Net Worth: <strong class="highlight">{formatCurrency(gameWin.finalStats.finalNetWorth)}</strong></p>
					<p>Peak Net Worth: <strong>{formatCurrency(gameWin.finalStats.peakNetWorth)}</strong></p>
					<p class="small">Peaked on {gameWin.finalStats.peakNetWorthDate.day}/{gameWin.finalStats.peakNetWorthDate.month}/{gameWin.finalStats.peakNetWorthDate.year}</p>
				</div>
				
				{#if gameWin.finalStats.bestProperty}
					<div class="stat-section">
						<h2>Best Property</h2>
						<p><strong>{gameWin.finalStats.bestProperty.name}</strong></p>
						<p>Total Profit: <strong class="highlight">{formatCurrency(gameWin.finalStats.bestProperty.totalProfit)}</strong></p>
					</div>
				{/if}
				
				<div class="stat-section comparison">
					<h2>📊 Investment Performance</h2>
					<p class="comparison-label">Your Final Net Worth:</p>
					<p class="comparison-value player">{formatCurrency(gameWin.finalStats.finalNetWorth)}</p>
					
					<p class="comparison-label">If You Had Left It in the Bank:</p>
					<p class="comparison-value bank">{formatCurrency(gameWin.bankComparisonValue)}</p>
					
					{#if gameWin.finalStats.finalNetWorth > gameWin.bankComparisonValue}
						<p class="comparison-result success">
							🎯 Well done! You beat the bank by {formatCurrency(gameWin.finalStats.finalNetWorth - gameWin.bankComparisonValue)}!
						</p>
					{:else if gameWin.finalStats.finalNetWorth < gameWin.bankComparisonValue}
						<p class="comparison-result neutral">
							The bank would have earned {formatCurrency(gameWin.bankComparisonValue - gameWin.finalStats.finalNetWorth)} more.
							But you gained valuable experience!
						</p>
					{:else}
						<p class="comparison-result neutral">
							You matched the bank's performance exactly!
						</p>
					{/if}
				</div>
			</div>
			
			<div class="actions">
				<button class="btn-primary" on:click={handlePrestige}>
					Prestige & Start Again
				</button>
				<button class="btn-secondary" on:click={handleContinue}>
					Continue Playing
				</button>
			</div>
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
		border: 3px solid #ffd700;
		border-radius: 1rem;
		padding: 2rem;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
	}

	h1 {
		color: #ffd700;
		text-align: center;
		margin: 0 0 2rem 0;
		font-size: 2rem;
		text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-section {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.stat-section.comparison {
		grid-column: 1 / -1;
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
		border: 2px solid #ffd700;
	}

	h2 {
		color: #4ade80;
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
		border-bottom: 1px solid rgba(74, 222, 128, 0.3);
		padding-bottom: 0.5rem;
	}

	.stat-section p {
		color: #e5e7eb;
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	.stat-value {
		font-size: 1.1rem;
		color: #fbbf24;
	}

	.highlight {
		color: #ffd700;
		font-size: 1.2rem;
	}

	.small {
		font-size: 0.85rem;
		color: #9ca3af;
	}

	.comparison-label {
		font-size: 0.9rem;
		color: #9ca3af;
		margin-bottom: 0.25rem;
	}

	.comparison-value {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}

	.comparison-value.player {
		color: #4ade80;
	}

	.comparison-value.bank {
		color: #60a5fa;
	}

	.comparison-result {
		font-size: 1.1rem;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 1rem;
		text-align: center;
	}

	.comparison-result.success {
		background: rgba(74, 222, 128, 0.2);
		border: 1px solid #4ade80;
		color: #4ade80;
	}

	.comparison-result.neutral {
		background: rgba(96, 165, 250, 0.2);
		border: 1px solid #60a5fa;
		color: #60a5fa;
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
		min-width: 200px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
		color: #1a1a2e;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	@media (max-width: 768px) {
		.modal {
			padding: 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		button {
			min-width: 150px;
			padding: 0.875rem 1.5rem;
			font-size: 1rem;
		}
	}
</style>
