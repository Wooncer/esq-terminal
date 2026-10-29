import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelay } from './railway-relay.mjs';

test('relay requires authentication, restricts destinations, and streams Gemini responses', async () => {
  const token = 'fixture-'.repeat(8);
  let called = 0;
  const server = createRelay({ token, fetcher: async (url, options) => {
    called++;
    assert.equal(url.origin, 'https://generativelanguage.googleapis.com');
    assert.equal(url.pathname, '/v1beta/models/gemini-2.5-flash:streamGenerateContent');
    assert.equal(url.search, '?alt=sse');
    assert.equal(options.headers['x-goog-api-key'], 'fixture-key');
    assert.equal(options.headers.authorization, undefined);
    return new Response('data: {"text":"ok"}\n\n', { headers: { 'content-type': 'text/event-stream' } });
  }});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    assert.equal((await fetch(base + '/health')).status, 200);
    assert.equal((await fetch(base + '/v1beta/models')).status, 401);
    const headers = { authorization: 'Bearer ' + token, 'x-goog-api-key': 'fixture-key' };
    assert.equal((await fetch(base + '/https://other.example', { headers })).status, 404);
    const r = await fetch(base + '/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=discard', { method: 'POST', headers, body: '{}' });
    assert.equal(r.status, 200);
    assert.equal(await r.text(), 'data: {"text":"ok"}\n\n');
    assert.equal(called, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
