import { sveltekit } from '@sveltejs/kit/vite';
import vercel from '@sveltejs/adapter-vercel';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	ssr: {
		external: ['sql.js']
	},
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
						['ja', ':protocol://:domain(.*)::port?/jp/origen/:slug'],
						['fr', ':protocol://:domain(.*)::port?/fr/origine/:slug'],
						['es', ':protocol://:domain(.*)::port?/es/origen/:slug'],
						['en', ':protocol://:domain(.*)::port?/origin/:slug']
					]
				},
				{
					pattern: ':protocol://:domain(.*)::port?/destileria/:slug',
					localized: [
						['pt', ':protocol://:domain(.*)::port?/br/destilaria/:slug'],
						['ja', ':protocol://:domain(.*)::port?/jp/destileria/:slug'],
						['fr', ':protocol://:domain(.*)::port?/fr/destileria/:slug'],
						['es', ':protocol://:domain(.*)::port?/es/destileria/:slug'],
						['en', ':protocol://:domain(.*)::port?/distillery/:slug']
					]
				},
				{
					pattern: ':protocol://:domain(.*)::port?/:path(.*)?',
					localized: [
						['pt', ':protocol://:domain(.*)::port?/br/:path(.*)?'],
						['ja', ':protocol://:domain(.*)::port?/jp/:path(.*)?'],
						['fr', ':protocol://:domain(.*)::port?/fr/:path(.*)?'],
						['es', ':protocol://:domain(.*)::port?/es/:path(.*)?'],
						['en', ':protocol://:domain(.*)::port?/:path(.*)?']
					]
				}
			]
		})
	]
});
