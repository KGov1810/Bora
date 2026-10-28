// Client for the bora-api Worker (see SPEC-access.md). No DOM access.

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Creates an API client.
 *
 * @param {{ baseUrl: string, fetchImpl?: typeof fetch, timeoutMs?: number }} options
 */
export function createApiClient({ baseUrl, fetchImpl = (...args) => fetch(...args), timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const root = baseUrl.replace(/\/+$/, '');

  /** Calls the Worker; resolves with the Response, or null when offline or too slow. */
  async function request(path, code) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(`${root}${path}`, {
        headers: { Authorization: `Bearer ${code}` },
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    /**
     * Checks an access code with the Worker.
     *
     * @param {string} code - The code typed by the learner.
     * @returns {Promise<'ok' | 'invalid_code' | 'offline' | 'server_error'>}
     */
    async checkAccess(code) {
      const trimmed = code.trim();
      if (trimmed === '') return 'invalid_code';
      const response = await request('/auth/check', trimmed);
      if (response === null) return 'offline';
      if (response.status === 204 || response.status === 200) return 'ok';
      if (response.status === 401) return 'invalid_code';
      return 'server_error';
    },
  };
}
