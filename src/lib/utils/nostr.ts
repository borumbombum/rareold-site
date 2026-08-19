export function isNip07Available(): boolean {
	return typeof window !== 'undefined' && typeof (window as any).nostr !== 'undefined';
}

export async function getNostrPubkey(): Promise<string> {
	if (!isNip07Available()) throw new Error('No NIP-07 extension found');
	return (window as any).nostr.getPublicKey();
}

export async function signNostrChallenge(origin: string): Promise<object> {
	if (!isNip07Available()) throw new Error('No NIP-07 extension found');

	const event = {
		kind: 27235,
		created_at: Math.floor(Date.now() / 1000),
		tags: [
			['u', origin],
			['method', 'GET']
		],
		content: ''
	};

	return (window as any).nostr.signEvent(event);
}
