import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PremiumContributionForm } from './PremiumContributionForm';
import { gasFetch } from '../api/gasFetch';
import { errorToast } from '../utils/toast';

vi.mock('../api/gasFetch', () => ({
  gasFetch: vi.fn()
}));

vi.mock('../utils/toast', () => ({
  errorToast: vi.fn(),
  successToast: vi.fn()
}));

describe('PremiumContributionForm - Members Directory Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles getMembers empty array cleanly without displaying an error toast', async () => {
    gasFetch.mockResolvedValue({
      success: true,
      members: []
    });

    render(<PremiumContributionForm />);

    await waitFor(() => {
      expect(screen.getByText(/No saved member directory is configured/i)).toBeInTheDocument();
    });

    expect(errorToast).not.toHaveBeenCalled();
    expect(screen.getByText('Guest / Visitor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByLabelText(/Service Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Method/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Record Income/i })).toBeInTheDocument();
  });

  it('allows user to select Guest / Visitor and fill manual fields when member list is empty', async () => {
    gasFetch.mockResolvedValue({
      success: true,
      members: []
    });

    render(<PremiumContributionForm />);

    await waitFor(() => {
      expect(screen.getByText(/No saved member directory is configured/i)).toBeInTheDocument();
    });

    const memberSelect = screen.getByLabelText(/Donor \/ Member/i);
    fireEvent.change(memberSelect, { target: { value: 'GUEST' } });
    expect(memberSelect.value).toBe('GUEST');

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '250.00' } });
    expect(amountInput.value).toBe('250.00');
  });
});
