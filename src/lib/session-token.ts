const KEY = "gaofood.session.v1";

/**
 * Repli de session pour les contextes où le cookie httpOnly n'est pas renvoyé
 * (aperçu en iframe, navigateurs bloquant les cookies tiers). Le jeton est
 * alors ajouté à chaque appel serveur via l'en-tête x-gf-session.
 */
export function getSessionToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null | undefined): void {
  if (typeof localStorage === "undefined" || !token) return;
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* stockage indisponible : on reste sur le cookie */
  }
}

export function clearSessionToken(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* rien à nettoyer */
  }
}
