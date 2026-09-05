import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DevRoleSwitcher } from './DevRoleSwitcher';
import { useAuth } from './AuthContext';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('DevRoleSwitcher', () => {
  it('is available while signed out in development', () => {
    useAuth.mockReturnValue({ devSignIn: vi.fn(), idToken: null, user: null });

    render(<DevRoleSwitcher />);

    expect(screen.getByText('Dev Role: Signed Out')).toBeInTheDocument();
  });

  it('is hidden while a real Google-authenticated session is active', () => {
    useAuth.mockReturnValue({
      devSignIn: vi.fn(),
      idToken: 'real-google-id-token',
      user: { email: 'gilbert.baidya@gmail.com', name: 'Gilbert Baidya', role: 'Primary Admin' }
    });

    render(<DevRoleSwitcher />);

    expect(screen.queryByText(/Dev Role:/)).not.toBeInTheDocument();
  });
});