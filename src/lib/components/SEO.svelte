<script lang="ts">
	import { getUrlOrigin } from '$lib/paraglide/runtime';
	import type { HreflangAlternate } from '$lib/utils/seo';

	interface Props {
		title: string;
		description?: string;
		/** Localized path for the current page, e.g. "/es/origen/escocia". Empty = no canonical. */
		canonicalPath?: string;
		ogImage?: string;
		ogType?: 'website' | 'article';
		hreflangAlternates?: HreflangAlternate[];
		noindex?: boolean;
	}

	let {
		title,
		description = '',
		canonicalPath = '',
		ogImage,
		ogType = 'website',
		hreflangAlternates = [],
		noindex = false
	}: Props = $props();

	const SITE_NAME = 'Rare Old';

	const origin = $derived(getUrlOrigin());
	const desc = $derived(description.length > 160 ? description.slice(0, 157) + '…' : description);
	const canonicalUrl = $derived(canonicalPath ? origin + canonicalPath : '');
	const image = $derived(ogImage ?? `${origin}/images/og-default.webp`);
	const xDefault = $derived(
		hreflangAlternates.find((a) => a.lang === 'en')?.href ?? hreflangAlternates[0]?.href ?? ''
	);
</script>

<svelte:head>
	<title>{title}</title>
	{#if desc}
		<meta name="description" content={desc} />
	{/if}
	{#if canonicalUrl}
		<link rel="canonical" href={canonicalUrl} />
	{/if}
	<meta property="og:title" content={title} />
	{#if desc}
		<meta property="og:description" content={desc} />
	{/if}
	{#if canonicalUrl}
		<meta property="og:url" content={canonicalUrl} />
	{/if}
	<meta property="og:image" content={image} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	{#if desc}
		<meta name="twitter:description" content={desc} />
	{/if}
	<meta name="twitter:image" content={image} />
	{#each hreflangAlternates as alt (alt.lang)}
		<link rel="alternate" hreflang={alt.lang} href={alt.href} />
	{/each}
	{#if xDefault}
		<link rel="alternate" hreflang="x-default" href={xDefault} />
	{/if}
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
</svelte:head>
