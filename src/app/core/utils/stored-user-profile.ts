/** Shape of `userProfile` in localStorage (name/email/mobile + optional role). */
export interface StoredUserProfile {
  name: string;
  email: string;
  mobile: string;
  role?: string;
}

export function readStoredUserProfile(): StoredUserProfile | null {
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredUserProfile;
  } catch {
    return null;
  }
}

export function readStoredRole(): string | null {
  const r = (readStoredUserProfile()?.role || '').trim().toLowerCase();
  return r || null;
}

export function profileRouteForRole(role: string | null | undefined): string {
  const r = (role || 'user').toLowerCase();
  return r === 'admin' ? '/admin-profile' : '/profile';
}

/** Keep local `userProfile` in sync with API user (including role). */
export function mergeStoredProfileWithUser(user: {
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
} | null | undefined): void {
  if (!user) {
    return;
  }
  try {
    const prev = readStoredUserProfile();
    const next: StoredUserProfile = {
      name: user.name ?? prev?.name ?? '',
      email: user.email ?? prev?.email ?? '',
      mobile: user.mobile ?? prev?.mobile ?? '',
      role: user.role ?? prev?.role ?? 'user'
    };
    localStorage.setItem('userProfile', JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
