import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bike, Clock, MapPin, Search, Store, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/gf/AppShell";
import { StoriesBar } from "@/components/gf/Stories";
import { Badge, EmptyState, Input, Skeleton, Stars } from "@/components/gf/ui";
import { listPromotionsFn, listRestaurantsFn } from "@/lib/catalog.functions";
import { fcfa } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Promotion, Restaurant } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GAO FOOD — Commandez vos repas à Gao" },
      {
        name: "description",
        content:
          "Commandez auprès des restaurants de Gao, suivez votre livraison en temps réel et payez à la livraison. Simple, rapide, sans risque.",
      },
      { property: "og:title", content: "GAO FOOD — Commandez vos repas à Gao" },
      {
        property: "og:description",
        content: "Tous les restaurants de Gao réunis. Paiement à la livraison.",
      },
    ],
  }),
  component: Vitrine,
});

function Vitrine() {
  const navigate = useNavigate();
  const session = useSession();
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (!session.isLoading && !session.data) navigate({ to: "/bienvenue" });
  }, [session.isLoading, session.data, navigate]);

  const restaurants = useQuery<Restaurant[]>({
    queryKey: ["restaurants"],
    queryFn: () => listRestaurantsFn(),
    enabled: Boolean(session.data),
  });

  const promotions = useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: () => listPromotionsFn(),
    enabled: Boolean(session.data),
  });

  const filtres = useMemo(() => {
    const list = restaurants.data ?? [];
    const term = recherche.trim().toLowerCase();
    if (!term) return list;
    return list.filter((restaurant) => restaurant.nom.toLowerCase().includes(term));
  }, [restaurants.data, recherche]);

  return (
    <AppShell>
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Bonjour {session.data?.prenom ?? ""}
            </p>
            <h1 className="text-[26px] leading-tight font-black">
              GAO<span className="text-primary"> FOOD</span>
            </h1>
          </div>
          <Badge tone="success">Paiement à la livraison</Badge>
        </div>
      </header>

      <section className="mt-5">
        <StoriesBar promotions={promotions.data ?? []} loading={promotions.isLoading} />
      </section>

      <div className="sticky top-0 z-20 -mx-4 mt-5 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un restaurant"
            className="pl-11"
            aria-label="Rechercher un restaurant"
          />
        </div>
      </div>

      <section className="mt-2 space-y-3">
        {restaurants.isLoading ? (
          [0, 1, 2, 3, 4].map((index) => <CarteSkeleton key={index} />)
        ) : restaurants.isError ? (
          <EmptyState
            icon={Store}
            title="Impossible de charger les restaurants"
            description="Vérifiez votre connexion puis réessayez dans un instant."
          />
        ) : filtres.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={recherche ? "Aucun restaurant trouvé" : "Aucun restaurant disponible"}
            description={
              recherche
                ? "Essayez avec un autre nom ou effacez votre recherche."
                : "Les restaurants de Gao arrivent très bientôt sur GAO FOOD."
            }
          />
        ) : (
          filtres.map((restaurant) => (
            <CarteRestaurant key={restaurant.id} restaurant={restaurant} />
          ))
        )}
      </section>
    </AppShell>
  );
}

function CarteRestaurant({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      to="/restaurant/$id"
      params={{ id: restaurant.id }}
      className="surface-card tap tap-active animate-rise flex items-center gap-3.5 p-3 hover:shadow-lift"
    >
      {restaurant.logo_url ? (
        <img
          src={restaurant.logo_url}
          alt={restaurant.nom}
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Store className="h-6 w-6 text-secondary-foreground" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge tone="primary" className="shrink-0">
            <Bike className="h-3 w-3" />
            {fcfa(restaurant.prix_livraison)}
          </Badge>
          <p className="truncate text-[15px] font-bold">{restaurant.nom}</p>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {restaurant.delai_livraison_min_min}–{restaurant.delai_livraison_max_min} min
          </span>
          <Stars note={restaurant.note_moyenne} count={restaurant.nombre_notes} />
          {restaurant.quartier ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{restaurant.quartier}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function CarteSkeleton() {
  return (
    <div className="surface-card flex items-center gap-3.5 p-3">
      <Skeleton className="h-16 w-16 rounded-xl" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
  );
}
