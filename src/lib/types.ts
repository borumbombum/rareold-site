export type Locale = 'es' | 'pt' | 'en';
export type CountryCode = 'BR' | 'UY' | 'US';

export interface SiteContext {
	locale: Locale;
	countryCode: CountryCode;
	currency: string;
	currencySymbol: string;
	timezone: string;
}

export interface EntityKarma {
	entity_id: string;
	rank: number;
	karma: number;
	vote_count: number;
}

export interface Review {
	id: string;
	product_id: string;
	user_id?: string;
	user_name?: string;
	user_avatar?: string;
	score: number;
	comment?: string | null;
	country: CountryCode;
	created_at: string;
	is_verified_purchase?: boolean;
}

export interface UserData {
	id: string;
	email: string;
	name: string;
	avatar: string;
	karma?: number;
	rank?: number;
	role?: string;
	login_type?: string | null;
}

export interface UserLoginResponse {
	access_token: string;
	user: UserData;
}

export interface VideoInfo {
	provider: 'youtube' | 'instagram' | 'unknown';
	embedUrl: string;
	thumbnailUrl?: string;
}

/** A store where a whisky can be bought (Turso `resellers`, exported per product). */
export interface Reseller {
	name: string;
	url: string;
	price: number | null;
}

export interface ProductVideo {
	country: CountryCode;
	url: string;
	label: string;
}

/** A whisky from the build-time JSON catalog (see src/lib/data/whiskies.json). */
export interface Whisky {
	id: string;
	slug: string;
	name: string;
	brand: string;
	description: string | null;
	image: string | null;
	video: string | null;
	origin: string;
	region: string | null;
	age: number | null;
	volume: string | null;
	abv: number | null;
	cask: string | null;
	name_pt: string | null;
	description_pt: string | null;
	name_en: string | null;
	description_en: string | null;
	resellers_uy: Reseller[];
	resellers_br: Reseller[];
	resellers_usa: Reseller[];
	videos?: ProductVideo[];
}
