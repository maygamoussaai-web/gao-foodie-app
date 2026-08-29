import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bike,
  CalendarDays,
  ChevronDown,
  Clock,
  Phone,
  ReceiptText,
  Search,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/gf/AppShell";
import { Badge, Button, EmptyState, Input, Skeleton, StarPicker } from "@/components/gf/ui";
import { dateTime, dayKey } from "@/lib/format";
import { fcfa } from "@/lib/format";
import { cancelOrderFn, listOrdersFn, rateArticleFn } from "@/lib/orders.functions";
import { useSession } from "@/lib/session";
import type { Commande } from "@/lib/types";

export const Route = createFileRoute("/commandes")({
  head: () => ({
    meta: [
      { title: "Mes commandes — GAO FOOD" },
      {
        name: "description",
        content:
          "Suivez vos commandes en cours, appelez le restaurant, annulez si besoin et notez vos plats livrés.",
      },
      { property: "og:title", content: "Mes commandes — GAO FOOD" },
      { property: "og:description", content: "Suivi en temps réel de vos commandes à Gao." },
    ],
  }),
  component: Commandes,
});

function Commandes() {
  const navigate = useNavigate();
  const session = useSession();
  const [recherche, setRecherche] = useState("");
  const [jour, setJour] = useState("");

  useEffect(() => {
    if (!session.isLoading && !session.data) navigate({ to: "/bienvenue" });
  }, [session.isLoading, session.data, navigate]);

  const commandes = useQuery<Commande[]>({
    queryKey: ["commandes"],
    queryFn: () => listOrdersFn(),
    enabled: Boolean(session.data),
    refetchInterval: 30_000,
  });

  const filtrees = useMemo(() => {
    const term = recherche.trim().toLowerCase();
    return (commandes.data ?? []).filter((commande) => {
      if (jour && dayKey(commande.created_at) !== jour) return false;
      if (!term) return true;
      const cible = [
        commande.restaurant?.nom ?? "",
        ...commande.articles.map((article) => article.nom_article),
      ]
        .join(" ")
        .toLowerCase();
      return cible.includes(term);
    });
  }, [commandes.data, recherche, jour]);

  const enCours = filtrees.filter(
    (commande) => commande.statut === "en_cours" || commande.statut === "vu",
  );
  const bouclees = filtrees.filter(
    (commande) => commande.statut === "payee" || commande.statut === "annulee",
  );

  return (
    <AppShell title="Mes commandes">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Restaurant ou article"
            className="pl-11"
            aria-label="Rechercher une commande"
          />
        </div>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={jour}
            onChange={(event) => setJour(event.target.value)}
            className="w-[9.5rem] pl-10"
            aria-label="Filtrer par date"
          />
        </div>
      </div>

      {commandes.isLoading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (commandes.data ?? []).length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Aucune commande pour l'instant"
          description="Vos commandes et leur suivi apparaîtront ici."
          action={
            <Link to="/">
              <Button>Commander maintenant</Button>
            </Link>
          }
        />
      ) : filtrees.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Modifiez la date ou le terme recherché."
        />
      ) : (
        <div className="mt-5 space-y-6">
          <Groupe titre="En cours" commandes={enCours} vide="Aucune commande en cours." />
          <Groupe titre="Bouclées" commandes={bouclees} vide="Aucune commande bouclée." bouclee />
        </div>
      )}
    </AppShell>
  );
}

function Groupe({
  titre,
  commandes,
  vide,
  bouclee = false,
}: {
  titre: string;
  commandes: Commande[];
  vide: string;
  bouclee?: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <h2 className="text-xs font-bold tracking-wide text-primary uppercase">{titre}</h2>
        <span className="text-xs text-muted-foreground">({commandes.length})</span>
      </div>
      {commandes.length === 0 ? (
        <p className="surface-card p-4 text-sm text-muted-foreground">{vide}</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <CarteCommande key={commande.id} commande={commande} bouclee={bouclee} />
          ))}
        </div>
      )}
    </section>
  );
}

