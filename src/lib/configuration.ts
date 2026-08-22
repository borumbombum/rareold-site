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
	}
} as const;
