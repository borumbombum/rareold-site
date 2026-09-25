export const configuration = {
	hero: {
		videoEnabled: true,
		videoSrc: '/data/videos/hero-v2.mp4',
		videoStartSeconds: 0,
		mobileVideoEnabled: true
	},
	reviews: {
		/** true = every visitor sees all comments regardless of reviewer country. */
		globalComments: true
	},
	stores: {
		/** Where store-suggestion requests are sent. Empty = /add-store falls back to copy-to-clipboard. */
		requestEmail: ''
	}
} as const;