const STATUTS: Record<Commande["statut"], { label: string; tone: "primary" | "success" | "danger" | "neutral" }> = {
  en_cours: { label: "En attente", tone: "neutral" },
  vu: { label: "Vue par le restaurant", tone: "primary" },
  payee: { label: "Payée", tone: "success" },
  annulee: { label: "Annulée", tone: "danger" },
};

function CarteCommande({ commande, bouclee }: { commande: Commande; bouclee: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const queryClient = useQueryClient();
  const statut = STATUTS[commande.statut];

  const annuler = useMutation({
    mutationFn: () => cancelOrderFn({ data: { id: commande.id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["commandes"] });
      toast.success("Commande annulée");
    },
    onError: (error: Error) => toast.error(error.message || "Annulation impossible."),
  });

  const noter = useMutation({
    mutationFn: (variables: { commande_article_id: string; note: number }) =>
      rateArticleFn({ data: variables }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["commandes"] });
      toast.success("Merci pour votre note !");
    },
    onError: (error: Error) => toast.error(error.message || "Notation impossible."),
  });

  return (
    <article className="surface-card animate-rise overflow-hidden">
      <button
        type="button"
        onClick={() => setOuvert((current) => !current)}
        aria-expanded={ouvert}
        className="tap flex w-full items-center gap-3 p-3.5 text-left"
      >
        {commande.restaurant?.logo_url ? (
          <img
            src={commande.restaurant.logo_url}
            alt={commande.restaurant.nom}
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <Store className="h-5 w-5 text-secondary-foreground" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-bold">
              {commande.restaurant?.nom ?? "Restaurant"}
            </p>
            <Badge tone={statut.tone}>{statut.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{dateTime(commande.created_at)}</p>
          <p className="mt-1 text-sm font-extrabold text-primary tabular-nums">
            {fcfa(commande.total_commande)}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${ouvert ? "rotate-180" : ""}`}
        />
      </button>

      {ouvert ? (
        <div className="border-t border-border px-3.5 py-3.5">
          <ul className="space-y-2.5">
            {commande.articles.map((article) => (
              <li key={article.id} className="flex items-center gap-3">
                {article.photo_url ? (
                  <img
                    src={article.photo_url}
                    alt={article.nom_article}
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <UtensilsCrossed className="h-4.5 w-4.5 text-secondary-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {article.nom_article} × {article.quantite}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {fcfa(article.prix_unitaire * article.quantite)}
                  </p>
                  {bouclee ? (
                    <div className="mt-1.5">
                      {article.note_donnee ? (
                        <p className="text-xs text-muted-foreground">
                          Votre note : {article.note_donnee}/5
                        </p>
                      ) : (
                        <StarPicker
                          value={0}
                          disabled={noter.isPending}
                          onSelect={(note) =>
                            noter.mutate({ commande_article_id: article.id, note })
                          }
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Articles</span>
              <span className="tabular-nums">{fcfa(commande.total_articles)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Bike className="h-4 w-4" /> Livraison
              </span>
              <span className="tabular-nums">{fcfa(commande.cout_livraison)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="tabular-nums">{fcfa(commande.total_commande)}</span>
            </div>
            {!bouclee && commande.delai_livraison_min_min ? (
              <p className="inline-flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Livraison estimée {commande.delai_livraison_min_min}–
                {commande.delai_livraison_max_min} min
              </p>
            ) : null}
            {commande.statut === "annulee" && commande.annulee_par ? (
              <p className="pt-1 text-xs text-muted-foreground">
                Annulée par{" "}
                {commande.annulee_par === "systeme"
                  ? "le système (24h sans réponse)"
                  : commande.annulee_par === "client"
                    ? "vous"
                    : "le restaurant"}
              </p>
            ) : null}
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {commande.restaurant?.numero ? (
              <a href={`tel:${commande.restaurant.numero}`} className="flex-1">
                <Button variant="outline" block>
                  <Phone className="h-4 w-4" />
                  Appeler
                </Button>
              </a>
            ) : null}
            {!bouclee ? (
              <Button
                variant="danger"
                className="flex-1"
                loading={annuler.isPending}
                onClick={() => annuler.mutate()}
              >
                Annuler la commande
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
