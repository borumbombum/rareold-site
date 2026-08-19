<script lang="ts">
    import { PUBLIC_INSTAGRAM_URL } from "$env/static/public";
    import { page } from "$app/state";
    import { getLocale } from "$lib/paraglide/runtime";
    import { localizeHref } from "$lib/paraglide/runtime";
    import { session } from "$lib/stores/session.svelte";
    import { ui } from "$lib/stores/ui.svelte";
    import { filters } from "$lib/stores/filters.svelte";
    import { Menu } from "@lucide/svelte";
    import SearchBar from "./SearchBar.svelte";
    import ThemeToggle from "./ThemeToggle.svelte";
    import LanguageSwitcher from "./LanguageSwitcher.svelte";
    import InstagramIcon from "./InstagramIcon.svelte";
    import { m } from "$lib/paraglide/messages";

    const locale = $derived(getLocale());
    const homeHref = $derived(localizeHref("/", { locale }));
    const isHome = $derived(page.url.pathname === '/' || page.url.pathname === '/br' || page.url.pathname === '/en');
    const user = $derived(session.user);
    const isAuthed = $derived(session.isAuthed);
    const filterActive = $derived(filters.origin !== "all" || filters.region !== null);
    const profileHref = $derived(user ? localizeHref(`/user/${user.id}/favorites`) : "#");
</script>

<header
    class="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80"
>
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
        <button
            onclick={() => ui.toggleDrawer()}
            class="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
            aria-label={m.drawer_menu()}
        >
            <Menu size={18} />
            {#if filterActive}
                <span
                    class="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-white dark:ring-zinc-950"
                ></span>
            {/if}
        </button>

        <a href={homeHref} class="flex items-center">
            <img src="/images/rareold-logo.svg" alt="Rare Old" class="h-6 w-auto" />
        </a>

        {#if !isHome}
            <div class="order-2 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-2xl">
                <SearchBar />
            </div>
        {/if}

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
            <a
                href={localizeHref('/about', { locale })}
                class="hidden text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white md:inline-flex"
            >
                {m.nav_about()}
            </a>

            <a
                href={PUBLIC_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="flex h-9 items-center gap-2 rounded-full border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
                aria-label={m.nav_instagram()}
            >
                <InstagramIcon size={16} />
                <span class="hidden md:inline">{m.nav_instagram()}</span>
            </a>

            <div class="hidden sm:block">
                <ThemeToggle />
            </div>

            <div class="hidden sm:block">
                <LanguageSwitcher compact />
            </div>

            {#if isAuthed}
                <a
                    href={profileHref}
                    title={m.favorites_title()}
                    class="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                    {#if user?.avatar}
                        <img src={user.avatar} alt={user.name} class="h-full w-full object-cover" />
                    {:else}
                        {(user?.name ?? "?").slice(0, 1).toUpperCase()}
                    {/if}
                </a>
            {:else}
                <button
                    onclick={() => ui.openLogin()}
                    class="h-9 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    {m.login_short()}
                </button>
            {/if}
        </div>
    </div>
</header>
