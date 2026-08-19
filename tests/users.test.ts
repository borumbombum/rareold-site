import { afterEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { createTestDb } from './helpers/db';
import { getUserById, upsertUser } from '$lib/server/users';

const dbs: Client[] = [];

async function db(): Promise<Client> {
	const client = await createTestDb();
	dbs.push(client);
	return client;
}

afterEach(async () => {
	for (const c of dbs) c.close();
	dbs.length = 0;
});

describe('upsertUser', () => {
	it('creates a user with defaults', async () => {
		const client = await db();
		const user = await upsertUser(
			{
				sub: 'g1',
				email: 'one@example.com',
				name: 'One',
				login_type: 'google'
			},
			client
		);
		expect(user.id).toBe('g1');
		expect(user.role).toBe('user');
		expect(user.login_type).toBe('google');
	});

	it('updates the existing row (no duplicates)', async () => {
		const client = await db();
		await upsertUser({ sub: 'g1', email: 'one@example.com', name: 'One' }, client);
		const updated = await upsertUser(
			{
				sub: 'g1',
				email: 'one@example.com',
				name: 'Renamed'
			},
			client
		);
		expect(updated.name).toBe('Renamed');
		const count = await client.execute('SELECT COUNT(*) AS n FROM users');
		expect(Number(count.rows[0].n)).toBe(1);
	});

	it('sets role from claims on re-login', async () => {
		const client = await db();
		await upsertUser({ sub: 'g1', email: 'one@example.com', name: 'One' }, client);
		await client.execute("UPDATE users SET role = 'admin' WHERE id = 'g1'");
		const re = await upsertUser(
			{ sub: 'g1', email: 'one@example.com', name: 'One', role: 'admin' },
			client
		);
		expect(re.role).toBe('admin');
	});

	it('resets role to user when claims have no admin', async () => {
		const client = await db();
		await upsertUser({ sub: 'g1', email: 'one@example.com', name: 'One', role: 'admin' }, client);
		const re = await upsertUser(
			{ sub: 'g1', email: 'one@example.com', name: 'One' },
			client
		);
		expect(re.role).toBe('user');
	});
});

describe('getUserById', () => {
	it('returns null for an unknown user', async () => {
		const client = await db();
		expect(await getUserById('nope', client)).toBeNull();
	});

	it('returns the user row', async () => {
		const client = await db();
		await upsertUser({ sub: 'g2', email: 'two@example.com', name: 'Two' }, client);
		const user = await getUserById('g2', client);
		expect(user?.email).toBe('two@example.com');
	});
});
