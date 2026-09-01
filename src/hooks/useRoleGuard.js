import { useAuth } from '../context/AuthContext';

/**
 * Role Permission Matrix
 * Actions mapped to authorized roles
 */
export const PERMISSIONS = {
    VIEW_DASHBOARD: ['SUPER_ADMIN', 'PASTOR', 'TREASURER', 'AUDITOR'],
    ADD_CONTRIBUTION: ['SUPER_ADMIN', 'TREASURER', 'FINANCE_VOLUNTEER'],
    ADD_EXPENSE: ['SUPER_ADMIN', 'TREASURER'],
    DELETE_RECORDS: ['SUPER_ADMIN'],
    VIEW_REPORTS: ['SUPER_ADMIN', 'PASTOR', 'TREASURER', 'AUDITOR'],
    MANAGE_USERS: ['SUPER_ADMIN'],
    GENERATE_TAX_LETTERS: ['SUPER_ADMIN', 'PASTOR', 'TREASURER']
};

export function useRoleGuard() {
    const { user } = useAuth();
    const currentRole = user?.role;

    const hasPermission = (permission) => {
        const allowedRoles = PERMISSIONS[permission];
        if (!allowedRoles) return false;
        return allowedRoles.includes(currentRole);
    };

    const isAdmin = currentRole === 'SUPER_ADMIN';

    return { hasPermission, isAdmin, currentRole };
}
