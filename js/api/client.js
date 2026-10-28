// Client for the bora-api Worker (see SPEC-access.md and SPEC-progress.md). No DOM access.

const DEFAULT_TIMEOUT_MS = 10000;

/** Maps an HTTP status to the statuses the app understands. */
function statusOf(response) {
  if (response === null) return 'offline';
  if (response.ok) return 'ok';
  if (response.status === 401) return 'invalid_code';
  return 'server_error';
}

/**
 * Creates an API client.
 *
 * @param {{ baseUrl: string, fetchImpl?: typeof fetch, timeoutMs?: number }} options
 */
export function createApiClient({ baseUrl, fetchImpl = (...args) => fetch(...args), timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const root = baseUrl.replace(/\/+$/, '');

  /** Calls the Worker; resolves with the Response, or null when offline or too slow. */
  async function request(path, code, { method = 'GET', body } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers = { Authorization: `Bearer ${code}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    try {
      return await fetchImpl(`${root}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Reads a JSON body; returns undefined when it is not valid JSON. */
  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  return {
    /**
     * Checks an access code with the Worker.
     * @returns {Promise<'ok' | 'invalid_code' | 'offline' | 'server_error'>}
     */
    async checkAccess(code) {
      const trimmed = code.trim();
      if (trimmed === '') return 'invalid_code';
      return statusOf(await request('/auth/check', trimmed));
    },

    /**
     * Sends answered exercises (at most 100).
     * @returns {Promise<{ status: string, saved?: number }>}
     */
    async postAttempts(code, attempts) {
      const response = await request('/progress/attempts', code, { method: 'POST', body: { attempts } });
      const status = statusOf(response);
      if (status !== 'ok') return { status };
      const body = await readJson(response);
      return Number.isInteger(body?.saved) ? { status, saved: body.saved } : { status: 'server_error' };
    },

    /**
     * Reads the progress summary.
     * @returns {Promise<{ status: string, summary?: { rounds: object[], exercises: object[] } }>}
     */
    async getSummary(code) {
      const response = await request('/progress/summary', code);
      const status = statusOf(response);
      if (status !== 'ok') return { status };
      const summary = await readJson(response);
      const valid = Array.isArray(summary?.rounds) && Array.isArray(summary?.exercises);
      return valid ? { status, summary } : { status: 'server_error' };
    },
  };
}
