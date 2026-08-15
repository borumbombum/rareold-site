import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			'$env/static/private': fileURLToPath(
				new URL('./tests/helpers/env-static-private.ts', import.meta.url)
			),
			'$env/static/public': fileURLToPath(
				new URL('./tests/helpers/env-static-public.ts', import.meta.url)
			)
		}
	},
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts']
	}
});
