import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { createDownloadRequest, grantDownload, consumeDownloadToken, listDownloadRequests } from '$lib/server/downloads';

const dbs: Client[] = [];

afterEach(async () => {
	for (const db of dbs.splice(0)) await db.close();
});

describe('download access lifecycle (044)', () => {
	it('request → grant → consume → single-use + expiry', async () => {
		const db = await createTestDb();
		dbs.push(db);

		const req = await createDownloadRequest('buyer@example.com', db);
		expect(req.status).toBe('pending');

		// duplicate pending request is deduped
		await createDownloadRequest('buyer@example.com', db);
		expect((await listDownloadRequests(db)).length).toBe(1);

		const grant = await grantDownload(req.id, 1, db);
		expect(grant.token).toBeTruthy();

		// valid token consumes once
		const first = await consumeDownloadToken(grant.token, db);
		expect(first).toEqual({ ok: true, email: 'buyer@example.com' });

		// second use rejected
		const second = await consumeDownloadToken(grant.token, db);
		expect(second).toEqual({ ok: false, reason: 'used' });

		// unknown token rejected
		expect(await consumeDownloadToken('nope', db)).toEqual({ ok: false, reason: 'invalid' });
	});

	it('expired grants are rejected', async () => {
		const db = await createTestDb();
		dbs.push(db);

		const req = await createDownloadRequest('late@example.com', db);
		const grant = await grantDownload(req.id, 1, db);
		await db.execute({
			sql: "UPDATE download_requests SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?",
			args: [req.id]
		});

		const result = await consumeDownloadToken(grant.token, db);
		expect(result).toEqual({ ok: false, reason: 'expired' });
	});
});
