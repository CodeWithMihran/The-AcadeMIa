type SessionListener = () => void;

const listeners = new Set<SessionListener>();
let expirationReported = false;

export function subscribeToSessionExpiration(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notify the app once when concurrent API requests all find an expired token. */
export function reportSessionExpiration(): void {
  if (expirationReported) return;
  expirationReported = true;
  listeners.forEach(listener => listener());
}

/** A successful sign-in starts a fresh session and allows future expiry notices. */
export function resetSessionExpiration(): void {
  expirationReported = false;
}
