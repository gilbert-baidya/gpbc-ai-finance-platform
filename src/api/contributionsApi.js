import { gasFetch } from './gasFetch';

export async function getAllContributions() {
  return gasFetch('getAllContributions');
}
