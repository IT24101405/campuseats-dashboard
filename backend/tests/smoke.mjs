// Start the API first, then run: node backend/tests/smoke.mjs
// Set TEST_DATABASE=true only against an isolated migrated lab database.
import assert from 'node:assert/strict';

const base = process.env.TEST_API_URL || 'http://localhost:8080';
async function check(path, status, options) {
    const response = await fetch(`${base}${path}`, options);
    assert.equal(response.status, status, `${options?.method || 'GET'} ${path}`);
    return response;
}
const post = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

assert.deepEqual(await (await check('/health', 200)).json(), { status: 'ok' });
for (const body of [
    {}, { name: ' ', email: 'bad', qty: 0 },
    { name: 'A', email: 'lab@example.com', qty: 1 },
    { name: 'Lab Tester', email: 'invalid', qty: 1 },
    { name: 'Lab Tester', email: 'lab@example.com', qty: 0 },
    { name: 'Lab Tester', email: 'lab@example.com', qty: 1.5 },
    { name: null, email: null, qty: -1 },
    { name: 'x'.repeat(101), email: 'lab@example.com', qty: 1 },
]) await check('/api/orders', 400, post(body));
await check('/api/orders', 400, { ...post({}), body: '{' });
await check('/api/orders', 405);
await check('/api/orders/1', 404);
for (const origin of ['http://localhost:5173', 'https://campuseats-dashboard-ten.vercel.app', 'https://untrusted.example']) {
    const response = await check('/api/orders', 204, {
        method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    });
    assert.equal(response.headers.get('access-control-allow-origin'), origin.includes('untrusted') ? null : origin);
}
console.log('PASS: health, invalid payloads, private order routes, allowed and denied CORS origins.');
if (process.env.TEST_DATABASE === 'true') {
    const menu = await (await check('/api/menu', 200)).json();
    const { readFile } = await import('node:fs/promises');
    const original = JSON.parse(await readFile(new URL('../../public/menu.json', import.meta.url), 'utf8'));
    assert.deepEqual(menu, original);
    const order = await (await check('/api/orders', 201, post({ name: 'Lab Tester', email: 'lab@example.com', qty: 2 }))).json();
    assert.ok(Number.isInteger(order.id) && order.id > 0);
    assert.equal('email' in order, false);
    console.log('PASS: database menu and order creation. Verify persistence in Neon using the returned ID:', order.id);
} else {
    console.log('SKIPPED: PostgreSQL menu and valid order creation (TEST_DATABASE is not true).');
}
