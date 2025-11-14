<script lang="ts">
	import type { GameOver } from '$lib/types/game';
	import { formatDate } from '$lib/utils/date';
	import { formatCurrency } from '$lib/utils/format';
	import { gameState } from '$lib/stores/gameState';

	export let gameOver: GameOver;

	function handleNewGame() {
		gameState.reset();
	}
</script>

<div class="modal-overlay">
	<div class="modal-content">
		<div class="modal-header">
			<h1>🏚️ Foreclosed</h1>
			<p class="subtitle">Your property empire has ended</p>
		</div>

		<div class="modal-body">
			<div class="stats-grid">
				<!-- Duration -->
				<div class="stats-section">
					<h2 class="section-title">Game Duration</h2>
					<div class="stats-row">
						<span class="label">Total Time:</span>
						<span class="value">
							{gameOver.finalStats.gameDuration.years} years, {gameOver.finalStats.gameDuration.months} months, {gameOver.finalStats.gameDuration.days} days
						</span>
					</div>
					<div class="stats-row">
						<span class="label">Ended:</span>
						<span class="value">{formatDate(gameOver.triggeredDate)}</span>
					</div>
				</div>

				<!-- Property Portfolio -->
				<div class="stats-section">
					<h2 class="section-title">Property Portfolio</h2>
					<div class="stats-row">
						<span class="label">Total Properties Owned:</span>
						<span class="value highlight">{gameOver.finalStats.totalPropertiesOwned}</span>
					</div>
					<div class="stats-row">
						<span class="label">Properties Sold:</span>
						<span class="value">{gameOver.finalStats.totalPropertiesSold}</span>
					</div>
					<div class="stats-row">
						<span class="label">Current Portfolio:</span>
						<span class="value">{gameOver.finalStats.currentPortfolio}</span>
					</div>
				</div>

				<!-- Financial Performance -->
				<div class="stats-section">
					<h2 class="section-title">Financial Performance</h2>
					<div class="stats-row">
						<span class="label">Total Rent Income:</span>
						<span class="value positive">{formatCurrency(gameOver.finalStats.totalRentIncome)}</span>
					</div>
					<div class="stats-row">
						<span class="label">Total Maintenance:</span>
						<span class="value negative">{formatCurrency(gameOver.finalStats.totalMaintenanceCosts)}</span>
					</div>
					<div class="stats-row">
						<span class="label">Total Mortgage Interest:</span>
						<span class="value negative">{formatCurrency(gameOver.finalStats.totalMortgageInterest)}</span>
					</div>
					<div class="stats-row">
						<span class="label">Total Staff Wages:</span>
						<span class="value negative">{formatCurrency(gameOver.finalStats.totalStaffWages)}</span>
					</div>
					<div class="stats-row final">
						<span class="label">Final Debt:</span>
						<span class="value danger">{formatCurrency(gameOver.finalStats.totalDebt)}</span>
					</div>
				</div>

				<!-- Peak Performance -->
				<div class="stats-section">
					<h2 class="section-title">Peak Performance</h2>
					<div class="stats-row">
						<span class="label">Peak Net Worth:</span>
						<span class="value highlight">{formatCurrency(gameOver.finalStats.peakNetWorth)}</span>
					</div>
					<div class="stats-row">
						<span class="label">Achieved:</span>
						<span class="value">{formatDate(gameOver.finalStats.peakNetWorthDate)}</span>
					</div>
					<div class="stats-row">
						<span class="label">Peak Properties Owned:</span>
						<span class="value highlight">{gameOver.finalStats.peakPropertiesOwned}</span>
					</div>
				</div>

				{#if gameOver.finalStats.bestProperty}
					<!-- Best Property -->
					<div class="stats-section">
						<h2 class="section-title">Best Property</h2>
						<div class="stats-row">
							<span class="label">Name:</span>
							<span class="value">{gameOver.finalStats.bestProperty.name}</span>
						</div>
						<div class="stats-row">
							<span class="label">Total Profit:</span>
							<span class="value positive">{formatCurrency(gameOver.finalStats.bestProperty.totalProfit)}</span>
						</div>
					</div>
				{/if}
			</div>

			<div class="actions">
				<button class="btn-primary" on:click={handleNewGame}>
					Start New Game
				</button>
			</div>
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
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-content {
		background-color: white;
		border-radius: 12px;
		max-width: 900px;
		width: 100%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
		overflow: hidden;
		margin: auto;
	}

	.modal-header {
		padding: 2.5rem 2rem;
		text-align: center;
		background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
		color: white;
	}

	.modal-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		font-weight: 800;
	}

	.subtitle {
		margin: 0;
		font-size: 1.125rem;
		opacity: 0.9;
	}

	.modal-body {
		padding: 2rem;
		max-height: 70vh;
		overflow-y: auto;
	}

	.stats-grid {
		display: grid;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.stats-section {
		background-color: #f9fafb;
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 1rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #d1d5db;
	}

	.stats-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.stats-row:last-child {
		border-bottom: none;
	}

	.stats-row.final {
		padding-top: 1rem;
		margin-top: 0.5rem;
		border-top: 2px solid #d1d5db;
		font-weight: 600;
	}

	.label {
		font-weight: 500;
		color: #6b7280;
	}

	.value {
		font-weight: 600;
		color: #111827;
		text-align: right;
	}

	.value.positive {
		color: #059669;
	}

	.value.negative {
		color: #dc2626;
	}

	.value.danger {
		color: #991b1b;
		font-weight: 700;
		font-size: 1.125rem;
	}

	.value.highlight {
		color: #2563eb;
		font-weight: 700;
	}

	.actions {
		display: flex;
		justify-content: center;
		padding-top: 1rem;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
		padding: 1rem 3rem;
		border: none;
		border-radius: 8px;
		font-size: 1.125rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
	}

	.btn-primary:hover {
		background-color: #2563eb;
		transform: translateY(-2px);
		box-shadow: 0 8px 12px -2px rgba(59, 130, 246, 0.4);
	}

	.btn-primary:active {
		background-color: #1d4ed8;
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		.modal-body {
			padding: 1.5rem;
		}

		.stats-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.value {
			text-align: left;
		}

		.modal-header h1 {
			font-size: 2rem;
		}
	}
</style>
