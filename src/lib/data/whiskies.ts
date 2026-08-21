import type { Whisky } from '$lib/types';
import data from './whiskies.json';

export const WHISKIES = data.whiskies as Whisky[];

export function getWhiskyBySlug(slug: string): Whisky | null {
	return WHISKIES.find((w) => w.slug === slug || w.id === slug) ?? null;
}
