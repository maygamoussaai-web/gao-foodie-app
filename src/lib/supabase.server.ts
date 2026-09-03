import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur uniquement (clé service_role).
 * L'authentification de GAO FOOD est custom (tables clients / sessions_client),
 * il n'y a pas de auth.users : toute la vérification d'identité est faite ici,
 * jamais dans le navigateur.
 */
export function getDb(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Base de données non connectée : reliez le projet Supabase existant dans les réglages.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Le runtime Worker refuse PBKDF2 au-delà de 100 000 itérations. */
const PBKDF2_MAX_ITERATIONS = 100_000;
const PBKDF2_ITERATIONS = 100_000;

/** Vrai si le hachage stocké n'est plus vérifiable / doit être régénéré. */
export function isLegacyPinHash(stored: string): boolean {
  const parts = stored.split("$");
  return parts[0] === "pbkdf2" && Number(parts[1]) > PBKDF2_MAX_ITERATIONS;
}

/** Vrai si le hachage est valide mais pas au format courant. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  return parts[0] !== "pbkdf2" || Number(parts[1]) !== PBKDF2_ITERATIONS;
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt.buffer)}$${toHex(bits)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  // Au-delà de la limite du runtime, l'appel WebCrypto lèverait une erreur technique.
  if (!Number.isFinite(iterations) || iterations > PBKDF2_MAX_ITERATIONS) return false;
  const saltHex = parts[2] ?? "";
  const expected = parts[3] ?? "";
  const salt = new Uint8Array(
    (saltHex.match(/.{2}/g) ?? []).map((byte) => Number.parseInt(byte, 16)),
  );
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  const actual = toHex(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function newSessionToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
}
