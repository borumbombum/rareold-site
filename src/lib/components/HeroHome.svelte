<script lang="ts">
    import { goto } from "$app/navigation";
    import { getLocale, localizeHref } from "$lib/paraglide/runtime";
    import { WHISKIES } from "$lib/data/whiskies";
    import { setOrigin } from "$lib/stores/filters.svelte";
    import { m } from "$lib/paraglide/messages";
    import { Shuffle, TrendingUp } from "@lucide/svelte";
    import { configuration } from "$lib/configuration";
    import SearchBar from "./SearchBar.svelte";
    import Bubbles from "./Bubbles.svelte";
    import HeroVideo from "./HeroVideo.svelte";

    let { title, subtitle }: { title: string; subtitle: string } = $props();

    const locale = $derived(getLocale());

    let imgSrc = $state("/images/whisky.webp");
    const fallback = "/images/whisky.webp";
    let videoReady = $state(false);

    function handleError() {
        if (imgSrc !== fallback) imgSrc = fallback;
    }

    function surprise() {
        const idx = Math.floor(Math.random() * WHISKIES.length);
        const slug = WHISKIES[idx].slug;
        goto(localizeHref(`/whisky/${slug}`, { locale }));
    }

    function scrollToTop() {
        setOrigin("all");
        const el = document.getElementById("ranking");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    }
</script>

<section class="relative min-h-112.5 flex items-center justify-center">
    <!-- <Bubbles /> -->
    {#if configuration.hero.videoEnabled && configuration.hero.videoSrc}
        <HeroVideo
            videoSrc={configuration.hero.videoSrc}
            startSeconds={configuration.hero.videoStartSeconds}
            mobile={configuration.hero.mobileVideoEnabled}
            onReady={() => { videoReady = true; }}
        />
    {/if}
    <img
        src={imgSrc}
        alt=""
        class="absolute inset-0 w-full h-full object-cover object-center z-10 transition-opacity duration-700 {videoReady ? 'opacity-0' : ''}"
        onerror={handleError}
    />
    <div
        class="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.75)_100%),linear-gradient(to_top,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0)_50%)]"
    ></div>

    <div class="relative z-30 flex flex-col items-center text-center px-6 pt-8 pb-6 w-full max-w-2xl sm:max-w-3xl">
        <h1
            class="font-display font-semibold tracking-tight text-4xl sm:text-5xl text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]"
        >
            {title}
        </h1>
        <p class="mt-3 text-base text-white/85">{subtitle}</p>

        <div class="mt-8 w-full max-w-xl sm:max-w-2xl">
            <SearchBar large />
        </div>

        <div class="flex gap-3 mt-5">
            <button
                onclick={surprise}
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/90 bg-white/[0.12] backdrop-blur-md border border-white/[0.15] transition cursor-pointer hover:bg-white/[0.22] hover:text-white"
            >
                <Shuffle size={15} />
                {m.home_surprise()}
            </button>
            <button
                onclick={scrollToTop}
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white/90 bg-white/[0.12] backdrop-blur-md border border-white/[0.15] transition cursor-pointer hover:bg-white/[0.22] hover:text-white"
            >
                <TrendingUp size={15} />
                {m.home_top_whiskys()}
            </button>
        </div>
    </div>
</section>
