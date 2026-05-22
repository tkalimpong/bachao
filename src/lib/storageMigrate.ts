/** One-time migration from legacy storage keys (bachao_*, hamrogullak_*). */
export function migrateStorageKey(newKey: string, legacyKey: string): void {
  try {
    if (localStorage.getItem(newKey) != null) return;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy != null) localStorage.setItem(newKey, legacy);
  } catch {
    /* private browsing / quota */
  }
}

export function migrateSessionKey(newKey: string, legacyKey: string): void {
  try {
    if (sessionStorage.getItem(newKey) != null) return;
    const legacy = sessionStorage.getItem(legacyKey);
    if (legacy != null) sessionStorage.setItem(newKey, legacy);
  } catch {
    /* private browsing / quota */
  }
}
