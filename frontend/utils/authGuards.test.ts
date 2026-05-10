import { describe, expect, it } from 'vitest';
import { canAccessAdmin, canAccessEditor } from './authGuards';

describe('auth role guards', () => {
  it('allows editor/admin to editor routes', () => {
    expect(canAccessEditor('editor')).toBe(true);
    expect(canAccessEditor('admin')).toBe(true);
    expect(canAccessEditor('user')).toBe(false);
  });

  it('allows only admin to admin routes', () => {
    expect(canAccessAdmin('admin')).toBe(true);
    expect(canAccessAdmin('editor')).toBe(false);
    expect(canAccessAdmin(null)).toBe(false);
  });
});
