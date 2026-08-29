import { getDb } from "./supabase.server";
import type { Commande, CommandeArticle } from "./types";

export type NewOrderItem = {
  type_article: "plat" | "boisson";
  article_id: string;
  quantite: number;
};

export type NewOrderPayload = {
  items: NewOrderItem[];
  methode_localisation: "audio" | "position";
  localisation_url: string | null;
  localisation_audio_url: string | null;
};

/**
 * Regroupe les articles du panier par restaurant : une commande distincte
 * est créée pour chaque restaurant concerné.
 */
export async function createOrders(clientId: string, payload: NewOrderPayload) {
  const db = getDb();
  if (payload.items.length === 0) throw new Error("Votre panier est vide.");

  const platIds = payload.items.filter((i) => i.type_article === "plat").map((i) => i.article_id);
  const boissonIds = payload.items
    .filter((i) => i.type_article === "boisson")
    .map((i) => i.article_id);

  const [{ data: plats }, { data: boissons }] = await Promise.all([
    platIds.length
      ? db.from("plats").select("id, restaurant_id, nom, prix, actif").in("id", platIds)
      : Promise.resolve({ data: [] as never[] }),
    boissonIds.length
      ? db.from("boissons").select("id, restaurant_id, nom, prix, actif").in("id", boissonIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  type Ref = { id: string; restaurant_id: string; nom: string; prix: number; actif: boolean };
  const refs = new Map<string, Ref>();
  for (const row of [...((plats ?? []) as Ref[]), ...((boissons ?? []) as Ref[])]) {
    refs.set(row.id, row);
  }

  // Prix et disponibilité sont toujours relus côté serveur : jamais le panier client.
  const grouped = new Map<
    string,
    { nom_article: string; prix_unitaire: number; quantite: number; item: NewOrderItem }[]
  >();
  for (const item of payload.items) {
    const ref = refs.get(item.article_id);
    if (!ref || !ref.actif) continue;
    const list = grouped.get(ref.restaurant_id) ?? [];
    list.push({
      nom_article: ref.nom,
      prix_unitaire: ref.prix,
      quantite: Math.min(10, Math.max(1, item.quantite)),
      item,
    });
    grouped.set(ref.restaurant_id, list);
  }
  if (grouped.size === 0) throw new Error("Ces articles ne sont plus disponibles.");

  const { data: restaurants } = await db
    .from("restaurants")
    .select("id, prix_livraison, delai_livraison_min_min, delai_livraison_max_min, statut")
    .in("id", [...grouped.keys()]);

  const createdIds: string[] = [];
  for (const [restaurantId, lignes] of grouped) {
    const restaurant = (restaurants ?? []).find((r) => r.id === restaurantId);
    if (!restaurant || restaurant.statut !== "actif") continue;

    const totalArticles = lignes.reduce((sum, l) => sum + l.prix_unitaire * l.quantite, 0);
    const coutLivraison = Number(restaurant.prix_livraison ?? 0);

    const { data: commande, error } = await db
      .from("commandes")
      .insert({
        client_id: clientId,
        restaurant_id: restaurantId,
        statut: "en_cours",
        total_articles: totalArticles,
        cout_livraison: coutLivraison,
        total_commande: totalArticles + coutLivraison,
        delai_livraison_min_min: restaurant.delai_livraison_min_min,
        delai_livraison_max_min: restaurant.delai_livraison_max_min,
        methode_localisation: payload.methode_localisation,
        localisation_url: payload.localisation_url,
        localisation_audio_url: payload.localisation_audio_url,
      })
      .select("id")
      .single();
    if (error || !commande) throw new Error("La commande n'a pas pu être enregistrée.");

    const { error: articlesError } = await db.from("commande_articles").insert(
      lignes.map((l) => ({
        commande_id: commande.id,
        type_article: l.item.type_article,
        plat_id: l.item.type_article === "plat" ? l.item.article_id : null,
        boisson_id: l.item.type_article === "boisson" ? l.item.article_id : null,
        nom_article: l.nom_article,
        prix_unitaire: l.prix_unitaire,
        quantite: l.quantite,
      })),
    );
    if (articlesError) {
      await db.from("commandes").delete().eq("id", commande.id);
      throw new Error("La commande n'a pas pu être enregistrée.");
    }
    createdIds.push(commande.id as string);
  }

  if (createdIds.length === 0) throw new Error("Aucun restaurant disponible pour cette commande.");
  return { commandes: createdIds };
}

export async function fetchOrders(clientId: string): Promise<Commande[]> {
  const db = getDb();
  const { data } = await db
    .from("commandes")
    .select(
      "id, restaurant_id, statut, total_articles, cout_livraison, total_commande, delai_livraison_min_min, delai_livraison_max_min, methode_localisation, localisation_url, localisation_audio_url, created_at, annulee_par, restaurants(nom, logo_url, quartier), commande_articles(id, type_article, plat_id, boisson_id, nom_article, prix_unitaire, quantite, note_donnee)",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as (Commande & {
    restaurants: Commande["restaurant"];
    commande_articles: CommandeArticle[];
  })[];

  const platIds = new Set<string>();
  const boissonIds = new Set<string>();
  for (const row of rows) {
    for (const article of row.commande_articles ?? []) {
      if (article.plat_id) platIds.add(article.plat_id);
      if (article.boisson_id) boissonIds.add(article.boisson_id);
    }
  }

  const [{ data: plats }, { data: boissons }] = await Promise.all([
    platIds.size
      ? db.from("plats").select("id, photo_url").in("id", [...platIds])
      : Promise.resolve({ data: [] as never[] }),
    boissonIds.size
      ? db.from("boissons").select("id, photo_url").in("id", [...boissonIds])
      : Promise.resolve({ data: [] as never[] }),
  ]);
  const photos = new Map<string, string | null>();
  for (const row of [
    ...((plats ?? []) as { id: string; photo_url: string | null }[]),
    ...((boissons ?? []) as { id: string; photo_url: string | null }[]),
  ]) {
    photos.set(row.id, row.photo_url);
  }

  return rows.map((row) => ({
    ...row,
    restaurant: row.restaurants ?? null,
    articles: (row.commande_articles ?? []).map((article) => ({
      ...article,
      photo_url: photos.get(article.plat_id ?? article.boisson_id ?? "") ?? null,
    })),
  }));
}

/** Note un article commandé et met à jour la moyenne du plat/boisson concerné. */
export async function rateArticle(clientId: string, articleId: string, note: number) {
  const db = getDb();
  const { data: article } = await db
    .from("commande_articles")
    .select("id, commande_id, type_article, plat_id, boisson_id, note_donnee, commandes(client_id, statut)")
    .eq("id", articleId)
    .maybeSingle();

  const commande = (article as unknown as { commandes: { client_id: string; statut: string } | null })
    ?.commandes;
  if (!article || !commande || commande.client_id !== clientId) {
    throw new Error("Article introuvable.");
  }
  if (commande.statut !== "payee" && commande.statut !== "annulee") {
    throw new Error("Vous pourrez noter une fois la commande bouclée.");
  }
  if (article.note_donnee) throw new Error("Cet article a déjà été noté.");

  await db.from("commande_articles").update({ note_donnee: note }).eq("id", articleId);

  const table = article.type_article === "plat" ? "plats" : "boissons";
  const targetId = (article.plat_id ?? article.boisson_id) as string | null;
  if (!targetId) return { ok: true };

  const { data: target } = await db
    .from(table)
    .select("note_moyenne, nombre_notes")
    .eq("id", targetId)
    .maybeSingle();
  if (target) {
    const count = Number(target.nombre_notes ?? 0);
    const moyenne = Number(target.note_moyenne ?? 0);
    const nextCount = count + 1;
    const nextMoyenne = (moyenne * count + note) / nextCount;
    await db
      .from(table)
      .update({ note_moyenne: Math.round(nextMoyenne * 100) / 100, nombre_notes: nextCount })
      .eq("id", targetId);
  }
  return { ok: true };
}

/** Auto-annulation des commandes en_cours/vu sans évolution depuis 24h. */
export async function autoCancelStaleOrders() {
  const db = getDb();
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await db
    .from("commandes")
    .select("id, statut, created_at, vu_at")
    .in("statut", ["en_cours", "vu"]);

  const stale = ((data ?? []) as { id: string; created_at: string; vu_at: string | null }[]).filter(
    (row) => (row.vu_at ?? row.created_at) < cutoff,
  );
  if (stale.length === 0) return { annulees: 0 };

  await db
    .from("commandes")
    .update({
      statut: "annulee",
      annulee_par: "systeme",
      annulee_at: new Date().toISOString(),
    })
    .in(
      "id",
      stale.map((row) => row.id),
    );
  return { annulees: stale.length };
}
