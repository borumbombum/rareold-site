<script lang="ts">
	import { ImagePlus, MapPin, X } from '@lucide/svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';
	import { downscaleImage, formatCoords } from '$lib/utils/image';

	let { file = $bindable(null), coords = $bindable(null) } = $props();

	let previewUrl = $state('');
	let locating = $state(false);

	async function pick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const selected = input.files?.[0];
		input.value = '';
		if (!selected) return;
		try {
			const next = await downscaleImage(selected);
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			file = next;
			previewUrl = URL.createObjectURL(next);
		} catch {
			ui.showToast(m.error_generic(), true);
		}
	}

	function removePhoto() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = '';
		file = null;
	}

	function locate() {
		if (!('geolocation' in navigator)) {
			ui.showToast(m.error_generic(), true);
			return;
		}
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				coords = {
					lat: Number(pos.coords.latitude.toFixed(5)),
					lng: Number(pos.coords.longitude.toFixed(5))
				};
				locating = false;
			},
			() => {
				ui.showToast(m.error_generic(), true);
				locating = false;
			},
			{ timeout: 8000, maximumAge: 300_000 }
		);
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<input
		type="file"
		accept="image/jpeg,image/png,image/webp"
		class="hidden"
		onchange={pick}
	/>

	<button
		type="button"
		onclick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}
		class="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
	>
		<ImagePlus size={14} />
		{m.review_photo()}
	</button>

	{#if coords}
		<span
			class="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-zinc-900 dark:text-white"
		>
			<MapPin size={13} class="text-accent" />
			{formatCoords(coords.lat, coords.lng)}
			<button
				type="button"
				onclick={() => (coords = null)}
				class="text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
				aria-label={m.drawer_clear()}
			>
				<X size={12} />
			</button>
		</span>
	{:else}
		<button
			type="button"
			onclick={locate}
			disabled={locating}
			class="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
		>
			<MapPin size={14} />
			{m.review_location()}
		</button>
	{/if}

	{#if previewUrl}
		<span class="relative">
			<img src={previewUrl} alt="" class="h-10 w-10 rounded-lg object-cover" />
			<button
				type="button"
				onclick={removePhoto}
				class="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
				aria-label={m.drawer_clear()}
			>
				<X size={10} />
			</button>
		</span>
	{/if}
</div>
