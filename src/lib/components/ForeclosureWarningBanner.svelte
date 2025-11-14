<script lang="ts">
	import { formatCurrency } from '$lib/utils/format';
	import type { ForeclosureWarning } from '$lib/types/game';

	export let foreclosureWarning: ForeclosureWarning;
</script>

<div class="foreclosure-banner">
	<div class="warning-icon">⚠️</div>
	<div class="warning-content">
		<h2 class="warning-title">FORECLOSURE WARNING</h2>
		<p class="warning-countdown">
			<strong>{foreclosureWarning.daysRemaining} days remaining</strong>
		</p>
		<div class="warning-details">
			<div class="detail-item">
				<span class="label">Cash Debt:</span>
				<span class="value danger">{formatCurrency(foreclosureWarning.currentDebt)}</span>
			</div>
			<div class="detail-item">
				<span class="label">Total Equity:</span>
				<span class="value">{formatCurrency(foreclosureWarning.currentEquity)}</span>
			</div>
			<div class="detail-item">
				<span class="label">Requirement:</span>
				<span class="value">
					Debt must be below {formatCurrency(foreclosureWarning.currentEquity * 2)}
				</span>
			</div>
		</div>
		<p class="warning-advice">
			<strong>Action Required:</strong> Your cash debt exceeds twice your property equity. Sell
			properties or pay down debt immediately to avoid foreclosure!
		</p>
	</div>
</div>

<style>
	.foreclosure-banner {
		position: sticky;
		top: 0;
		z-index: 1000;
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		color: white;
		padding: 1.5rem;
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.2),
			0 2px 4px -1px rgba(0, 0, 0, 0.1);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow:
				0 4px 6px -1px rgba(0, 0, 0, 0.2),
				0 2px 4px -1px rgba(0, 0, 0, 0.1);
		}
		50% {
			box-shadow:
				0 8px 16px -2px rgba(220, 38, 38, 0.4),
				0 4px 8px -2px rgba(185, 28, 28, 0.3);
		}
	}

	.warning-icon {
		font-size: 3rem;
		line-height: 1;
		flex-shrink: 0;
		animation: shake 0.5s ease-in-out infinite;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-5px);
		}
		75% {
			transform: translateX(5px);
		}
	}

	.warning-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.warning-title {
		font-size: 1.5rem;
		font-weight: 800;
		margin: 0;
		letter-spacing: 0.05em;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.warning-countdown {
		font-size: 1.25rem;
		margin: 0;
	}

	.warning-countdown strong {
		font-size: 1.5rem;
		text-decoration: underline;
	}

	.warning-details {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
		padding: 0.75rem 0;
		border-top: 2px solid rgba(255, 255, 255, 0.3);
		border-bottom: 2px solid rgba(255, 255, 255, 0.3);
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.875rem;
		opacity: 0.9;
		font-weight: 600;
	}

	.value {
		font-size: 1.125rem;
		font-weight: 700;
	}

	.value.danger {
		color: #fef2f2;
		text-shadow: 0 0 8px rgba(254, 242, 242, 0.5);
	}

	.warning-advice {
		font-size: 1rem;
		margin: 0;
		line-height: 1.6;
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
	}

	@media (max-width: 768px) {
		.foreclosure-banner {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}

		.warning-icon {
			font-size: 2rem;
		}

		.warning-title {
			font-size: 1.25rem;
		}

		.warning-details {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
