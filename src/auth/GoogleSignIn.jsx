import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Info } from 'lucide-react';
import {
  getGoogleIdentityOrigin,
  isSupportedLocalGoogleIdentityOrigin,
  prepareGoogleIdentity,
  setGoogleCredentialHandler,
} from './googleIdentity';
import './GoogleSignIn.css';

export const GoogleSignIn = () => {
  const { signInWithGoogleCredential, error, loading, devSignIn } = useAuth();
  const googleBtnRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    const googleButton = googleBtnRef.current;
    if (!clientId || !googleButton) return;

    let cancelled = false;
    const removeCredentialHandler = setGoogleCredentialHandler(async (response) => {
      if (response.credential) {
        try {
          await signInWithGoogleCredential(response.credential);
        } catch {
          // AuthContext owns the user-facing verification error and session cleanup.
        }
      }
    });

    if (isDev) {
      const runtimeOrigin = getGoogleIdentityOrigin();
      console.info(`[Google Identity] Runtime origin: ${runtimeOrigin}`);
      if (!isSupportedLocalGoogleIdentityOrigin(runtimeOrigin)) {
        console.warn(`[Google Identity] Unsupported local origin: ${runtimeOrigin}`);
      }
    }

    void prepareGoogleIdentity(clientId)
      .then((googleIdentity) => {
        if (cancelled) return;

        googleButton.replaceChildren();
        googleIdentity.renderButton(googleButton, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 280,
        });
      })
      .catch((gisError) => {
        if (!cancelled) console.error('[Google Identity] Initialization failed', gisError);
      });

    return () => {
      cancelled = true;
      removeCredentialHandler();
      googleButton.replaceChildren();
    };
  }, [clientId, isDev, signInWithGoogleCredential]);

  return (
    <div className="signin-container">
      <div className="signin-card glass-panel">
        <div className="signin-header">
          <img
            src="/Logo-gpbc.png"
            alt="GPBC Logo"
            className="signin-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1 className="signin-title">GPBC Finance Desk</h1>
          <p className="signin-subtitle">Finance • Audit • Reporting</p>
          <span className="signin-church">Grace and Praise Bangladeshi Church</span>
        </div>

        <div className="signin-divider" />

        <div className="signin-body">
          {error && (
            <div className="signin-alert error">
              <Lock size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="signin-loading">
              <div className="spinner" />
              <span>Verifying session...</span>
            </div>
          ) : (
            <div className="signin-action-area">
              <p className="signin-prompt">
                Please sign in with your authorized Google Workspace account:
              </p>

              {clientId ? (
                <div ref={googleBtnRef} className="google-btn-wrapper" />
              ) : (
                <div className="signin-alert warning">
                  <Info size={16} />
                  <div>
                    <strong>Google OAuth Client Not Configured</strong>
                    <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> to enable Google Sign-In.
                    </p>
                  </div>
                </div>
              )}

              {/* Development Testing Mode */}
              {isDev && devSignIn && (
                <div className="dev-auth-box">
                  <div className="dev-auth-header">
                    <Shield size={14} />
                    <span>Local Development Preview Roles</span>
                  </div>
                  <div className="dev-role-buttons">
                    <button
                      type="button"
                      className="dev-btn admin"
                      onClick={() => devSignIn('Primary Admin')}
                    >
                      Primary Admin
                    </button>
                    <button
                      type="button"
                      className="dev-btn editor"
                      onClick={() => devSignIn('Finance Editor')}
                    >
                      Finance Editor
                    </button>
                    <button
                      type="button"
                      className="dev-btn viewer"
                      onClick={() => devSignIn('Viewer')}
                    >
                      Viewer
                    </button>
                    <button
                      type="button"
                      className="dev-btn presbyter"
                      onClick={() => devSignIn('Presbyter Read-Only')}
                    >
                      Presbyter Read-Only
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="signin-footer">
          <p>Restricted financial administration system for authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignIn;
