import { WHISKIES } from '$lib/data/whiskies';
import { DISTILLERIES } from '$lib/data/distilleries';
import origins from '$lib/data/origins.json';
import regions from '$lib/data/regions.json';
import videos from '$lib/data/influencer_videos.json';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	return {
		counts: {
			whiskies: WHISKIES.length,
			distilleries: DISTILLERIES.length,
			origins: origins.length,
			regions: regions.length,
			videos: videos.length
		}
	};
};
