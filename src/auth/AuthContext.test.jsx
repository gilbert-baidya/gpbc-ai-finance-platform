import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { gasFetch, setActiveIdToken } from '../api/gasFetch';

vi.mock('../api/gasFetch', () => ({
  gasFetch: vi.fn(),
  setActiveIdToken: vi.fn(),
  setOnUnauthorizedCallback: vi.fn()
}));

const TestAuthConsumer = () => {
  const { user, idToken, isAuthenticated, devSignIn, signInWithGoogleCredential, signOut, isAuthorized } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
      <div data-testid="user-role">{user?.role || 'None'}</div>
      <div data-testid="user-email">{user?.email || 'None'}</div>
      <div data-testid="token-status">{idToken || 'None'}</div>
      <div data-testid="is-admin">{isAuthorized(['Primary Admin', 'Backup Admin']) ? 'Yes' : 'No'}</div>
      <div data-testid="is-editor">{isAuthorized(['Finance Editor']) ? 'Yes' : 'No'}</div>
      {devSignIn && (
        <>
          <button onClick={() => devSignIn('Primary Admin')}>Sign In Admin</button>
          <button onClick={() => devSignIn('Finance Editor')}>Sign In Editor</button>
          <button onClick={() => devSignIn('Presbyter Read-Only')}>Sign In Presbyter</button>
        </>
      )}
      <button onClick={signOut}>Sign Out</button>
      <button onClick={() => signInWithGoogleCredential('real-google-id-token')}>Sign In Google</button>
    </div>
  );
};

describe('AuthContext and Role Authorization', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes in unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('Guest');
    expect(screen.getByTestId('user-role').textContent).toBe('None');
    expect(screen.getByTestId('is-admin').textContent).toBe('No');
  });

  it('updates state and role permissions upon sign in', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    const adminBtn = screen.getByText('Sign In Admin');
    await act(async () => {
      adminBtn.click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
    expect(screen.getByTestId('user-role').textContent).toBe('Primary Admin');
    expect(screen.getByTestId('is-admin').textContent).toBe('Yes');
    expect(screen.getByTestId('is-editor').textContent).toBe('No');
    expect(screen.getByTestId('token-status').textContent).toBe('None');
    expect(sessionStorage.getItem('gpbc_session_token')).toBeNull();
    expect(setActiveIdToken).toHaveBeenLastCalledWith(null);
  });

  it('uses the backend-approved role for Google sign-in', async () => {
    gasFetch.mockResolvedValue({
      success: true,
      user: {
        email: 'approved@example.com',
        name: 'Approved User',
        role: 'Finance Editor'
      }
    });

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Sign In Google').click();
    });

    expect(gasFetch).toHaveBeenCalledWith('verifySession', {}, 'real-google-id-token');
    expect(screen.getByTestId('user-role').textContent).toBe('Finance Editor');
    expect(screen.getByTestId('user-email').textContent).toBe('approved@example.com');
    expect(screen.getByTestId('token-status').textContent).toBe('real-google-id-token');
  });

  it('clears one rejected retained token without duplicate StrictMode verification', async () => {
    sessionStorage.setItem('gpbc_session_token', 'expired-google-id-token');
    sessionStorage.setItem('gpbc_session_user', JSON.stringify({
      email: 'stale@example.com',
      name: 'Stale User',
      role: 'Primary Admin'
    }));
    gasFetch.mockRejectedValue(new Error('Token expired'));

    render(
      <React.StrictMode>
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      </React.StrictMode>
    );

    await waitFor(() => {
      expect(sessionStorage.getItem('gpbc_session_token')).toBeNull();
    });

    expect(gasFetch).toHaveBeenCalledTimes(1);
    expect(gasFetch).toHaveBeenCalledWith('verifySession', {}, 'expired-google-id-token');
    expect(sessionStorage.getItem('gpbc_session_user')).toBeNull();
    expect(screen.getByTestId('auth-status').textContent).toBe('Guest');
  });

  it('switches roles and clears on sign out', async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    const editorBtn = screen.getByText('Sign In Editor');
    await act(async () => {
      editorBtn.click();
    });

    expect(screen.getByTestId('user-role').textContent).toBe('Finance Editor');
    expect(screen.getByTestId('is-editor').textContent).toBe('Yes');
    expect(screen.getByTestId('is-admin').textContent).toBe('No');

    const signOutBtn = screen.getByText('Sign Out');
    await act(async () => {
      signOutBtn.click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('Guest');
    expect(screen.getByTestId('user-role').textContent).toBe('None');
  });
});
