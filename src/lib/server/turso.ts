import { createClient } from '@libsql/client';
import { env } from './env';

/** Runtime Turso client for live data only (users, votes, reviews, karma).
 *  The catalog stays build-time JSON — never read from here. */
export const turso = createClient({ url: env.tursoUrl, authToken: env.tursoAuthToken });
