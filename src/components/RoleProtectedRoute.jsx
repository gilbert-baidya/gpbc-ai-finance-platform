import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { AlertCircle } from 'lucide-react';

/**
 * Route level protection component
 */
export const RoleProtectedRoute = ({ children, permission }) => {
    const { hasPermission } = useRoleGuard();
    const location = useLocation();

    if (!hasPermission(permission)) {
        // Redirect to unauthorized page or show access denied
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="p-4 bg-red-50 rounded-full text-red-500">
                    <AlertCircle size={48} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-wine">Access Denied</h2>
                    <p className="text-muted max-w-sm mx-auto">
                        Your account role does not have permission to access this module.
                        Please contact the Church Administrator if this is an error.
                    </p>
                </div>
                <button
                    onClick={() => window.history.back()}
                    className="btn btn-primary"
                >
                    Return to Safe Page
                </button>
            </div>
        );
    }

    return children;
};
