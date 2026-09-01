import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

const TestAuthConsumer = () => {
  const { user, isAuthenticated, devSignIn, signOut, isAuthorized } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
      <div data-testid="user-role">{user?.role || 'None'}</div>
      <div data-testid="user-email">{user?.email || 'None'}</div>
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
    </div>
  );
};

describe('AuthContext and Role Authorization', () => {
  beforeEach(() => {
    sessionStorage.clear();
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
