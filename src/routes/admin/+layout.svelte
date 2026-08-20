<script lang="ts">
	import { page } from '$app/state';
	import { ShieldCheck } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const links = $derived([
		{ href: '/admin', label: m.admin_nav_dashboard() },
		{ href: '/admin/products', label: m.admin_nav_products() },
		{ href: '/admin/reviews', label: m.admin_nav_reviews() },
		{ href: '/admin/users', label: m.admin_nav_users() },
		{ href: '/admin/pages', label: m.admin_nav_pages() }
	]);

	const isActive = (href: string) =>
		page.url.pathname === href || (href !== '/admin' && page.url.pathname.startsWith(href));
</script>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-950">
	<header class="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-hidden px-4 py-3 sm:px-6">
			<div class="flex items-center gap-2">
				<span class="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
					<ShieldCheck size={16} />
				</span>
				<span class="font-display text-sm font-semibold text-zinc-900 dark:text-white">{m.admin_title()}</span>
			</div>
			<nav class="flex items-center gap-1 overflow-x-auto">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="rounded-full px-3 py-1.5 text-sm font-medium transition {isActive(link.href)
							? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
							: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}"
					>
						{link.label}
					</a>
				{/each}
				<a
					href="/"
					class="ml-2 rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
				>
					{m.nav_home()}
				</a>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6">{@render children()}</main>
</div>
