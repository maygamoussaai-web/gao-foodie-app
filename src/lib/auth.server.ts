import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { getDb, newSessionToken } from "./supabase.server";
import type { Client } from "./types";

export const SESSION_COOKIE = "gf_session";
const NINETY_DAYS = 60 * 60 * 24 * 90;

export function readSessionToken(): string | null {
  const cookie = getRequestHeader("cookie") ?? "";
  const match = cookie.split(";").find((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const value = match.split("=").slice(1).join("=").trim();
  return value.length > 0 ? decodeURIComponent(value) : null;
}

export function writeSessionCookie(token: string, maxAge = NINETY_DAYS) {
  setResponseHeader(
    "set-cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`,
  );
}

export function clearSessionCookie() {
  setResponseHeader(
    "set-cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`,
  );
}

export function normalizeNumero(numero: string): string {
  return numero.replace(/[\s.\-()]/g, "");
}

/** Crée une session de 90 jours et pose le cookie httpOnly. */
export async function startSession(clientId: string): Promise<void> {
  const db = getDb();
  const token = newSessionToken();
  const expires = new Date(Date.now() + NINETY_DAYS * 1000).toISOString();
  const { error } = await db
    .from("sessions_client")
    .insert({ client_id: clientId, token, expires_at: expires });
  if (error) throw new Error("Impossible d'ouvrir la session.");
  writeSessionCookie(token);
}

/** Retourne le client authentifié, avec rotation du token si expiration proche. */
export async function getSessionClient(): Promise<Client | null> {
  const token = readSessionToken();
  if (!token) return null;
  const db = getDb();
  const { data: session } = await db
    .from("sessions_client")
    .select("id, client_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!session) return null;

  const expiresAt = new Date(session.expires_at as string).getTime();
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    await db.from("sessions_client").delete().eq("id", session.id);
    clearSessionCookie();
    return null;
  }

  const { data: client } = await db
    .from("clients")
    .select("id, prenom, nom, numero")
    .eq("id", session.client_id)
    .maybeSingle();
  if (!client) return null;

  // Rotation quand il reste moins de 15 jours.
  if (expiresAt - Date.now() < 15 * 24 * 3600 * 1000) {
    const fresh = newSessionToken();
    const { error } = await db
      .from("sessions_client")
      .update({
        token: fresh,
        expires_at: new Date(Date.now() + NINETY_DAYS * 1000).toISOString(),
      })
      .eq("id", session.id);
    if (!error) writeSessionCookie(fresh);
  }

  return client as Client;
}

export async function requireSessionClient(): Promise<Client> {
  const client = await getSessionClient();
  if (!client) throw new Error("SESSION_EXPIREE");
  return client;
}
