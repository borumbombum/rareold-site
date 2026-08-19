<script lang="ts">
	let {
		imageUrl,
		title,
		subtitle,
		count
	}: {
		imageUrl: string;
		title: string;
		subtitle: string;
		count?: string;
	} = $props();

	let imgSrc = $derived(imageUrl);
	const fallback = '/images/whisky.webp';

	function handleError() {
		if (imgSrc !== fallback) imgSrc = fallback;
	}
</script>

<section class="hero">
	<img
		src={imgSrc}
		alt=""
		class="hero__bg"
		onerror={handleError}
	/>
	<div class="hero__overlay"></div>

	<div class="hero__content mx-auto max-w-7xl px-6 w-full">
		<h1 class="hero__title font-display leading-[100%]">{title}</h1>
		<p class="hero__subtitle">{subtitle}</p>
		{#if count}
			<p class="hero__count">{count}</p>
		{/if}
	</div>
</section>

<style>
	.hero { position: relative; min-height: 380px; display: flex; align-items: flex-end; overflow: hidden; }
	@media (min-width: 640px) { .hero { min-height: 460px; } }
	.hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
	.hero__overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 28%, rgba(0,0,0,0.2) 58%, rgba(0,0,0,0) 85%), linear-gradient(to top, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%); }
	.hero__content { position: relative; z-index: 1; padding-top: 2rem; padding-bottom: 2.5rem; }
	@media (min-width: 640px) { .hero__content { padding-top: 2.5rem; padding-bottom: 3.5rem; } }
	.hero__title { font-weight: 600; letter-spacing: -0.02em; font-size: 2.25rem; color: #ffffff; text-shadow: 0 1px 12px rgba(0,0,0,0.35); }
	@media (min-width: 640px) { .hero__title { font-size: 3rem; } }
	.hero__subtitle { margin-top: 0.75rem; font-size: 1rem; color: rgba(255,255,255,0.85); }
	.hero__count { margin-top: 0.5rem; font-size: 0.875rem; color: rgba(255,255,255,0.6); }
</style>
