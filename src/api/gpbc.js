import { apiFetch } from './http';

/**
 * Get dashboard summary metrics and charts
 */
export const getDashboardSummary = async ({ month, year }) => {
    const query = `?action=getDashboardSummary&month=${month}&year=${year}`;
    return apiFetch(query);
};

/**
 * List all members
 */
export const listMembers = async () => {
    return apiFetch('?action=listMembers');
};

/**
 * Create a new member
 */
export const createMember = async (payload) => {
    return apiFetch('', {
        method: 'POST',
        body: {
            action: 'createMember',
            data: payload
        }
    });
};

/**
 * Create a new contribution entry
 */
export const createContribution = async (payload) => {
    return apiFetch('', {
        method: 'POST',
        body: {
            action: 'createContribution',
            data: payload
        }
    });
};

/**
 * Create a new expense entry
 */
export const createExpense = async (payload) => {
    return apiFetch('', {
        method: 'POST',
        body: {
            action: 'createExpense',
            data: payload
        }
    });
};
