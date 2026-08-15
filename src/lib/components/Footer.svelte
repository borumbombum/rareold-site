<script lang="ts">
	import { PUBLIC_INSTAGRAM_URL } from '$env/static/public';
	import InstagramIcon from './InstagramIcon.svelte';
	import { m } from '$lib/paraglide/messages';

	const year = new Date().getFullYear();
</script>

<footer class="border-t border-zinc-200/70 py-10 dark:border-zinc-800/70">
	<div class="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6">
		<p class="font-display text-lg text-zinc-900 dark:text-white">
			Rare<span class="text-accent"> Old</span>
		</p>
		<p class="text-sm text-zinc-500 dark:text-zinc-400">{m.site_tagline()}</p>
		<a
			href={PUBLIC_INSTAGRAM_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="flex h-9 items-center gap-2 rounded-full border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
		>
			<InstagramIcon size={16} />
			{m.nav_instagram()}
		</a>
		<p class="text-xs text-zinc-400 dark:text-zinc-600">© {year} {m.site_name()}</p>
	</div>
</footer>
