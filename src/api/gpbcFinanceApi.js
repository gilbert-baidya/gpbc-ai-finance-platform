import { gasFetch } from './gasFetch';

export async function addContribution(data) {
    return gasFetch('addContribution', data);
}

export async function getDashboardSummary(month, year) {
    return gasFetch('getDashboardSummary', { month, year });
}
