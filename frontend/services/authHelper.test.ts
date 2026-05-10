import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, getUser } = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession,
      getUser,
    },
  },
}));

import { getSessionUserId, requireAuthenticatedUser } from './authHelper';

describe('authHelper', () => {
  beforeEach(() => {
    getSession.mockReset();
    getUser.mockReset();
  });

  it('returns session user id when available', async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'session-user-id' },
        },
      },
    });

    const userId = await getSessionUserId();
    expect(userId).toBe('session-user-id');
  });

  it('falls back to getUser when session is empty', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    getUser.mockResolvedValue({
      data: {
        user: {
          id: 'fallback-user-id',
          email: 'fallback@example.com',
        },
      },
      error: null,
    });

    const user = await requireAuthenticatedUser();
    expect(user.id).toBe('fallback-user-id');
  });

  it('throws auth_required when no user is available', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'missing' } });

    await expect(requireAuthenticatedUser()).rejects.toThrow('auth_required');
  });
});
