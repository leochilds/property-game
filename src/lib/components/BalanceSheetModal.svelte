<script lang="ts">
	import { gameState } from '../stores/gameState';
	import { formatCurrency, formatPercent } from '../utils/format';
	import { formatDate } from '../utils/date';

	$: latestSnapshot = $gameState.balanceSheetHistory.length > 0 
		? $gameState.balanceSheetHistory[$gameState.balanceSheetHistory.length - 1] 
		: null;
	
	$: previousSnapshot = $gameState.balanceSheetHistory.length > 1 
		? $gameState.balanceSheetHistory[$gameState.balanceSheetHistory.length - 2] 
		: null;

	function handleContinue() {
		gameState.dismissBalanceSheetModal();
	}
</script>

<div class="modal-overlay">
	<div class="modal-container">
		<div class="modal-header">
			<h1 class="modal-title">📊 Tax Year Balance Sheet</h1>
			<div class="snapshot-date">
				{#if latestSnapshot}
					<span>As of {formatDate(latestSnapshot.snapshotDate)}</span>
				{/if}
			</div>
		</div>

		<div class="modal-body">
			{#if !latestSnapshot}
				<p class="no-data">No balance sheet data available.</p>
			{:else}
				<!-- Key Metrics -->
				<section class="section highlight-section">
					<h2>Key Metrics</h2>
					<div class="metrics-grid large">
						<div class="metric-card primary">
							<div class="metric-label">Net Worth</div>
							<div class="metric-value">{formatCurrency(latestSnapshot.netWorth)}</div>
						</div>
						<div class="metric-card">
							<div class="metric-label">Total Properties</div>
							<div class="metric-value">{latestSnapshot.totalProperties}</div>
						</div>
						<div class="metric-card">
							<div class="metric-label">Total Equity</div>
							<div class="metric-value">{formatCurrency(latestSnapshot.totalEquity)}</div>
						</div>
						<div class="metric-card">
							<div class="metric-label">Portfolio ROI</div>
							<div class="metric-value {latestSnapshot.portfolioROI >= 0 ? 'positive' : 'negative'}">
								{formatPercent(latestSnapshot.portfolioROI)}
							</div>
						</div>
					</div>
				</section>

				<!-- Year over Year Comparison -->
				{#if previousSnapshot}
					<section class="section">
						<h2>Change from Previous Year</h2>
						<div class="metrics-grid">
							<div class="metric-item">
								<span class="label">Net Worth Change:</span>
								<span class="value {(latestSnapshot.netWorth - previousSnapshot.netWorth) >= 0 ? 'positive' : 'negative'}">
									{formatCurrency(latestSnapshot.netWorth - previousSnapshot.netWorth)}
								</span>
							</div>
							<div class="metric-item">
								<span class="label">Properties Change:</span>
								<span class="value">
									{latestSnapshot.totalProperties - previousSnapshot.totalProperties > 0 ? '+' : ''}{latestSnapshot.totalProperties - previousSnapshot.totalProperties}
								</span>
							</div>
							<div class="metric-item">
								<span class="label">Debt Change:</span>
								<span class="value {(latestSnapshot.totalDebt - previousSnapshot.totalDebt) <= 0 ? 'positive' : 'negative'}">
									{formatCurrency(latestSnapshot.totalDebt - previousSnapshot.totalDebt)}
								</span>
							</div>
						</div>
					</section>
				{/if}

				<!-- Financial Summary -->
				<section class="section">
					<h2>Financial Summary</h2>
					<div class="metrics-grid">
						<div class="metric-item">
							<span class="label">Cash:</span>
							<span class="value">{formatCurrency(latestSnapshot.totalCash)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Total Interest Earned:</span>
							<span class="value positive">{formatCurrency(latestSnapshot.totalInterestEarned)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Property Value:</span>
							<span class="value">{formatCurrency(latestSnapshot.totalPropertyValue)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Total Debt:</span>
							<span class="value debt">{formatCurrency(latestSnapshot.totalDebt)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Monthly Cash Flow:</span>
							<span class="value {latestSnapshot.monthlyCashFlow >= 0 ? 'positive' : 'negative'}">
								{formatCurrency(latestSnapshot.monthlyCashFlow)}
							</span>
						</div>
					</div>
				</section>

				<!-- Performance -->
				<section class="section">
					<h2>Performance (All Time)</h2>
					<div class="metrics-grid">
						<div class="metric-item">
							<span class="label">Total Rent Income:</span>
							<span class="value positive">{formatCurrency(latestSnapshot.totalRentIncome)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Total Maintenance:</span>
							<span class="value negative">{formatCurrency(latestSnapshot.totalMaintenanceCosts)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Total Staff Costs:</span>
							<span class="value negative">{formatCurrency(latestSnapshot.totalStaffCosts)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Total Mortgage Interest:</span>
							<span class="value negative">{formatCurrency(latestSnapshot.totalMortgageInterest)}</span>
						</div>
						<div class="metric-item">
							<span class="label">Net Profit:</span>
							<span class="value {latestSnapshot.netProfit >= 0 ? 'positive' : 'negative'}">
								{formatCurrency(latestSnapshot.netProfit)}
							</span>
						</div>
						<div class="metric-item">
							<span class="label">Value Change:</span>
							<span class="value {latestSnapshot.totalValueChange >= 0 ? 'positive' : 'negative'}">
								{formatCurrency(latestSnapshot.totalValueChange)}
							</span>
						</div>
					</div>
				</section>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="continue-button" onclick={handleContinue}>
				Continue Game
			</button>
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
		background-color: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
	}

	.modal-container {
		background: linear-gradient(to bottom, #1e293b, #0f172a);
		border-radius: 12px;
		border: 2px solid #3b82f6;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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

	.snapshot-date {
		text-align: center;
		font-size: 1.1rem;
		color: #94a3b8;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	.modal-footer {
		padding: 20px 24px;
		border-top: 2px solid #334155;
		display: flex;
		justify-content: center;
	}

	.continue-button {
		padding: 14px 48px;
		background: linear-gradient(to bottom, #3b82f6, #2563eb);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.2rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
	}

	.continue-button:hover {
		background: linear-gradient(to bottom, #2563eb, #1d4ed8);
		transform: translateY(-2px);
		box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.4);
	}

	.continue-button:active {
		transform: translateY(0);
	}

	.section {
		margin-bottom: 24px;
		padding: 20px;
		background-color: #1e293b;
		border-radius: 8px;
		border: 1px solid #334155;
	}

	.highlight-section {
		background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
		border: 2px solid #3b82f6;
	}

	.section h2 {
		margin: 0 0 16px 0;
		color: #e2e8f0;
		font-size: 1.25rem;
		font-weight: 600;
		border-bottom: 2px solid #3b82f6;
		padding-bottom: 8px;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	.metrics-grid.large {
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 16px;
	}

	.metric-card {
		padding: 16px;
		background-color: #334155;
		border-radius: 8px;
		border: 1px solid #475569;
		text-align: center;
	}

	.metric-card.primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border: 2px solid #60a5fa;
	}

	.metric-label {
		font-size: 0.9rem;
		color: #94a3b8;
		margin-bottom: 8px;
	}

	.metric-card.primary .metric-label {
		color: #dbeafe;
	}

	.metric-value {
		font-size: 1.5rem;
		font-weight: bold;
		color: white;
	}

	.metric-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		background-color: #334155;
		border-radius: 6px;
	}

	.metric-item .label {
		color: #94a3b8;
		font-size: 0.95rem;
	}

	.metric-item .value {
		font-weight: 600;
		font-size: 1.1rem;
		color: white;
	}

	.value.positive, .metric-value.positive {
		color: #4ade80;
	}

	.value.negative, .metric-value.negative {
		color: #f87171;
	}

	.value.debt {
		color: #fb923c;
	}

	.no-data {
		text-align: center;
		padding: 40px;
		color: #94a3b8;
		font-size: 1.1rem;
	}

	/* Scrollbar styling */
	.modal-body::-webkit-scrollbar {
		width: 8px;
	}

	.modal-body::-webkit-scrollbar-track {
		background: #0f172a;
		border-radius: 4px;
	}

	.modal-body::-webkit-scrollbar-thumb {
		background: #475569;
		border-radius: 4px;
	}

	.modal-body::-webkit-scrollbar-thumb:hover {
		background: #64748b;
	}
</style>
