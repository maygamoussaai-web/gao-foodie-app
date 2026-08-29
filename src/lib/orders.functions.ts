import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSessionClient } from "./auth.server";
import { autoCancelStaleOrders, createOrders, fetchOrders, rateArticle } from "./orders.server";
import { getDb } from "./supabase.server";

export const listOrdersFn = createServerFn({ method: "GET" }).handler(async () => {
  const client = await requireSessionClient();
  return await fetchOrders(client.id);
});

export const createOrdersFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        items: z
          .array(
            z.object({
              type_article: z.enum(["plat", "boisson"]),
              article_id: z.string().uuid(),
              quantite: z.number().int().min(1).max(10),
            }),
          )
          .min(1),
        methode_localisation: z.enum(["audio", "position"]),
        localisation_url: z.string().max(500).nullable(),
        localisation_audio_url: z.string().max(500).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const client = await requireSessionClient();
    return await createOrders(client.id, data);
  });

export const cancelOrderFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const client = await requireSessionClient();
    const db = getDb();
    const { data: commande } = await db
      .from("commandes")
      .select("id, statut")
      .eq("id", data.id)
      .eq("client_id", client.id)
      .maybeSingle();
    if (!commande) throw new Error("Commande introuvable.");
    if (commande.statut === "payee" || commande.statut === "annulee") {
      throw new Error("Cette commande ne peut plus être annulée.");
    }
    const { error } = await db
      .from("commandes")
      .update({
        statut: "annulee",
        annulee_par: "client",
        annulee_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("client_id", client.id);
    if (error) throw new Error("Annulation impossible pour le moment.");
    return { ok: true };
  });

export const rateArticleFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        commande_article_id: z.string().uuid(),
        note: z.number().int().min(1).max(5),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const client = await requireSessionClient();
    return await rateArticle(client.id, data.commande_article_id, data.note);
  });

export const autoCancelFn = createServerFn({ method: "POST" }).handler(async () => {
  return await autoCancelStaleOrders();
});
