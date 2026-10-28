// The app's recorder, wired to localStorage and the bora-api Worker.

import { API_BASE_URL } from '../config.js';
import { createApiClient } from '../api/client.js';
import { createCodeStore } from '../api/storage.js';
import { createAttemptQueue } from './queue.js';
import { createRecorder } from './record.js';

const codeStore = createCodeStore();

export const recorder = createRecorder({
  queue: createAttemptQueue(),
  client: createApiClient({ baseUrl: API_BASE_URL }),
  getCode: () => codeStore.get(),
});
