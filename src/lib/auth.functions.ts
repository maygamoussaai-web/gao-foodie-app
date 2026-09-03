import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  clearSessionCookie,
  getSessionClient,
  normalizeNumero,
  readSessionToken,
  requireSessionClient,
  startSession,
} from "./auth.server";
import { getDb, hashPin, verifyPin } from "./supabase.server";
import type { Client } from "./types";

export const meFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<(Client & { token: string }) | null> => {
    try {
      return await getSessionClient();
    } catch {
      return null;
    }
  },
);

export const registerFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        prenom: z.string().trim().min(2).max(50),
        nom: z.string().trim().min(2).max(50),
        numero: z.string().trim().min(8).max(20),
        pin: z.string().regex(/^\d{4,6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const numero = normalizeNumero(data.numero);
    const { data: existing } = await db
      .from("clients")
      .select("id")
      .eq("numero", numero)
      .maybeSingle();
    if (existing) throw new Error("Ce numéro est déjà utilisé. Connectez-vous.");

    const { data: created, error } = await db
      .from("clients")
      .insert({
        prenom: data.prenom,
        nom: data.nom,
        numero,
        code_pin_hash: await hashPin(data.pin),
      })
      .select("id, prenom, nom, numero")
      .single();
    if (error || !created) throw new Error("Inscription impossible pour le moment.");

    const token = await startSession(created.id as string);
    return { ...(created as Client), token };
  });

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        numero: z.string().trim().min(8).max(20),
        pin: z.string().regex(/^\d{4,6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const numero = normalizeNumero(data.numero);
    const cols = "id, prenom, nom, numero, code_pin_hash";
    let { data: client } = await db
      .from("clients")
      .select(cols)
      .eq("numero", numero)
      .maybeSingle();
    if (!client) {
      // Tolère les anciens enregistrements stockés avec indicatif ou séparateurs.
      const { data: legacy } = await db
        .from("clients")
        .select(cols)
        .ilike("numero", `%${numero}`)
        .limit(1)
        .maybeSingle();
      client = legacy;
    }
    if (!client) throw new Error("Numéro ou code PIN incorrect.");

    const ok = await verifyPin(data.pin, client.code_pin_hash as string);
    if (!ok) throw new Error("Numéro ou code PIN incorrect.");

    const token = await startSession(client.id as string);
    return {
      id: client.id,
      prenom: client.prenom,
      nom: client.nom,
      numero: client.numero,
      token,
    } as Client & { token: string };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const token = readSessionToken();
  if (token) {
    try {
      await getDb().from("sessions_client").delete().eq("token", token);
    } catch {
      /* la session locale est effacée dans tous les cas */
    }
  }
  clearSessionCookie();
  return { ok: true };
});

/** Génère un code de réinitialisation à 6 chiffres valable 15 minutes. */
export const requestPinResetFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ numero: z.string().trim().min(8).max(20) }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const { data: client } = await db
      .from("clients")
      .select("id, prenom, nom")
      .eq("numero", normalizeNumero(data.numero))
      .maybeSingle();
    if (!client) throw new Error("Aucun compte n'est lié à ce numéro.");

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
    const { error } = await db.from("codes_reset_client").insert({
      client_id: client.id,
      code,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (error) throw new Error("Impossible de générer un code pour le moment.");
    return { prenom: client.prenom as string, nom: client.nom as string };
  });

/** Vérifie le code reçu par WhatsApp puis remplace le code PIN. */
export const resetPinFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        numero: z.string().trim().min(8).max(20),
        code: z.string().regex(/^\d{6}$/),
        pin: z.string().regex(/^\d{4,6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const { data: client } = await db
      .from("clients")
      .select("id, prenom, nom, numero")
      .eq("numero", normalizeNumero(data.numero))
      .maybeSingle();
    if (!client) throw new Error("Aucun compte n'est lié à ce numéro.");

    const { data: reset } = await db
      .from("codes_reset_client")
      .select("id, expires_at, utilise")
      .eq("client_id", client.id)
      .eq("code", data.code)
      .eq("utilise", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!reset || new Date(reset.expires_at as string).getTime() < Date.now()) {
      throw new Error("Code invalide ou expiré.");
    }

    await db
      .from("clients")
      .update({ code_pin_hash: await hashPin(data.pin) })
      .eq("id", client.id);
    await db.from("codes_reset_client").update({ utilise: true }).eq("id", reset.id);
    const token = await startSession(client.id as string);
    return {
      id: client.id,
      prenom: client.prenom,
      nom: client.nom,
      numero: client.numero,
      token,
    } as Client & { token: string };
  });

