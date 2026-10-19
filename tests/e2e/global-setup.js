import { aguardarBackend } from '../support/backend.js';

export default async function globalSetup() {
  await aguardarBackend();
}
