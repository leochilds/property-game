<script lang="ts">
	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-slate-800 rounded-lg p-8 max-w-2xl w-full border border-slate-700 shadow-2xl">
		<div class="flex items-start justify-between mb-6">
			<h2 class="text-2xl font-bold text-white">Help & Feedback</h2>
			<button
				onclick={onClose}
				class="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
			>
				×
			</button>
		</div>

		<div class="space-y-6 text-slate-300">
			<div>
				<h3 class="text-lg font-semibold text-white mb-3">🐛 Report Bugs</h3>
				<p class="mb-3">
					Found a bug? We appreciate your help in making this game better! Please report issues on our GitHub repository.
				</p>
				<a
					href="https://github.com/leochilds/property-game/issues/new"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-white"
				>
					Report a Bug →
				</a>
			</div>

			<div class="border-t border-slate-700 pt-6">
				<h3 class="text-lg font-semibold text-white mb-3">💡 Make Suggestions</h3>
				<p class="mb-3">
					Have an idea for a new feature or improvement? We'd love to hear your suggestions!
				</p>
				<a
					href="https://github.com/leochilds/property-game/issues/new"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-white"
				>
					Suggest a Feature →
				</a>
			</div>

			<div class="border-t border-slate-700 pt-6">
				<h3 class="text-lg font-semibold text-white mb-3">📋 View All Issues</h3>
				<p class="mb-3">
					You can also browse existing bug reports and feature requests to see what's already been reported.
				</p>
				<a
					href="https://github.com/leochilds/property-game/issues"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors text-white"
				>
					View All Issues →
				</a>
			</div>

			<div class="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
				<p class="text-sm text-slate-400">
					<strong class="text-slate-300">Tip:</strong> When reporting bugs, please include as much detail as possible, such as what you were doing when the bug occurred and any error messages you saw.
				</p>
			</div>
		</div>
	</div>
</div>
