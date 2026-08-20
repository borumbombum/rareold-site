<script lang="ts">
	import { ShieldCheck, ShieldOff, Trash2 } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages';
	import { invalidateAll } from '$app/navigation';
	import { ui } from '$lib/stores/ui.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let rows = $state([...data.users]);
	let error = $state('');

	async function toggle(id: string, role: 'admin' | 'user') {
		error = '';
		const next = role === 'admin' ? 'user' : 'admin';
		const res = await fetch('/api/admin/users', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, role: next })
		});
		if (res.ok) {
			const target = rows.find((u) => u.id === id);
			if (target) target.role = next;
			ui.showToast(m.admin_users_role_changed());
		} else {
			const body = await res.json().catch(() => ({}));
			const msg = (body as { error?: string }).error ?? '';
			error = msg;
			ui.showToast(msg || m.error_generic(), true);
		}
	}

	async function remove(id: string) {
		if (!confirm(m.admin_users_confirm_delete())) return;
		error = '';
		const res = await fetch('/api/admin/users', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		});
		if (res.ok) {
			rows = rows.filter((u) => u.id !== id);
			ui.showToast(m.admin_users_deleted());
		} else {
			const body = await res.json().catch(() => ({}));
			const msg = (body as { error?: string }).error ?? '';
			error = msg;
			ui.showToast(msg || m.error_generic(), true);
		}
	}
</script>

<svelte:head>
	<title>{m.admin_title()} — {m.admin_users_title()}</title>
</svelte:head>

<h1 class="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">{m.admin_users_title()}</h1>
<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.admin_users_subtitle()}</p>

{#if error}
	<p class="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
{/if}

<div class="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
	<table class="w-full min-w-[640px] text-left text-sm">
		<thead class="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
			<tr>
				<th class="px-4 py-3 font-medium">{m.admin_table_user()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_email()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_login()}</th>
				<th class="px-4 py-3 font-medium">{m.admin_table_role()}</th>
				<th class="px-4 py-3 text-right font-medium">{m.admin_table_actions()}</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
			{#each rows as u (u.id)}
				<tr class="text-zinc-800 dark:text-zinc-200">
					<td class="px-4 py-2.5">
						<div class="flex items-center gap-2.5">
							<span class="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
								{#if u.avatar}
									<img src={u.avatar} alt="" class="h-full w-full object-cover" />
								{:else}
									{u.name.slice(0, 1).toUpperCase() || '?'}
								{/if}
							</span>
							<span class="max-w-[200px] truncate font-medium">{u.name}</span>
						</div>
					</td>
					<td class="max-w-[220px] truncate px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{u.email}</td>
					<td class="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{u.login_type}</td>
					<td class="px-4 py-2.5">
						<span class="rounded-full px-2 py-0.5 text-xs font-semibold {u.role === 'admin'
							? 'bg-accent/15 text-accent'
							: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}">
							{u.role}
						</span>
					</td>
					<td class="px-4 py-2.5">
						<div class="flex justify-end gap-1">
							<button
								onclick={() => toggle(u.id, u.role as 'admin' | 'user')}
								disabled={u.id === data.admin.id}
								title={u.id === data.admin.id ? m.admin_users_cannot_change_own() : u.role === 'admin' ? m.admin_users_demote_title() : m.admin_users_promote_title()}
								class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
							>
								{#if u.role === 'admin'}
									<ShieldOff size={13} />
									{m.admin_users_demote()}
								{:else}
									<ShieldCheck size={13} />
									{m.admin_users_promote()}
								{/if}
							</button>
							<button
								onclick={() => remove(u.id)}
								disabled={u.id === data.admin.id}
								title={m.admin_users_delete()}
								class="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40"
							>
								<Trash2 size={14} />
							</button>
						</div>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5" class="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">{m.admin_users_empty()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
