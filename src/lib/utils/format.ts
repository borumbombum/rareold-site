import type { VideoInfo } from '$lib/types';

export function formatPrice(amount: number, currency: string, locale: string): string {
	try {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			maximumFractionDigits: amount % 1 === 0 ? 0 : 2
		}).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
	}
}

export function formatNumber(n: number, locale: string): string {
	try {
		return new Intl.NumberFormat(locale).format(n);
	} catch {
		return String(n);
	}
}

export function formatDate(iso: string | null | undefined, locale: string): string {
	if (!iso) return '';
	try {
		return new Intl.DateTimeFormat(locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(iso));
	} catch {
		return '';
	}
}

/** Parse a YouTube or Instagram URL into embed + thumbnail info. */
export function parseVideoUrl(raw: string | null | undefined): VideoInfo | null {
	if (!raw) return null;
	const url = raw.trim();
	try {
		// YouTube
		const yt = url.match(
			/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/
		);
		if (yt) {
			const id = yt[1];
			return {
				provider: 'youtube',
				embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`,
				thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
			};
		}
		// Instagram
		const ig = url.match(/instagram\.com\/(?:p|reel|reels)\/([\w-]+)/);
		if (ig) {
			const id = ig[1];
			return {
				provider: 'instagram',
				embedUrl: `https://www.instagram.com/p/${id}/embed/`,
				thumbnailUrl: undefined
			};
		}
		// Direct mp4/webm
		if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
			return { provider: 'unknown', embedUrl: url, thumbnailUrl: undefined };
		}
	} catch {
		return null;
	}
	return null;
}

export function videoFromMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
	const video = metadata?.video ?? metadata?.video_url;
	return typeof video === 'string' && video ? video : null;
}
