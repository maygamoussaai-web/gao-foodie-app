import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bike,
  Clock,
  Flame,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/gf/AppShell";
import { StoriesBar } from "@/components/gf/Stories";
import { Badge, EmptyState, Input, Skeleton, Stars } from "@/components/gf/ui";
import { listPromotionsFn, listRestaurantsFn } from "@/lib/catalog.functions";
import { fcfa, initials } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Promotion, Restaurant } from "@/lib/types";
import { cn } from "@/lib/utils";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vitrine,
});

type Filtre = "tous" | "ouvert" | "rapide" | "notes";

const FILTRES: { id: Filtre; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "tous", label: "Tous", icon: UtensilsCrossed },
  { id: "ouvert", label: "Ouverts", icon: Clock },
  { id: "rapide", label: "Livraison rapide", icon: Flame },
  { id: "notes", label: "Mieux notés", icon: Star },
];

/** Ouvert si l'heure courante est dans l'intervalle (gère le passage à minuit). */
function estOuvert(restaurant: Restaurant): boolean | null {
  const { horaire_ouverture: o, horaire_fermeture: f } = restaurant;
  if (!o || !f) return null;
  const toMin = (value: string) => {
    const [h = "0", m = "0"] = value.split(":");
    return Number(h) * 60 + Number(m);
  };
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMin(o);
  const end = toMin(f);
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

function salutation(): string {
  const h = new Date().getHours();
  if (h < 11) return "Bonjour";
  if (h < 17) return "Bon après-midi";
  return "Bonsoir";
}

function Vitrine() {
  const navigate = useNavigate();
  const session = useSession();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");

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
    let list = [...(restaurants.data ?? [])];
    const term = recherche.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (restaurant) =>
          restaurant.nom.toLowerCase().includes(term) ||
          (restaurant.quartier ?? "").toLowerCase().includes(term),
      );
    }
    if (filtre === "ouvert") list = list.filter((restaurant) => estOuvert(restaurant) !== false);
    if (filtre === "rapide")
      list = list.sort((a, b) => a.delai_livraison_min_min - b.delai_livraison_min_min);
    if (filtre === "notes") list = list.sort((a, b) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0));
    return list;
  }, [restaurants.data, recherche, filtre]);

  const chargement = restaurants.isLoading || session.isLoading;

  return (
    <AppShell ambiance="accueil">
      <header className="pt-[calc(env(safe-area-inset-top)+0.25rem)]">
        <div className="animate-slide-up flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <MapPin className="h-3 w-3 animate-float" />
              Gao, Mali
            </p>
            <h1 className="mt-1 truncate text-[26px] leading-tight font-black">
              {salutation()}
              {session.data?.prenom ? (
                <span className="text-gradient-animated"> {session.data.prenom}</span>
              ) : null}
            </h1>
          </div>
          <Link
            to="/compte"
            aria-label="Mon compte"
            className="press gradient-primary animate-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-primary-foreground shadow-glow"
          >
            {initials(`${session.data?.prenom ?? ""} ${session.data?.nom ?? ""}`.trim()) || "GF"}
          </Link>
        </div>

        <div className="glass-card gradient-surface animate-slide-up press mt-4 flex items-start gap-3 overflow-hidden p-3.5 [animation-delay:80ms]">
          <span className="animate-float flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
            <Bike className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] leading-tight font-bold">Paiement à la livraison</p>
            <p className="text-[12px] leading-snug text-muted-foreground">
              Vous payez en espèces à la réception. Aucun risque d'arnaque.
            </p>
          </div>
        </div>
      </header>


      <section className="animate-slide-up mt-6 [animation-delay:150ms]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold tracking-wide uppercase">
            <Sparkles className="animate-spin-slow h-3.5 w-3.5 text-primary" />
            Promotions

          </h2>
          {promotions.data && promotions.data.length > 0 ? (
            <span className="text-[11px] font-semibold text-muted-foreground">
              {promotions.data.length} en cours
            </span>
          ) : null}
        </div>
        {promotions.isLoading || (promotions.data?.length ?? 0) > 0 ? (
          <StoriesBar promotions={promotions.data ?? []} loading={promotions.isLoading} />
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <p className="text-[12.5px] leading-snug text-muted-foreground">
              Aucune promotion en cours.
              <br />
              Les offres des restaurants s'afficheront ici.
            </p>
          </div>
        )}
      </section>

      <div className="sticky top-0 z-20 -mx-4 mt-6 bg-background/80 px-4 pt-3 pb-2 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un restaurant, un quartier…"
            className="pr-11 pl-11"
            aria-label="Rechercher un restaurant"
          />
          {recherche ? (
            <button
              type="button"
              onClick={() => setRecherche("")}
              aria-label="Effacer la recherche"
              className="tap tap-active absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="no-scrollbar stagger -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
          {FILTRES.map((item) => {
            const Icon = item.icon;
            const actif = filtre === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFiltre(item.id)}
                aria-pressed={actif}
                className={cn(
                  "press tap group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold",
                  actif
                    ? "gradient-primary sheen border-transparent text-primary-foreground shadow-glow"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12",
                    actif && "animate-pop",
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </div>

      </div>

      <section className="mt-4 space-y-3">
        {!chargement && filtres.length > 0 ? (
          <div className="flex items-baseline justify-between px-0.5">
            <h2 className="text-[13px] font-bold tracking-wide uppercase">Restaurants</h2>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {filtres.length} disponible{filtres.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}

        {chargement ? (
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
          filtres.map((restaurant, index) => (
            <CarteRestaurant key={restaurant.id} restaurant={restaurant} index={index} />
          ))
        )}
      </section>
    </AppShell>
  );
}

function CarteRestaurant({ restaurant, index }: { restaurant: Restaurant; index: number }) {
  const ouvert = estOuvert(restaurant);

  return (
    <Link
      to="/restaurant/$id"
      params={{ id: restaurant.id }}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="surface-card tap tap-active animate-rise group flex items-center gap-3.5 p-3 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="relative shrink-0">
        {restaurant.logo_url ? (
          <img
            src={restaurant.logo_url}
            alt={restaurant.nom}
            loading="lazy"
            className={cn(
              "h-[68px] w-[68px] rounded-2xl object-cover ring-1 ring-border tap",
              ouvert === false && "grayscale",
            )}
          />
        ) : (
          <span className="gradient-surface flex h-[68px] w-[68px] items-center justify-center rounded-2xl ring-1 ring-border">
            <Store className="h-6 w-6 text-primary" />
          </span>
        )}
        <span
          className={cn(
            "absolute -right-1 -bottom-1 rounded-full border-2 border-card px-1.5 py-0.5 text-[9.5px] font-bold",
            ouvert === false
              ? "bg-muted text-muted-foreground"
              : "bg-success text-success-foreground",
          )}
        >
          {ouvert === false ? "Fermé" : "Ouvert"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 truncate text-[15.5px] leading-tight font-extrabold">
            {restaurant.nom}
          </p>
          <Badge tone="primary" className="shrink-0">
            <Bike className="h-3 w-3" />
            {fcfa(restaurant.prix_livraison)}
          </Badge>
        </div>

        <div className="mt-1.5 flex items-center gap-2.5 text-[12px] text-muted-foreground">
          <Stars note={restaurant.note_moyenne} count={restaurant.nombre_notes} />
          <span className="h-3 w-px bg-border" />
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
            <Clock className="h-3.5 w-3.5" />
            {restaurant.delai_livraison_min_min}–{restaurant.delai_livraison_max_min} min
          </span>
        </div>

        {restaurant.quartier ? (
          <p className="mt-1 inline-flex min-w-0 max-w-full items-center gap-1 text-[12px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{restaurant.quartier}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function CarteSkeleton() {
  return (
    <div className="surface-card flex items-center gap-3.5 p-3">
      <Skeleton className="h-[68px] w-[68px] rounded-2xl" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