export const updateProfileFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        prenom: z.string().trim().min(2).max(50),
        nom: z.string().trim().min(2).max(50),
        numero: z.string().trim().min(8).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const client = await requireSessionClient();
    const db = getDb();
    const numero = normalizeNumero(data.numero);
    if (numero !== client.numero) {
      const { data: taken } = await db
        .from("clients")
        .select("id")
        .eq("numero", numero)
        .maybeSingle();
      if (taken) throw new Error("Ce numéro est déjà utilisé par un autre compte.");
    }
    const { data: updated, error } = await db
      .from("clients")
      .update({ prenom: data.prenom, nom: data.nom, numero })
      .eq("id", client.id)
      .select("id, prenom, nom, numero")
      .single();
    if (error || !updated) throw new Error("Mise à jour impossible.");
    return updated as Client;
  });

export const changePinFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        ancien: z.string().regex(/^\d{4,6}$/),
        nouveau: z.string().regex(/^\d{4,6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const client = await requireSessionClient();
    const db = getDb();
    const { data: row } = await db
      .from("clients")
      .select("code_pin_hash")
      .eq("id", client.id)
      .single();
    const ok = row ? await verifyPin(data.ancien, row.code_pin_hash as string) : false;
    if (!ok) throw new Error("Ancien code PIN incorrect.");
    await db
      .from("clients")
      .update({ code_pin_hash: await hashPin(data.nouveau) })
      .eq("id", client.id);
    return { ok: true };
  });

/** Re-demande le code PIN avant une action sensible (validation de commande). */
export const confirmPinFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ pin: z.string().regex(/^\d{4,6}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const client = await requireSessionClient();
    const { data: row } = await getDb()
      .from("clients")
      .select("code_pin_hash")
      .eq("id", client.id)
      .single();
    const ok = row ? await verifyPin(data.pin, row.code_pin_hash as string) : false;
    if (!ok) throw new Error("Code PIN incorrect.");
    return { ok: true };
  });

/**
 * Réinitialisation autonome du code PIN, sans WhatsApp : le client prouve son
 * identité (numéro + prénom + nom exactement comme à l'inscription), un code
 * à usage unique est créé puis immédiatement consommé pour tracer l'opération.
 */
export const resetPinIdentityFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        numero: z.string().trim().min(8).max(20),
        prenom: z.string().trim().min(2).max(50),
        nom: z.string().trim().min(2).max(50),
        pin: z.string().regex(/^\d{4,6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const { data: client } = await db
      .from("clients")
      .select("id, prenom, nom, numero")
      .eq("numero", normalizeNumero(data.numero))
      .maybeSingle();
    if (!client) throw new Error("Aucun compte n'est lié à ce numéro.");

    const same = (a: string, b: string) =>
      a.trim().toLocaleLowerCase("fr") === b.trim().toLocaleLowerCase("fr");
    if (!same(client.prenom as string, data.prenom) || !same(client.nom as string, data.nom)) {
      throw new Error("Le prénom et le nom ne correspondent pas à ce numéro.");
    }

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
    await db.from("codes_reset_client").insert({
      client_id: client.id,
      code,
      utilise: true,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    const { error } = await db
      .from("clients")
      .update({ code_pin_hash: await hashPin(data.pin) })
      .eq("id", client.id);
    if (error) throw new Error("Réinitialisation impossible pour le moment.");

    const token = await startSession(client.id as string);
    return {
      id: client.id,
      prenom: client.prenom,
      nom: client.nom,
      numero: client.numero,
      token,
    } as Client & { token: string };
  });
