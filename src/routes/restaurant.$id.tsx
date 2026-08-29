import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bike, Clock, CupSoda, MapPin, Minus, Plus, Store, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/gf/AppShell";
import { Badge, Button, EmptyState, Skeleton, Stars } from "@/components/gf/ui";
import { getRestaurantFn } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Article, Restaurant } from "@/lib/types";

type Search = { article?: string | undefined };

export const Route = createFileRoute("/restaurant/$id")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    article: typeof search["article"] === "string" ? search["article"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Menu du restaurant — GAO FOOD" },
      {
        name: "description",
        content: "Découvrez les plats et boissons de ce restaurant de Gao et commandez en ligne.",
      },
      { property: "og:title", content: "Menu du restaurant — GAO FOOD" },
      {
        property: "og:description",
        content: "Plats, boissons, prix et délais de livraison sur GAO FOOD.",
      },
    ],
  }),
  component: PageRestaurant,
});

function PageRestaurant() {
  const { id } = Route.useParams();
  const { article } = Route.useSearch();
  const navigate = useNavigate();
  const session = useSession();
  const [onglet, setOnglet] = useState<"plats" | "boissons">("plats");
  const [selection, setSelection] = useState<Article | null>(null);

  useEffect(() => {
    if (!session.isLoading && !session.data) navigate({ to: "/bienvenue" });
  }, [session.isLoading, session.data, navigate]);

  const query = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => getRestaurantFn({ data: { id } }),
    enabled: Boolean(session.data),
  });

  useEffect(() => {
    if (!article || !query.data) return;
    const cible =
      query.data.plats.find((item) => item.id === article) ??
      query.data.boissons.find((item) => item.id === article);
    if (cible) {
      setOnglet(query.data.plats.some((item) => item.id === article) ? "plats" : "boissons");
      setSelection(cible);
    }
  }, [article, query.data]);

  const retour = (
    <Link
      to="/"
      className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card"
      aria-label="Retour à l'accueil"
    >
      <ArrowLeft className="h-5 w-5" />
    </Link>
  );

  if (query.isLoading) {
    return (
      <AppShell title="Chargement" back={retour}>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!query.data) {
    return (
      <AppShell title="Restaurant" back={retour}>
        <EmptyState
          icon={Store}
          title="Restaurant indisponible"
          description="Ce restaurant n'est plus actif sur GAO FOOD."
          action={
            <Link to="/">
              <Button>Voir les autres restaurants</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const { restaurant, plats, boissons } = query.data;
  const items = onglet === "plats" ? plats : boissons;

  return (
    <AppShell title={restaurant.nom} subtitle={restaurant.quartier ?? undefined} back={retour}>
      <EnTeteRestaurant restaurant={restaurant} />

      <div className="mt-5 flex rounded-xl bg-muted p-1">
        {(["plats", "boissons"] as const).map((valeur) => (
          <button
            key={valeur}
            type="button"
            onClick={() => setOnglet(valeur)}
            className={`tap flex-1 rounded-lg py-2.5 text-sm font-bold capitalize ${
              onglet === valeur
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground"
            }`}
          >
            {valeur === "plats" ? "Plats" : "Boissons"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState
            icon={onglet === "plats" ? UtensilsCrossed : CupSoda}
            title={onglet === "plats" ? "Aucun plat disponible" : "Aucune boisson disponible"}
            description="Ce restaurant n'a rien mis en ligne dans cette catégorie pour le moment."
          />
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelection(item)}
              className="surface-card tap tap-active animate-rise flex w-full items-center gap-3.5 p-3 text-left hover:shadow-lift"
            >
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.nom}
                  loading="lazy"
                  className="h-[68px] w-[68px] shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-xl bg-secondary">
                  {onglet === "plats" ? (
                    <UtensilsCrossed className="h-6 w-6 text-secondary-foreground" />
                  ) : (
                    <CupSoda className="h-6 w-6 text-secondary-foreground" />
                  )}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">{item.nom}</span>
                {item.ingredients ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {item.ingredients}
                  </span>
                ) : null}
                <span className="mt-1.5 flex items-center gap-3">
                  <span className="text-sm font-extrabold text-primary">{fcfa(item.prix)}</span>
                  <Stars note={item.note_moyenne} count={item.nombre_notes} />
                </span>
              </span>
              <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      {selection ? (
        <SelecteurQuantite
          type={plats.some((item) => item.id === selection.id) ? "plat" : "boisson"}
          article={selection}
          restaurant={restaurant}
          onClose={() => setSelection(null)}
        />
      ) : null}
    </AppShell>
  );
}

function EnTeteRestaurant({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="surface-card animate-rise flex items-center gap-4 p-4">
      {restaurant.logo_url ? (
        <img
          src={restaurant.logo_url}
          alt={restaurant.nom}
          className="h-18 w-18 rounded-2xl object-cover"
          width={72}
          height={72}
        />
      ) : (
        <span className="flex h-18 w-18 items-center justify-center rounded-2xl bg-secondary">
          <Store className="h-7 w-7 text-secondary-foreground" />
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="truncate text-lg font-black">{restaurant.nom}</h2>
        <Stars note={restaurant.note_moyenne} count={restaurant.nombre_notes} size={14} />
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Badge tone="primary">
            <Bike className="h-3 w-3" />
            {fcfa(restaurant.prix_livraison)}
          </Badge>
          <Badge>
            <Clock className="h-3 w-3" />
            {restaurant.delai_livraison_min_min}–{restaurant.delai_livraison_max_min} min
          </Badge>
          {restaurant.quartier ? (
            <Badge>
              <MapPin className="h-3 w-3" />
              {restaurant.quartier}
            </Badge>
          ) : null}
        </div>
        {restaurant.horaire_ouverture && restaurant.horaire_fermeture ? (
          <p className="text-xs text-muted-foreground">
            Ouvert de {String(restaurant.horaire_ouverture).slice(0, 5)} à{" "}
            {String(restaurant.horaire_fermeture).slice(0, 5)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SelecteurQuantite({
  type,
  article,
  restaurant,
  onClose,
}: {
  type: "plat" | "boisson";
  article: Article;
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const { add } = useCart();
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-[2px]">
      <button type="button" aria-label="Fermer" className="absolute inset-0" onClick={onClose} />
      <div className="animate-rise relative w-full max-w-md rounded-t-3xl border border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="tap absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-3.5">
          {article.photo_url ? (
            <img
              src={article.photo_url}
              alt={article.nom}
              className="h-20 w-20 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <UtensilsCrossed className="h-7 w-7 text-secondary-foreground" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-black">{article.nom}</h3>
            <p className="text-sm font-bold text-primary">{fcfa(article.prix)}</p>
            <Stars note={article.note_moyenne} count={article.nombre_notes} />
          </div>
        </div>

        {article.ingredients ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{article.ingredients}</p>
        ) : null}

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted p-2">
          <button
            type="button"
            onClick={() => setQuantite((current) => Math.max(1, current - 1))}
            disabled={quantite <= 1}
            aria-label="Retirer une unité"
            className="tap tap-active flex h-11 w-11 items-center justify-center rounded-xl bg-card text-foreground shadow-soft disabled:opacity-40"
          >
            <Minus className="h-4.5 w-4.5" />
          </button>
          <span className="text-xl font-black tabular-nums">{quantite}</span>
          <button
            type="button"
            onClick={() => setQuantite((current) => Math.min(10, current + 1))}
            disabled={quantite >= 10}
            aria-label="Ajouter une unité"
            className="tap tap-active flex h-11 w-11 items-center justify-center rounded-xl bg-card text-foreground shadow-soft disabled:opacity-40"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Maximum 10 unités par article</p>

        <Button
          block
          size="lg"
          className="mt-4"
          onClick={() => {
            add({
              type_article: type,
              article_id: article.id,
              nom: article.nom,
              prix: article.prix,
              photo_url: article.photo_url,
              quantite,
              restaurant_id: restaurant.id,
              restaurant_nom: restaurant.nom,
              prix_livraison: restaurant.prix_livraison,
            });
            toast.success(`${article.nom} ajouté au panier`);
            onClose();
          }}
        >
          Ajouter au panier · {fcfa(article.prix * quantite)}
        </Button>
      </div>
    </div>
  );
}
