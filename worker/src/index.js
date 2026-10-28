// Bora! API Worker (see SPEC-access.md).
// Routes: GET /health (public); with the access code: GET /auth/check,
// POST /progress/attempts, GET /progress/summary (see SPEC-progress.md). Everything else: 404.

import { codesMatch } from './auth.js';
import { parseAttempts, saveAttempts, readSummary } from './progress.js';

const MAX_BODY_LENGTH = 100000;

const ALLOWED_ORIGINS = ['https://kgov1810.github.io', 'http://localhost:8000'];

/** CORS headers for an allowed origin; none for any other origin. */
function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  if (!ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** A JSON response, or an empty one for 204, with CORS headers. */
function respond(request, status, body = null) {
  const headers = { ...corsHeaders(request), 'Cache-Control': 'no-store' };
  if (body === null) return new Response(null, { status, headers });
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Checks the Authorization header against the ACCESS_CODE secret.
 * @returns {Promise<Response | null>} An error response, or null when access is granted.
 */
async function requireAccess(request, env) {
  if (!env.ACCESS_CODE) return respond(request, 503, { error: 'not_configured' });
  const header = request.headers.get('Authorization') ?? '';
  const code = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!(await codesMatch(code, env.ACCESS_CODE))) return respond(request, 401, { error: 'invalid_code' });
  return null;
}

/** Parses a JSON body of reasonable size; returns null when it is not valid JSON. */
async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_LENGTH) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Runs a handler only with a valid access code and a bound database. */
async function withAccessAndDb(request, env, handler) {
  const denied = await requireAccess(request, env);
  if (denied) return denied;
  if (!env.DB) return respond(request, 503, { error: 'database_not_configured' });
  try {
    return await handler();
  } catch (error) {
    console.error('Progress route failed:', error);
    return respond(request, 500, { error: 'server_error' });
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return respond(request, 204);

    const { pathname } = new URL(request.url);

    if (request.method === 'GET' && pathname === '/health') {
      return respond(request, 200, { ok: true });
    }

    if (request.method === 'GET' && pathname === '/auth/check') {
      return (await requireAccess(request, env)) ?? respond(request, 204);
    }

    if (pathname === '/progress/attempts' && request.method === 'POST') {
      return withAccessAndDb(request, env, async () => {
        const attempts = parseAttempts(await readJson(request));
        if (!attempts) return respond(request, 400, { error: 'invalid_body' });
        return respond(request, 200, { saved: await saveAttempts(env.DB, attempts) });
      });
    }

    if (pathname === '/progress/summary' && request.method === 'GET') {
      return withAccessAndDb(request, env, async () => respond(request, 200, await readSummary(env.DB)));
    }

    return respond(request, 404, { error: 'not_found' });
  },
};
