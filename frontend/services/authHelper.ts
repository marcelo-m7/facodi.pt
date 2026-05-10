import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function getSessionUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getSessionUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

export async function requireAuthenticatedUser(options?: { fallbackToGetUser?: boolean }): Promise<User> {
  const fallbackToGetUser = options?.fallbackToGetUser ?? true;
  const sessionUser = await getSessionUser();
  if (sessionUser) return sessionUser;

  if (fallbackToGetUser) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) {
      return user;
    }
  }

  throw new Error('auth_required');
}
