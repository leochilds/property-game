<script lang="ts">
	import type { GameEndState } from '$lib/types/game';
	import { formatDate } from '$lib/utils/date';
	import { formatCurrency } from '$lib/utils/format';
	import { gameState } from '$lib/stores/gameState';

	export let gameEndState: GameEndState;

	function handleNewGame() {
		gameState.reset();
	}
</script>

<div class="modal-overlay">
	<div class="modal-content">
		<div class="modal-header" class:victory={gameEndState.reason === 'victory'} class:bankruptcy={gameEndState.reason === 'bankruptcy'}>
			{#if gameEndState.reason === 'victory'}
				<h1>🎉 Victory!</h1>
			{:else}
				<h1>💔 Game Over</h1>
			{/if}
		</div>

		<div class="modal-body">
			<p class="message">{gameEndState.message}</p>

			<div class="stats">
				<div class="stat">
					<span class="label">Final Net Worth:</span>
					<span class="value" class:positive={gameEndState.finalNetWorth >= 0} class:negative={gameEndState.finalNetWorth < 0}>
						{formatCurrency(gameEndState.finalNetWorth)}
					</span>
				</div>
				<div class="stat">
					<span class="label">Game Ended:</span>
					<span class="value">{formatDate(gameEndState.finalDate)}</span>
				</div>
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
		background-color: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background-color: white;
		border-radius: 8px;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	.modal-header {
		padding: 2rem;
		text-align: center;
		color: white;
	}

	.modal-header.victory {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.modal-header.bankruptcy {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.modal-header h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: bold;
	}

	.modal-body {
		padding: 2rem;
	}

	.message {
		font-size: 1.125rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		text-align: center;
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background-color: #f3f4f6;
		border-radius: 8px;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat .label {
		font-weight: 600;
		color: #4b5563;
	}

	.stat .value {
		font-weight: bold;
		font-size: 1.125rem;
	}

	.stat .value.positive {
		color: #10b981;
	}

	.stat .value.negative {
		color: #ef4444;
	}

	.actions {
		display: flex;
		justify-content: center;
	}

	.btn-primary {
		background-color: #3b82f6;
		color: white;
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-primary:hover {
		background-color: #2563eb;
	}

	.btn-primary:active {
		background-color: #1d4ed8;
	}
</style>
