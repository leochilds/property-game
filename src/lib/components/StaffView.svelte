<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import { formatCurrency } from '$lib/utils/format';
	import type { District, StaffType, ExperienceLevel } from '$lib/types/game';
	import { PROPERTIES_PER_LEVEL, EXPERIENCE_THRESHOLDS, PROMOTION_BONUS_MULTIPLIER, DISTRICT_BASE_SALARIES } from '$lib/types/game';

	let showHireModal = false;
	let hireType: StaffType = 'estate-agent';
	let hireDistrict: District = 1;

	$: totalEstateAgentWages = $gameState.staff.estateAgents.reduce((sum, agent) => sum + agent.currentSalary, 0);
	$: totalCaretakerWages = $gameState.staff.caretakers.reduce((sum, caretaker) => sum + caretaker.currentSalary, 0);
	$: totalMonthlyWages = totalEstateAgentWages + totalCaretakerWages;
	$: totalUnpaidWages = [...$gameState.staff.estateAgents, ...$gameState.staff.caretakers].reduce((sum, staff) => sum + staff.unpaidWages, 0);

	function openHireModal(type: StaffType) {
		hireType = type;
		showHireModal = true;
	}

	function handleHire() {
		gameState.hireStaff(hireType, hireDistrict);
		showHireModal = false;
	}

	function handleFire(staffId: string, type: StaffType) {
		if (confirm(`Are you sure you want to fire this ${type === 'estate-agent' ? 'estate agent' : 'caretaker'}?`)) {
			gameState.fireStaff(staffId, type);
		}
	}

	function handlePromote(staffId: string, type: StaffType) {
		gameState.promoteStaff(staffId, type);
	}

	function getProperty(propertyId: string) {
		return $gameState.player.properties.find(p => p.id === propertyId);
	}

	function canPromote(staff: { experienceLevel: ExperienceLevel; experiencePoints: number; currentSalary: number }): boolean {
		if (staff.experienceLevel >= 6) return false;
		const nextLevel = (staff.experienceLevel + 1) as ExperienceLevel;
		const requiredXP = EXPERIENCE_THRESHOLDS[nextLevel];
		const bonus = staff.currentSalary * PROMOTION_BONUS_MULTIPLIER;
		return staff.experiencePoints >= requiredXP && $gameState.player.cash >= bonus;
	}

	function getXPProgress(staff: { experienceLevel: ExperienceLevel; experiencePoints: number }): number {
		if (staff.experienceLevel >= 6) return 100;
		const nextLevel = (staff.experienceLevel + 1) as ExperienceLevel;
		const requiredXP = EXPERIENCE_THRESHOLDS[nextLevel];
		return (staff.experiencePoints / requiredXP) * 100;
	}

	function getLevelStars(level: ExperienceLevel): string {
		if (level === 6) return '👑 Elite';
		return '⭐'.repeat(level);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
		<h2 class="text-2xl font-bold mb-4">Staff Management</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
			<div>
				<span class="text-slate-400">Total Staff:</span>
				<div class="text-lg font-semibold">{$gameState.staff.estateAgents.length + $gameState.staff.caretakers.length}</div>
			</div>
			<div>
				<span class="text-slate-400">Monthly Wages:</span>
				<div class="text-lg font-semibold text-red-400">{formatCurrency(totalMonthlyWages)}</div>
			</div>
			{#if totalUnpaidWages > 0}
				<div>
					<span class="text-slate-400">Unpaid Wages:</span>
					<div class="text-lg font-semibold text-orange-400">{formatCurrency(totalUnpaidWages)}</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Estate Agents -->
	<div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
		<div class="flex justify-between items-center mb-4">
			<div>
				<h3 class="text-xl font-bold">Estate Agents</h3>
				<p class="text-sm text-slate-400">Automatically list and adjust rental listings</p>
			</div>
			<button
				onclick={() => openHireModal('estate-agent')}
				class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
			>
				+ Hire Estate Agent
			</button>
		</div>

		{#if $gameState.staff.estateAgents.length === 0}
			<div class="text-center py-8 text-slate-400">
				<p>No estate agents hired yet</p>
				<p class="text-sm mt-2">Estate agents will automatically list properties and adjust pricing to find tenants</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each $gameState.staff.estateAgents as agent}
					{@const capacity = PROPERTIES_PER_LEVEL[agent.experienceLevel]}
					{@const nextLevel = (agent.experienceLevel + 1) as ExperienceLevel}
					{@const promotionBonus = agent.currentSalary * PROMOTION_BONUS_MULTIPLIER}
					<div class="bg-slate-700 rounded-lg p-4 border border-slate-600">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h4 class="font-bold text-lg">{agent.name}</h4>
								<p class="text-sm text-slate-400">District {agent.district}</p>
							</div>
							<div class="text-right">
								<div class="text-xs text-slate-400">Level {agent.experienceLevel}</div>
								<div class="text-yellow-400">{getLevelStars(agent.experienceLevel)}</div>
							</div>
						</div>

						<div class="space-y-2 text-sm mb-3">
							<div class="flex justify-between">
								<span class="text-slate-400">Monthly Wage:</span>
								<span class="font-semibold text-red-400">{formatCurrency(agent.currentSalary)}</span>
							</div>
							{#if agent.unpaidWages > 0}
								<div class="flex justify-between">
									<span class="text-slate-400">Unpaid:</span>
									<span class="font-semibold text-orange-400">{formatCurrency(agent.unpaidWages)} ({agent.monthsUnpaid} months)</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span class="text-slate-400">Capacity:</span>
								<span class="font-semibold {agent.assignedProperties.length >= capacity ? 'text-red-400' : 'text-green-400'}">
									{agent.assignedProperties.length}/{capacity}
								</span>
							</div>
						</div>

						<!-- XP Progress -->
						{#if agent.experienceLevel < 6}
							<div class="mb-3">
								<div class="flex justify-between text-xs text-slate-400 mb-1">
									<span>Experience</span>
									<span>{agent.experiencePoints}/{EXPERIENCE_THRESHOLDS[nextLevel]} XP</span>
								</div>
								<div class="w-full bg-slate-600 rounded-full h-2">
									<div 
										class="bg-blue-500 h-2 rounded-full transition-all"
										style="width: {getXPProgress(agent)}%"
									></div>
								</div>
							</div>
						{:else}
							<div class="text-center text-sm text-yellow-400 mb-3">
								👑 Elite Level 👑
							</div>
						{/if}

						<!-- Assigned Properties -->
						{#if agent.assignedProperties.length > 0}
							<div class="mb-3">
								<div class="text-xs text-slate-400 mb-1">Managing:</div>
								<div class="space-y-1">
									{#each agent.assignedProperties as propId}
										{@const property = getProperty(propId)}
										{#if property}
											<div class="text-xs bg-slate-600 rounded px-2 py-1">
												{property.name}
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-2">
							{#if canPromote(agent)}
								<button
									onclick={() => handlePromote(agent.id, 'estate-agent')}
									class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold transition-colors"
									title="Bonus: {formatCurrency(promotionBonus)}"
								>
									Promote
								</button>
							{/if}
							<button
								onclick={() => handleFire(agent.id, 'estate-agent')}
								class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
							>
								Fire
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Caretakers -->
	<div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
		<div class="flex justify-between items-center mb-4">
			<div>
				<h3 class="text-xl font-bold">Caretakers</h3>
				<p class="text-sm text-slate-400">Automatically maintain properties below 90%</p>
			</div>
			<button
				onclick={() => openHireModal('caretaker')}
				class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
			>
				+ Hire Caretaker
			</button>
		</div>

		{#if $gameState.staff.caretakers.length === 0}
			<div class="text-center py-8 text-slate-400">
				<p>No caretakers hired yet</p>
				<p class="text-sm mt-2">Caretakers will automatically perform maintenance on vacant properties</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each $gameState.staff.caretakers as caretaker}
					{@const capacity = PROPERTIES_PER_LEVEL[caretaker.experienceLevel]}
					{@const nextLevel = (caretaker.experienceLevel + 1) as ExperienceLevel}
					{@const promotionBonus = caretaker.currentSalary * PROMOTION_BONUS_MULTIPLIER}
					<div class="bg-slate-700 rounded-lg p-4 border border-slate-600">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h4 class="font-bold text-lg">{caretaker.name}</h4>
								<p class="text-sm text-slate-400">District {caretaker.district}</p>
							</div>
							<div class="text-right">
								<div class="text-xs text-slate-400">Level {caretaker.experienceLevel}</div>
								<div class="text-yellow-400">{getLevelStars(caretaker.experienceLevel)}</div>
							</div>
						</div>

						<div class="space-y-2 text-sm mb-3">
							<div class="flex justify-between">
								<span class="text-slate-400">Monthly Wage:</span>
								<span class="font-semibold text-red-400">{formatCurrency(caretaker.currentSalary)}</span>
							</div>
							{#if caretaker.unpaidWages > 0}
								<div class="flex justify-between">
									<span class="text-slate-400">Unpaid:</span>
									<span class="font-semibold text-orange-400">{formatCurrency(caretaker.unpaidWages)} ({caretaker.monthsUnpaid} months)</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span class="text-slate-400">Capacity:</span>
								<span class="font-semibold {caretaker.assignedProperties.length >= capacity ? 'text-red-400' : 'text-green-400'}">
									{caretaker.assignedProperties.length}/{capacity}
								</span>
							</div>
						</div>

						<!-- XP Progress -->
						{#if caretaker.experienceLevel < 6}
							<div class="mb-3">
								<div class="flex justify-between text-xs text-slate-400 mb-1">
									<span>Experience</span>
									<span>{caretaker.experiencePoints}/{EXPERIENCE_THRESHOLDS[nextLevel]} XP</span>
								</div>
								<div class="w-full bg-slate-600 rounded-full h-2">
									<div 
										class="bg-purple-500 h-2 rounded-full transition-all"
										style="width: {getXPProgress(caretaker)}%"
									></div>
								</div>
							</div>
						{:else}
							<div class="text-center text-sm text-yellow-400 mb-3">
								👑 Elite Level 👑
							</div>
						{/if}

						<!-- Assigned Properties -->
						{#if caretaker.assignedProperties.length > 0}
							<div class="mb-3">
								<div class="text-xs text-slate-400 mb-1">Managing:</div>
								<div class="space-y-1">
									{#each caretaker.assignedProperties as propId}
										{@const property = getProperty(propId)}
										{#if property}
											<div class="text-xs bg-slate-600 rounded px-2 py-1">
												{property.name}
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-2">
							{#if canPromote(caretaker)}
								<button
									onclick={() => handlePromote(caretaker.id, 'caretaker')}
									class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold transition-colors"
									title="Bonus: {formatCurrency(promotionBonus)}"
								>
									Promote
								</button>
							{/if}
							<button
								onclick={() => handleFire(caretaker.id, 'caretaker')}
								class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
							>
								Fire
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Hire Modal -->
{#if showHireModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick={() => showHireModal = false}>
		<div class="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-xl font-bold mb-4">
				Hire {hireType === 'estate-agent' ? 'Estate Agent' : 'Caretaker'}
			</h3>
			
			<div class="mb-4">
				<label class="block text-sm text-slate-400 mb-2">Select District</label>
				<select 
					bind:value={hireDistrict}
					class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded"
				>
					{#each Array.from({ length: 10 }, (_, i) => i + 1) as district}
						<option value={district}>
							District {district} - {formatCurrency(DISTRICT_BASE_SALARIES[district as District] * $gameState.staff.baseSalaryInflationMultiplier)}/month
						</option>
					{/each}
				</select>
				<p class="text-xs text-slate-400 mt-2">
					Staff can only manage properties in their district. Higher districts have higher wages.
				</p>
			</div>

			<div class="flex gap-2">
				<button
					onclick={handleHire}
					class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
				>
					Hire
				</button>
				<button
					onclick={() => showHireModal = false}
					class="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-semibold transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
