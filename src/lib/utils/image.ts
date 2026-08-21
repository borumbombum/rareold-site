const MAX_DIMENSION = 1200;

/** Downscale an image client-side via canvas so review photos stay small
 *  (typically 100-400 KB) before they hit the API. */
export async function downscaleImage(file: File): Promise<File> {
	const bitmap = await createImageBitmap(file);
	try {
		const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
		const w = Math.max(1, Math.round(bitmap.width * scale));
		const h = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d');
		if (!ctx) return file;
		ctx.drawImage(bitmap, 0, 0, w, h);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', 0.82)
		);
		if (!blob) return file;
		return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
	} finally {
		bitmap.close();
	}
}

export function formatCoords(lat: number, lng: number): string {
	return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}
