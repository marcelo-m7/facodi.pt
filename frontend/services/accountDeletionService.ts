import { supabase } from './supabase';

export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;
}

export async function logAccountDeletionAttempt(userId: string, status: 'requested' | 'failed' | 'completed', reason?: string): Promise<void> {
  const client = supabase as unknown as {
    from: (table: string) => {
      insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await client.from('account_deletion_audit').insert({
    user_id: userId,
    status,
    reason: reason ?? null,
    event_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('[accountDeletionService] failed to write audit record:', error.message);
  }
}
