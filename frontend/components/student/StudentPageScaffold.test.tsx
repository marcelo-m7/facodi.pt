import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getStudentPageState } from './studentPageState';
import StudentPageScaffold from './StudentPageScaffold';

describe('getStudentPageState', () => {
  it('returns unauthenticated when user is not authenticated', () => {
    expect(getStudentPageState(false, false, null)).toBe('unauthenticated');
  });

  it('returns loading when authenticated and loading', () => {
    expect(getStudentPageState(true, true, null)).toBe('loading');
  });

  it('returns error when authenticated and has error', () => {
    expect(getStudentPageState(true, false, 'boom')).toBe('error');
  });

  it('returns ready when authenticated and no loading/error', () => {
    expect(getStudentPageState(true, false, null)).toBe('ready');
  });
});

describe('StudentPageScaffold', () => {
  const baseProps = {
    onBack: () => undefined,
    isAuthenticated: true,
    authMessage: 'auth required',
    isLoading: false,
    loadingMessage: 'loading...',
    error: null as string | null,
    errorTitle: 'error title',
  };

  it('renders children in ready state', () => {
    render(
      <StudentPageScaffold {...baseProps}>
        <p>ready child</p>
      </StudentPageScaffold>,
    );

    expect(screen.getByText('ready child')).toBeInTheDocument();
  });

  it('renders loading message when loading', () => {
    render(
      <StudentPageScaffold {...baseProps} isLoading>
        <p>ready child</p>
      </StudentPageScaffold>,
    );

    expect(screen.getByText('loading...')).toBeInTheDocument();
  });
});
