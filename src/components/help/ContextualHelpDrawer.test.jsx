import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PageHelpButton from './PageHelpButton';
import ContextualHelpDrawer from './ContextualHelpDrawer';
import { getHelpArticleById } from '../../help/helpRegistry';

describe('ContextualHelpDrawer & PageHelpButton', () => {
  it('1. Renders PageHelpButton and opens drawer on click', () => {
    render(
      <MemoryRouter initialEntries={['/reimbursements']}>
        <PageHelpButton pageKey="reimbursements" label="Page Guide" />
      </MemoryRouter>
    );

    const helpBtn = screen.getByRole('button', { name: /Open help guide for Reimbursements/i });
    expect(helpBtn).toBeInTheDocument();

    fireEvent.click(helpBtn);

    expect(screen.getByRole('dialog', { name: /Reimbursements & Personal Purchases Help Guide/i })).toBeInTheDocument();
    expect(screen.getByText('Reimbursements & Personal Purchases')).toBeInTheDocument();
    expect(screen.getByText(/Common Mistakes to Avoid/i)).toBeInTheDocument();
  });

  it('2. Closes drawer when close button is clicked', () => {
    const mockClose = vi.fn();
    const article = getHelpArticleById('dashboard');

    render(
      <MemoryRouter>
        <ContextualHelpDrawer isOpen={true} onClose={mockClose} article={article} />
      </MemoryRouter>
    );

    const closeBtn = screen.getByRole('button', { name: /Close help drawer/i });
    fireEvent.click(closeBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('3. Closes drawer when Escape key is pressed', () => {
    const mockClose = vi.fn();
    const article = getHelpArticleById('monthly-close');

    render(
      <MemoryRouter>
        <ContextualHelpDrawer isOpen={true} onClose={mockClose} article={article} />
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('4. Automatically detects active route if pageKey is omitted', () => {
    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <PageHelpButton variant="header" label="Guide" />
      </MemoryRouter>
    );

    const helpBtn = screen.getByRole('button', { name: /Open help guide for Transactions Master Ledger/i });
    expect(helpBtn).toBeInTheDocument();

    fireEvent.click(helpBtn);

    expect(screen.getByText('Transactions Master Ledger')).toBeInTheDocument();
  });
});
