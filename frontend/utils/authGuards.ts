export type Role = 'user' | 'editor' | 'admin' | null;

export function canAccessEditor(role: Role): boolean {
  return role === 'editor' || role === 'admin';
}

export function canAccessAdmin(role: Role): boolean {
  return role === 'admin';
}
