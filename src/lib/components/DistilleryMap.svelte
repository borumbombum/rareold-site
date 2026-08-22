<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { DISTILLERIES } from '$lib/data/distilleries';
	import { ORIGINS, originLabel, sortOriginsByCount } from '$lib/utils/origins';
	import { localizeHref, getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	let container: HTMLDivElement;
	let map: import('leaflet').Map | null = null;
	let markerLayer: import('leaflet').LayerGroup | null = null;
	let selectedOrigin = $state<string>('all');
	let ready = $state(false);

	const located = DISTILLERIES.filter(
		(d): d is (typeof DISTILLERIES)[number] & { latitude: number; longitude: number; country: string } =>
			typeof d.latitude === 'number' &&
			typeof d.longitude === 'number' &&
			typeof d.country === 'string' &&
			d.country.length > 0
	);

	const originCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const d of located) counts[d.country] = (counts[d.country] ?? 0) + 1;
		return counts;
	});

	const sortedOrigins = $derived(sortOriginsByCount(originCounts).filter((o) => originCounts[o.key]));

	function esc(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	async function renderMarkers(): Promise<void> {
		if (!map) return;
		const L = await import('leaflet');
		if (markerLayer) markerLayer.remove();
		markerLayer = L.layerGroup().addTo(map);
		const list = selectedOrigin === 'all' ? located : located.filter((d) => d.country === selectedOrigin);
		const locale = getLocale();
		for (const d of list) {
			const flag = ORIGINS.find((o) => o.key === d.country)?.flag ?? '🌍';
			const icon = L.divIcon({
				className: 'distillery-marker',
				html: `<span class="distillery-marker-pin">${flag}</span>`,
				iconSize: [30, 30],
				iconAnchor: [15, 15],
				popupAnchor: [0, -16]
			});
			const marker = L.marker([d.latitude as number, d.longitude as number], { icon });
			const img = d.image
				? `<img src="${esc(d.image)}" alt="" width="72" height="72" class="h-18 w-18 rounded-xl object-cover" />`
				: '';
			marker.bindPopup(
				`<div class="flex gap-3 items-center min-w-[200px]">${img}
					<div class="min-w-0">
						<p class="font-semibold text-sm leading-tight">${esc(d.name)}</p>
						<p class="text-xs opacity-70 mt-0.5">${esc(originLabel(d.country))}${d.region ? ' · ' + esc(d.region) : ''}</p>
						<a href="${localizeHref(`/destileria/${d.slug}`, { locale })}" class="text-xs underline mt-1 inline-block font-medium">${esc(m.map_open_distillery())}</a>
					</div>
				</div>`
			);
			markerLayer.addLayer(marker);
		}
	}

	onMount(async () => {
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');
		map = L.map(container, {
			center: [25, 0],
			zoom: 2,
			minZoom: 2,
			worldCopyJump: true,
			scrollWheelZoom: true,
			attributionControl: true
		});
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);
		ready = true;
		await renderMarkers();
	});

	$effect(() => {
		void selectedOrigin;
		if (ready) void renderMarkers();
	});

	onDestroy(() => {
		map?.remove();
		map = null;
	});
</script>

<div class="flex flex-wrap items-center gap-2 pb-4">
	<button
		onclick={() => (selectedOrigin = 'all')}
		class="rounded-full border px-3 py-1.5 text-xs font-medium transition {selectedOrigin === 'all'
			? 'border-accent bg-accent/10 text-accent'
			: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
	>
		{m.origin_all()}
	</button>
	{#each sortedOrigins as origin (origin.key)}
		<button
			onclick={() => (selectedOrigin = origin.key)}
			class="rounded-full border px-3 py-1.5 text-xs font-medium transition {selectedOrigin === origin.key
				? 'border-accent bg-accent/10 text-accent'
				: 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'}"
		>
			{origin.flag} {originLabel(origin.key)}
			<span class="tabular-nums opacity-60">{originCounts[origin.key]}</span>
		</button>
	{/each}
</div>

<div class="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
	<div bind:this={container} class="absolute inset-0 z-0 bg-zinc-100 dark:bg-zinc-900"></div>
</div>

<style>
	.distillery-marker {
		background: transparent;
		border: none;
	}
	.distillery-marker-pin {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		font-size: 17px;
		line-height: 1;
		border-radius: 9999px;
		background: rgb(24 24 27);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
		border: 2px solid #fff;
		cursor: pointer;
	}
	:global(.dark) .distillery-marker-pin {
		background: #fafafa;
		border-color: rgb(39 39 42);
	}
	:global(.leaflet-popup-content-wrapper) {
		border-radius: 14px;
	}
	:global(.leaflet-container) {
		font: inherit;
	}
</style>
