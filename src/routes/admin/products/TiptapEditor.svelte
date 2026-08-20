<script lang="ts">
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import { onMount } from 'svelte';
	import {
		Bold,
		Italic,
		Underline as UnderlineIcon,
		Heading2,
		List,
		ListOrdered,
		Link as LinkIcon,
		Undo2,
		Redo2
	} from '@lucide/svelte';

	let {
		value,
		onchange,
		placeholder
	}: {
		value: string | null;
		onchange: (html: string) => void;
		placeholder?: string;
	} = $props();

	let host!: HTMLDivElement;
	let editor: Editor | null = $state(null);
	let version = $state(0);

	const active = $derived((name: string, attrs?: Record<string, unknown>) => {
		void version;
		return editor?.isActive(name, attrs) ?? false;
	});

	onMount(() => {
		const inst = new Editor({
			element: host,
			content: value ?? '',
			extensions: [
				StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
				Placeholder.configure({ placeholder: placeholder ?? '' })
			],
			onUpdate: ({ editor: e }) => onchange(e.getHTML())
		});
		inst.on('transaction', () => version++);
		editor = inst;
		return () => inst.destroy();
	});

	function cmd(fn: (e: Editor) => void) {
		const e = editor;
		if (!e) return;
		e.chain().focus().run();
		fn(e);
		version++;
	}

	function toggleLink() {
		const e = editor;
		if (!e) return;
		const prev = (e.getAttributes('link').href as string | undefined) ?? '';
		const url = window.prompt('Link URL', prev);
		if (url === null) return;
		cmd((ed) => {
			ed.chain().focus().extendMarkRange('link');
			if (url === '') ed.chain().focus().extendMarkRange('link').unsetLink().run();
			else ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
		});
	}

	const btnClass =
		'grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white';
	const btnActive = 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white';
</script>

<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
	<div class="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-1.5 py-1 dark:border-zinc-800 dark:bg-zinc-900">
		<button type="button" class="{btnClass} {active('bold') ? btnActive : ''}" title="Bold" onclick={() => cmd((e) => e.chain().focus().toggleBold().run())}><Bold size={14} /></button>
		<button type="button" class="{btnClass} {active('italic') ? btnActive : ''}" title="Italic" onclick={() => cmd((e) => e.chain().focus().toggleItalic().run())}><Italic size={14} /></button>
		<button type="button" class="{btnClass} {active('underline') ? btnActive : ''}" title="Underline" onclick={() => cmd((e) => e.chain().focus().toggleUnderline().run())}><UnderlineIcon size={14} /></button>
		<button type="button" class="{btnClass} {active('heading', { level: 2 }) ? btnActive : ''}" title="Heading" onclick={() => cmd((e) => e.chain().focus().toggleHeading({ level: 2 }).run())}><Heading2 size={14} /></button>
		<button type="button" class="{btnClass} {active('bulletList') ? btnActive : ''}" title="Bullet list" onclick={() => cmd((e) => e.chain().focus().toggleBulletList().run())}><List size={14} /></button>
		<button type="button" class="{btnClass} {active('orderedList') ? btnActive : ''}" title="Numbered list" onclick={() => cmd((e) => e.chain().focus().toggleOrderedList().run())}><ListOrdered size={14} /></button>
		<button type="button" class="{btnClass} {active('link') ? btnActive : ''}" title="Link" onclick={toggleLink}><LinkIcon size={14} /></button>
		<span class="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700"></span>
		<button type="button" class={btnClass} title="Undo" onclick={() => cmd((e) => e.chain().focus().undo().run())}><Undo2 size={14} /></button>
		<button type="button" class={btnClass} title="Redo" onclick={() => cmd((e) => e.chain().focus().redo().run())}><Redo2 size={14} /></button>
	</div>
	<div
		bind:this={host}
		class="px-3 py-2 [&_.tiptap]:min-h-44 [&_.tiptap]:text-sm [&_.tiptap]:text-zinc-800 dark:[&_.tiptap]:text-zinc-100 [&_.tiptap]:outline-none [&_.tiptap_h2]:mb-1 [&_.tiptap_h2]:text-lg [&_.tiptap_h2]:font-semibold [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_a]:text-accent [&_.tiptap_a]:underline"
	></div>
</div>

<style>
	:global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: #a1a1aa;
		float: left;
		height: 0;
		pointer-events: none;
	}
	:global(.tiptap p.is-empty:first-child::before) {
		content: attr(data-placeholder);
		color: #a1a1aa;
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
