import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleSignIn } from '../auth/GoogleSignIn';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isAuthorized, user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
        <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
        <span>Loading session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <GoogleSignIn />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !isAuthorized(allowedRoles)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        padding: '32px'
      }}>
        <div style={{
          padding: '16px',
          background: '#FEE2E2',
          borderRadius: '50%',
          color: '#991B1B',
          marginBottom: '16px'
        }}>
          <ShieldAlert size={48} />
        </div>
        <h2 style={{ color: '#2C3E50', margin: '0 0 8px 0', fontSize: '1.5rem' }}>Access Denied</h2>
        <p style={{ color: '#6B7280', maxWidth: '420px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
          Your current role (<strong>{user?.role || 'None'}</strong>) does not have permission to access this module.
          Please contact the Pastor or Church Administrator if this is unexpected.
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: '#2C3E50',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={16} />
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
