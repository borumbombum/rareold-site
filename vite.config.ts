import { sveltekit } from '@sveltejs/kit/vite';
import vercel from '@sveltejs/adapter-vercel';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: vercel()
		}),
		tailwindcss(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			strategy: ['url', 'cookie', 'baseLocale'],
			urlPatterns: [
				{
					pattern: ':protocol://:domain(.*)::port?/origen/:slug',
					localized: [
						['pt', ':protocol://:domain(.*)::port?/br/origem/:slug'],
						['en', ':protocol://:domain(.*)::port?/en/origin/:slug'],
						['es', ':protocol://:domain(.*)::port?/origen/:slug']
					]
				},
				{
					pattern: ':protocol://:domain(.*)::port?/:path(.*)?',
					localized: [
						['pt', ':protocol://:domain(.*)::port?/br/:path(.*)?'],
						['en', ':protocol://:domain(.*)::port?/en/:path(.*)?'],
						['es', ':protocol://:domain(.*)::port?/:path(.*)?']
					]
				}
			]
		})
	]
});
