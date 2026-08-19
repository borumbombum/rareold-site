<script lang="ts">
	import { LayoutGrid, List, AlignJustify } from '@lucide/svelte';
	import { view } from '$lib/stores/view.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ProductView } from '$lib/stores/view.svelte';

	const current = $derived(view.current);
</script>

<div class="flex items-center gap-1 rounded-full border border-zinc-200 p-1 dark:border-zinc-800">
	<button
		onclick={() => view.set('grid')}
		title={m.view_grid()}
		aria-pressed={current === 'grid'}
		class="grid h-8 w-8 place-items-center rounded-full transition {current === 'grid' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}"
	>
		<LayoutGrid size={15} />
	</button>
	<button
		onclick={() => view.set('list')}
		title={m.view_list()}
		aria-pressed={current === 'list'}
		class="grid h-8 w-8 place-items-center rounded-full transition {current === 'list' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}"
	>
		<List size={15} />
	</button>
	<button
		onclick={() => view.set('compact')}
		title={m.view_compact()}
		aria-pressed={current === 'compact'}
		class="grid h-8 w-8 place-items-center rounded-full transition {current === 'compact' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}"
	>
		<AlignJustify size={15} />
	</button>
</div>
