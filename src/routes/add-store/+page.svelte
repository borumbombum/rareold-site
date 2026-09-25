<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { ui } from '$lib/stores/ui.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { countryFlag, detectUserCountry } from '$lib/utils/geo-client';
	import { configuration } from '$lib/configuration';

	let name = $state('');
	let website = $state('');
	let contact = $state('');
	let country = $state<string | null>(null);

	$effect(() => {
		detectUserCountry().then((c) => (country = c));
	});

	const flag = $derived(countryFlag(country));

	const inputClass =
		'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';
	const labelClass = 'mb-1 block font-medium text-zinc-600 dark:text-zinc-300';

	function submit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;
		const subject = `New store suggestion: ${name}`;
		const body = [
			`Store: ${name}`,
			`Website: ${website.trim() || '—'}`,
			`Country: ${country ?? '?'}`,
			`Contact: ${contact.trim() || '—'}`
		].join('\n');
		const email = configuration.stores.requestEmail;
		if (email) {
			window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
			ui.showToast(m.add_store_mailto_sent());
		} else {
			navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`).catch(() => {});
			ui.showToast(m.add_store_copied());
		}
	}
</script>

<svelte:head>
	<title>{m.add_store_title()} — Rare Old</title>
</svelte:head>

<SEO title="{m.add_store_title()} — Rare Old" description={m.add_store_subtitle()} canonicalPath="/add-store" />

<div class="mx-auto max-w-2xl px-4 py-12 sm:px-6">
	<h1 class="font-display text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
		{m.add_store_title()}
	</h1>
	<p class="mt-3 text-zinc-600 dark:text-zinc-300">{m.add_store_subtitle()}</p>

	<form
		onsubmit={submit}
		class="mt-8 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
	>
		<div>
			<label class={labelClass} for="store-name">{m.add_store_name()}</label>
			<input id="store-name" type="text" required bind:value={name} placeholder="The Whisky Emporium" class={inputClass} />
		</div>

		<div>
			<label class={labelClass} for="store-website">{m.add_store_website()}</label>
			<input id="store-website" type="url" bind:value={website} placeholder="https://…" class={inputClass} />
		</div>

		<div>
			<label class={labelClass} for="store-contact">{m.add_store_email()}</label>
			<input id="store-contact" type="email" bind:value={contact} placeholder="you@example.com" class={inputClass} />
		</div>

		<div>
			<span class={labelClass}>{m.add_store_country()}</span>
			<div class="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
				{#if flag}<span aria-hidden="true">{flag}</span>{/if}
				{country ?? m.add_store_detected()}
			</div>
		</div>

		<button
			type="submit"
			class="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
		>
			{m.add_store_cta()}
		</button>
	</form>
</div>