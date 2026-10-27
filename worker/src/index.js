// Bora! API Worker (see SPEC-access.md).
// Routes: GET /health (public), GET /auth/check (access code). Everything else: 404.

import { codesMatch } from './auth.js';

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

    return respond(request, 404, { error: 'not_found' });
  },
};
