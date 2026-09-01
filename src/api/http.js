import { gasFetch } from './gasFetch';

export async function apiFetch(action, payload = {}) {
  try {
    return await gasFetch(action, payload);
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default apiFetch;
