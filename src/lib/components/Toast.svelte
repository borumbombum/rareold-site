<script lang="ts">
	import { AlertCircle, CheckCircle2 } from 'lucide-svelte';
	import { ui } from '$lib/stores/ui.svelte';

	const toast = $derived(ui.toast);
</script>

{#if toast}
	<div
		class="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4"
		role="status"
		aria-live="polite"
	>
		<div
			class="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg {toast.error
				? 'bg-red-600 text-white'
				: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'}"
		>
			{#if toast.error}
				<AlertCircle size={16} />
			{:else}
				<CheckCircle2 size={16} />
			{/if}
			{toast.text}
		</div>
	</div>
{/if}
