<script lang="ts">
    import { onMount } from "svelte";
    import { Loader2 } from "@lucide/svelte";

    let {
        videoSrc,
        startSeconds = 0,
        mobile = false,
        onReady,
    }: {
        videoSrc: string;
        startSeconds?: number;
        mobile?: boolean;
        onReady?: () => void;
    } = $props();

    let video = $state<HTMLVideoElement>();
    let loading = $state(true);

    function onCanPlay() {
        if (!loading) return;
        loading = false;
        if (video && startSeconds > 0) {
            video.currentTime = startSeconds;
        }
        if (mobile || window.innerWidth >= 640) {
            onReady?.();
        }
    }

    onMount(() => {
        if (!video) return;

        const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mql.matches) {
            loading = false;
            return;
        }

        video.play().catch(() => {
            // Autoplay blocked — show image fallback
            loading = false;
        });
    });
</script>

<div class="absolute inset-0 z-0 overflow-hidden {mobile ? '' : 'hidden sm:block'}">
    <!-- svelte-ignore a11y_media_has_no_controls -->
    <video
        bind:this={video}
        autoplay
        muted
        loop
        playsinline
        class="absolute inset-0 w-full h-full object-cover object-center"
        oncanplay={onCanPlay}
    >
        <source src={videoSrc} />
    </video>
</div>

{#if loading}
    <div class="absolute top-4 right-4 z-20">
        <Loader2 class="animate-spin text-white/70" size={20} />
    </div>
{/if}
