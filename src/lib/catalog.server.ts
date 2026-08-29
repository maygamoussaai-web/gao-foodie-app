import { getDb } from "./supabase.server";
import type { Article, Promotion, Restaurant } from "./types";

type NoteRow = { restaurant_id: string; note_moyenne: number | null; nombre_notes: number | null };

/** Note d'un restaurant = moyenne pondérée des notes de tous ses plats et boissons. */
export function aggregateNotes(rows: NoteRow[]) {
  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const count = row.nombre_notes ?? 0;
    if (count <= 0) continue;
    const current = map.get(row.restaurant_id) ?? { total: 0, count: 0 };
    current.total += (row.note_moyenne ?? 0) * count;
    current.count += count;
    map.set(row.restaurant_id, current);
  }
  return map;
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const db = getDb();
  const { data: restaurants, error } = await db
    .from("restaurants")
    .select(
      "id, nom, logo_url, quartier, prix_livraison, horaire_ouverture, horaire_fermeture, delai_livraison_min_min, delai_livraison_max_min, statut",
    )
    .eq("statut", "actif")
    .order("nom");
  if (error) throw new Error("Impossible de charger les restaurants.");

  const [{ data: plats }, { data: boissons }] = await Promise.all([
    db.from("plats").select("restaurant_id, note_moyenne, nombre_notes").eq("actif", true),
    db.from("boissons").select("restaurant_id, note_moyenne, nombre_notes").eq("actif", true),
  ]);

  const notes = aggregateNotes([
    ...((plats ?? []) as NoteRow[]),
    ...((boissons ?? []) as NoteRow[]),
  ]);

  return ((restaurants ?? []) as Restaurant[]).map((restaurant) => {
    const agg = notes.get(restaurant.id);
    return {
      ...restaurant,
      note_moyenne: agg && agg.count > 0 ? agg.total / agg.count : 0,
      nombre_notes: agg?.count ?? 0,
    };
  });
}

export async function fetchRestaurantDetail(id: string) {
  const db = getDb();
  const { data: restaurant } = await db
    .from("restaurants")
    .select(
      "id, nom, logo_url, quartier, prix_livraison, horaire_ouverture, horaire_fermeture, delai_livraison_min_min, delai_livraison_max_min, statut",
    )
    .eq("id", id)
    .eq("statut", "actif")
    .maybeSingle();
  if (!restaurant) return null;

  const [{ data: plats }, { data: boissons }] = await Promise.all([
    db
      .from("plats")
      .select("id, restaurant_id, nom, prix, photo_url, ingredients, note_moyenne, nombre_notes, actif")
      .eq("restaurant_id", id)
      .eq("actif", true)
      .order("nombre_commandes", { ascending: false }),
    db
      .from("boissons")
      .select("id, restaurant_id, nom, prix, photo_url, note_moyenne, nombre_notes, actif")
      .eq("restaurant_id", id)
      .eq("actif", true)
      .order("nombre_commandes", { ascending: false }),
  ]);

  const notes = aggregateNotes([
    ...((plats ?? []) as NoteRow[]),
    ...((boissons ?? []) as NoteRow[]),
  ]);
  const agg = notes.get(id);

  return {
    restaurant: {
      ...(restaurant as Restaurant),
      note_moyenne: agg && agg.count > 0 ? agg.total / agg.count : 0,
      nombre_notes: agg?.count ?? 0,
    },
    plats: (plats ?? []) as Article[],
    boissons: (boissons ?? []) as Article[],
  };
}

export async function fetchPromotions(): Promise<Promotion[]> {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const { data } = await db
    .from("promotions")
    .select(
      "id, restaurant_id, media_url, type_media, description, plat_id, boisson_id, expires_at, restaurants(nom, logo_url, statut)",
    )
    .eq("actif", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });

  type Row = Promotion & {
    restaurants: { nom: string; logo_url: string | null; statut: string } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((row) => row.restaurants?.statut === "actif")
    .map((row) => ({
      id: row.id,
      restaurant_id: row.restaurant_id,
      media_url: row.media_url,
      type_media: row.type_media,
      description: row.description,
      plat_id: row.plat_id,
      boisson_id: row.boisson_id,
      restaurant_nom: row.restaurants?.nom ?? "Restaurant",
      restaurant_logo: row.restaurants?.logo_url ?? null,
    }));
}
