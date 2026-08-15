<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import VideoModal from '$lib/components/VideoModal.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { theme } from '$lib/stores/theme.svelte';
	import { view } from '$lib/stores/view.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { navigation } from '$lib/stores/navigation.svelte';
	import { m } from '$lib/paraglide/messages';

	let { children, data } = $props();

	beforeNavigate(() => {
		navigation.set(true);
	});

	afterNavigate(() => {
		navigation.set(false);
	});

	$effect(() => {
		theme.init();
	});

	$effect(() => {
		view.init();
	});

	$effect(() => {
		session.hydrate(data.user);
	});

	$effect(() => {
		favorites.hydrate(data.favorites);
	});
</script>

<svelte:head>
	<title>{m.site_name()}</title>
	<meta name="description" content={m.site_description()} />
	<meta name="theme-color" content="#b45309" />
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden transition-opacity duration-150 {navigation.isNavigating
			? 'opacity-100'
			: 'opacity-0'}"
		aria-hidden="true"
	>
		{#if navigation.isNavigating}
			<div class="absolute inset-y-0 left-0 w-1/2 animate-loader-sweep rounded-full bg-gradient-to-r from-accent via-accent-soft to-accent"></div>
		{/if}
	</div>
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
	<Drawer />
	<LoginModal />
	<VideoModal />
	<Toast />
</div>
