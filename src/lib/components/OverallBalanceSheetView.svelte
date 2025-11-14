<script lang="ts">
	import { gameState } from '../stores/gameState';
	import { formatCurrency, formatPercent } from '../utils/format';
	import { formatDate } from '../utils/date';

	$: history = $gameState.balanceSheetHistory;
	$: latestSnapshot = history.length > 0 ? history[history.length - 1] : null;
	$: previousSnapshot = history.length > 1 ? history[history.length - 2] : null;
</script>

<div class="overall-balance-sheet">
	<h2>Overall Balance Sheet</h2>

	{#if !latestSnapshot}
		<p class="no-data">No balance sheet data available yet. Data will be captured on April 6th each year (UK tax year start).</p>
	{:else}
		<div class="snapshot-date">
			<strong>As of:</strong> {formatDate(latestSnapshot.snapshotDate)}
		</div>

		<!-- Portfolio Overview -->
		<section class="section">
			<h3>Portfolio Overview</h3>
			<div class="metrics-grid">
				<div class="metric">
					<span class="label">Total Properties:</span>
					<span class="value">{latestSnapshot.totalProperties}</span>
				</div>
				<div class="metric">
					<span class="label">Cash:</span>
					<span class="value">{formatCurrency(latestSnapshot.totalCash)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Interest Earned:</span>
					<span class="value income">{formatCurrency(latestSnapshot.totalInterestEarned)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Property Value:</span>
					<span class="value">{formatCurrency(latestSnapshot.totalPropertyValue)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Equity:</span>
					<span class="value">{formatCurrency(latestSnapshot.totalEquity)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Debt:</span>
					<span class="value debt">{formatCurrency(latestSnapshot.totalDebt)}</span>
				</div>
				<div class="metric highlight">
					<span class="label">Net Worth:</span>
					<span class="value">{formatCurrency(latestSnapshot.netWorth)}</span>
				</div>
			</div>
		</section>

		<!-- Income & Expenses -->
		<section class="section">
			<h3>Income & Expenses (All Time)</h3>
			<div class="metrics-grid">
				<div class="metric">
					<span class="label">Total Rent Income:</span>
					<span class="value income">{formatCurrency(latestSnapshot.totalRentIncome)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Maintenance Costs:</span>
					<span class="value expense">{formatCurrency(latestSnapshot.totalMaintenanceCosts)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Mortgage Interest:</span>
					<span class="value expense">{formatCurrency(latestSnapshot.totalMortgageInterest)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Staff Costs:</span>
					<span class="value expense">{formatCurrency(latestSnapshot.totalStaffCosts)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Mortgage Principal:</span>
					<span class="value">{formatCurrency(latestSnapshot.totalMortgagePrincipal)}</span>
				</div>
				<div class="metric">
					<span class="label">Net Operating Income:</span>
					<span class="value {latestSnapshot.netOperatingIncome >= 0 ? 'income' : 'expense'}">{formatCurrency(latestSnapshot.netOperatingIncome)}</span>
				</div>
				<div class="metric highlight">
					<span class="label">Net Profit:</span>
					<span class="value {latestSnapshot.netProfit >= 0 ? 'income' : 'expense'}">{formatCurrency(latestSnapshot.netProfit)}</span>
				</div>
			</div>
		</section>

		<!-- Profitability -->
		<section class="section">
			<h3>Profitability</h3>
			<div class="metrics-grid">
				<div class="metric">
					<span class="label">Total Value Change:</span>
					<span class="value {latestSnapshot.totalValueChange >= 0 ? 'income' : 'expense'}">{formatCurrency(latestSnapshot.totalValueChange)}</span>
				</div>
				<div class="metric">
					<span class="label">Avg Value Change %:</span>
					<span class="value {latestSnapshot.totalValueChangePercent >= 0 ? 'income' : 'expense'}">{formatPercent(latestSnapshot.totalValueChangePercent)}</span>
				</div>
				<div class="metric">
					<span class="label">Total Gain:</span>
					<span class="value {latestSnapshot.totalGain >= 0 ? 'income' : 'expense'}">{formatCurrency(latestSnapshot.totalGain)}</span>
				</div>
				<div class="metric highlight">
					<span class="label">Portfolio ROI:</span>
					<span class="value {latestSnapshot.portfolioROI >= 0 ? 'income' : 'expense'}">{formatPercent(latestSnapshot.portfolioROI)}</span>
				</div>
			</div>
		</section>

		<!-- Debt Metrics -->
		{#if latestSnapshot.totalDebt > 0}
			<section class="section">
				<h3>Debt Metrics</h3>
				<div class="metrics-grid">
					<div class="metric">
						<span class="label">Avg Interest Rate:</span>
						<span class="value">{formatPercent(latestSnapshot.avgInterestRate)}</span>
					</div>
					<div class="metric">
						<span class="label">Debt to Value Ratio:</span>
						<span class="value">{formatPercent(latestSnapshot.debtToValueRatio)}</span>
					</div>
					<div class="metric">
						<span class="label">Avg Equity %:</span>
						<span class="value">{formatPercent(latestSnapshot.avgEquityPercent)}</span>
					</div>
				</div>
			</section>
		{/if}

		<!-- Cash Flow -->
		<section class="section">
			<h3>Monthly Cash Flow (Current)</h3>
			<div class="metrics-grid">
				<div class="metric">
					<span class="label">Monthly Rent Income:</span>
					<span class="value income">{formatCurrency(latestSnapshot.avgMonthlyRentIncome)}</span>
				</div>
				<div class="metric">
					<span class="label">Monthly Mortgage Payments:</span>
					<span class="value expense">{formatCurrency(latestSnapshot.avgMonthlyMortgagePayment)}</span>
				</div>
				<div class="metric">
					<span class="label">Monthly Staff Costs:</span>
					<span class="value expense">{formatCurrency(latestSnapshot.monthlyStaffCosts)}</span>
				</div>
				<div class="metric highlight">
					<span class="label">Net Monthly Cash Flow:</span>
					<span class="value {latestSnapshot.monthlyCashFlow >= 0 ? 'income' : 'expense'}">{formatCurrency(latestSnapshot.monthlyCashFlow)}</span>
				</div>
			</div>
		</section>

		<!-- Year over Year Change -->
		{#if previousSnapshot}
			<section class="section">
				<h3>Change from Previous Tax Year</h3>
				<div class="metrics-grid">
					<div class="metric">
						<span class="label">Net Worth Change:</span>
						<span class="value {(latestSnapshot.netWorth - previousSnapshot.netWorth) >= 0 ? 'income' : 'expense'}">
							{formatCurrency(latestSnapshot.netWorth - previousSnapshot.netWorth)}
						</span>
					</div>
					<div class="metric">
						<span class="label">Properties Change:</span>
						<span class="value">
							{latestSnapshot.totalProperties - previousSnapshot.totalProperties > 0 ? '+' : ''}{latestSnapshot.totalProperties - previousSnapshot.totalProperties}
						</span>
					</div>
					<div class="metric">
						<span class="label">Debt Change:</span>
						<span class="value {(latestSnapshot.totalDebt - previousSnapshot.totalDebt) <= 0 ? 'income' : 'expense'}">
							{formatCurrency(latestSnapshot.totalDebt - previousSnapshot.totalDebt)}
						</span>
					</div>
				</div>
			</section>
		{/if}

		<!-- Historical Data -->
		{#if history.length > 1}
			<section class="section">
				<h3>Historical Snapshots ({history.length} tax years)</h3>
				<div class="history-table-wrapper">
					<table class="history-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Net Worth</th>
								<th>Properties</th>
								<th>Total Equity</th>
								<th>Total Debt</th>
								<th>Monthly Cash Flow</th>
								<th>Portfolio ROI</th>
							</tr>
						</thead>
						<tbody>
							{#each history.slice().reverse() as snapshot}
								<tr>
									<td>{formatDate(snapshot.snapshotDate)}</td>
									<td>{formatCurrency(snapshot.netWorth)}</td>
									<td>{snapshot.totalProperties}</td>
									<td>{formatCurrency(snapshot.totalEquity)}</td>
									<td>{formatCurrency(snapshot.totalDebt)}</td>
									<td class={snapshot.monthlyCashFlow >= 0 ? 'income' : 'expense'}>
										{formatCurrency(snapshot.monthlyCashFlow)}
									</td>
									<td class={snapshot.portfolioROI >= 0 ? 'income' : 'expense'}>
										{formatPercent(snapshot.portfolioROI)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.overall-balance-sheet {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	h2 {
		margin-bottom: 20px;
		color: white;
		font-size: 2rem;
		font-weight: bold;
	}

	h3 {
		margin-bottom: 15px;
		color: #e2e8f0;
		font-size: 1.25rem;
		font-weight: 600;
		border-bottom: 2px solid #3b82f6;
		padding-bottom: 8px;
	}

	.snapshot-date {
		margin-bottom: 20px;
		padding: 12px;
		background-color: #334155;
		border-radius: 8px;
		font-size: 1.1em;
		color: #e2e8f0;
		border: 1px solid #475569;
	}

	.no-data {
		padding: 60px 40px;
		text-align: center;
		color: #94a3b8;
		font-style: italic;
		background-color: #1e293b;
		border-radius: 8px;
		border: 1px solid #334155;
		font-size: 1.1rem;
	}

	.section {
		margin-bottom: 30px;
		padding: 24px;
		background-color: #1e293b;
		border-radius: 8px;
		border: 1px solid #334155;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 15px;
	}

	.metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 15px;
		background-color: #334155;
		border-radius: 6px;
		border-left: 3px solid #475569;
	}

	.metric.highlight {
		background-color: #1e3a5f;
		border-left-color: #3b82f6;
		font-weight: bold;
	}

	.metric .label {
		color: #94a3b8;
		font-size: 0.9em;
	}

	.metric .value {
		font-weight: 600;
		font-size: 1.1em;
		color: white;
	}

	.value.income {
		color: #4ade80;
	}

	.value.expense {
		color: #f87171;
	}

	.value.debt {
		color: #fb923c;
	}

	.history-table-wrapper {
		overflow-x: auto;
		background-color: #334155;
		border-radius: 8px;
		border: 1px solid #475569;
	}

	.history-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0;
	}

	.history-table th,
	.history-table td {
		padding: 12px;
		text-align: left;
		border-bottom: 1px solid #475569;
		color: #e2e8f0;
	}

	.history-table th {
		background-color: #1e293b;
		color: #e2e8f0;
		font-weight: 600;
		position: sticky;
		top: 0;
	}

	.history-table tbody tr {
		background-color: #334155;
	}

	.history-table tbody tr:hover {
		background-color: #475569;
	}

	.history-table td.income {
		color: #4ade80;
	}

	.history-table td.expense {
		color: #f87171;
	}
</style>
