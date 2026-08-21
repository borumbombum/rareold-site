import type { Distillery } from '$lib/types';
import data from './distilleries.json';

export const DISTILLERIES: Distillery[] = data;

export function getDistilleryBySlug(slug: string): Distillery | null {
	return DISTILLERIES.find((d) => d.slug === slug || d.id === slug) ?? null;
}
