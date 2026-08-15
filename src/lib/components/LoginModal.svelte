<script lang="ts">
	import Modal from './Modal.svelte';
	import AuthButton from './AuthButton.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { m } from '$lib/paraglide/messages';

	const open = $derived(ui.loginOpen);
</script>

<Modal {open} onClose={() => ui.closeLogin()} title={m.login_google()} maxWidth="max-w-sm">
	<div class="px-5 py-6">
		<p class="mb-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
			{m.auth_please_sign_in()}
		</p>
		<AuthButton />
	</div>
</Modal>
