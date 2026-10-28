// Sends waiting answers to the server in batches (see SPEC-progress.md). No DOM access.

const BATCH_SIZE = 100;

/**
 * Sends the queue, oldest first, in batches of 100. Attempts leave the queue only
 * once the server confirmed their batch; the first failure stops the sync.
 *
 * @param {{ queue: object, client: object, code: string | null }} options
 * @returns {Promise<{ status: string, sent: number }>}
 */
export async function syncAttempts({ queue, client, code }) {
  if (!code) return { status: 'no_code', sent: 0 };
  let sent = 0;
  for (;;) {
    const batch = queue.all().slice(0, BATCH_SIZE);
    if (batch.length === 0) return { status: 'ok', sent };
    const result = await client.postAttempts(code, batch);
    if (result.status !== 'ok') return { status: result.status, sent };
    queue.remove(batch.map((attempt) => attempt.clientId));
    sent += batch.length;
  }
}
