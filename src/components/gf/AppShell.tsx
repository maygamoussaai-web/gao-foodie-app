import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ReceiptText, ShoppingBag, User } from "lucide-react";
import askia from "@/assets/askia.png";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/panier", label: "Panier", icon: ShoppingBag },
  { to: "/commandes", label: "Commandes", icon: ReceiptText },
  { to: "/compte", label: "Compte", icon: User },
] as const;

/**
 * Ambiances par page : chaque écran a sa propre composition de halos.
 *
 * PERFORMANCE : ces halos sont maintenant STATIQUES (pas d'animation en
 * boucle infinie). Sur les téléphones d'entrée/milieu de gamme courants à
 * Gao, un flou (`blur-3xl`) animé en continu force le processeur graphique
 * à recalculer une grande zone floutée à chaque image, indéfiniment — même
 * quand rien ne bouge à l'écran. Multiplié par 2-3 halos + une grille de
 * fond animée + deux barres à flou (`backdrop-blur`), ça sature l'appareil
 * et donne l'impression que toute l'app est lente. Le rendu reste beau
 * (dégradés doux, positions variées par page) sans consommer en continu.
 */
export type Ambiance = "accueil" | "menu" | "panier" | "commandes" | "compte" | "auth";

const AMBIANCES: Record<Ambiance, { blobs: string[]; grid: boolean }> = {
  accueil: {
    grid: true,
    blobs: [
      "-top-32 -left-24 h-80 w-80 bg-primary/22",
      "top-52 -right-24 h-72 w-72 bg-primary-glow/18",
      "bottom-10 left-1/3 h-64 w-64 bg-sand/14",
    ],
  },
  menu: {
    grid: false,
    blobs: ["-top-24 right-0 h-72 w-72 bg-primary/20", "top-1/2 -left-28 h-80 w-80 bg-primary-glow/14"],
  },
  panier: {
    grid: false,
    blobs: [
      "-top-20 left-1/2 h-72 w-72 -translate-x-1/2 bg-primary/18",
      "bottom-24 -right-24 h-72 w-72 bg-success/12",
    ],
  },
  commandes: {
    grid: true,
    blobs: ["-top-28 -right-20 h-72 w-72 bg-primary/18", "bottom-0 -left-24 h-72 w-72 bg-primary-glow/16"],
  },
  compte: {
    grid: false,
    blobs: ["-top-24 -left-20 h-72 w-72 bg-primary/16", "bottom-16 right-0 h-64 w-64 bg-sand/16"],
  },
  auth: {
    grid: true,
    blobs: ["-top-32 -left-16 h-80 w-80 bg-primary/22", "bottom-0 -right-20 h-80 w-80 bg-primary-glow/18"],
  },
};

export function AskiaBackdrop({ ambiance = "accueil" }: { ambiance?: Ambiance }) {
  const config = AMBIANCES[ambiance];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="gradient-hero absolute inset-x-0 top-0 h-[460px]" />

      {/* Grille statique (plus de pan animé en continu). */}
      {config.grid ? (
        <div className="bg-grid absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(90%_60%_at_50%_0%,black,transparent)]" />
      ) : null}

      <img
        src={askia}
        alt=""
        width={1024}
        height={1024}
        loading="lazy"
        className="absolute -right-16 bottom-8 w-[78vw] max-w-[520px] opacity-[var(--askia-opacity)] dark:invert"
      />

      {/* Halos statiques : le flou n'est plus animé (voir note plus haut). */}
      {config.blobs.map((blob) => (
        <div key={blob} className={cn("absolute rounded-full blur-3xl", blob)} />
      ))}
    </div>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  right,
  back,
  ambiance = "accueil",
}: {
  children: React.ReactNode;
  title?: string | undefined;
  subtitle?: string | undefined;
  right?: React.ReactNode | undefined;
  back?: React.ReactNode | undefined;
  ambiance?: Ambiance | undefined;
}) {
  return (
    <div className="min-h-screen">
      <AskiaBackdrop ambiance={ambiance} />
      {title ? (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95">
          <span aria-hidden className="gradient-primary absolute inset-x-0 bottom-0 h-px opacity-60" />
          <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
            {back}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[19px] leading-tight font-extrabold tracking-tight">{title}</h1>
              {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
            {right}
          </div>
        </header>
      ) : null}
      {/* Plus de remontage complet à chaque navigation (l'ancien `key={pathname}`
          détruisait et recréait toute la page à chaque changement d'onglet). */}
      <main className="animate-fade mx-auto w-full max-w-3xl px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { count } = useCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)]">
      <span aria-hidden className="gradient-primary absolute inset-x-0 top-0 h-px opacity-50" />
      <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "tap tap-active group relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                {active ? (
                  <span aria-hidden className="absolute -inset-2.5 rounded-2xl bg-primary/12" />
                ) : null}
                <Icon
                  className={cn(
                    "relative h-[22px] w-[22px] transition-transform duration-300 group-hover:-translate-y-0.5",
                    active && "stroke-[2.4]",
                  )}
                />
                {tab.to === "/panier" && count > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-lg">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              <span className="relative">{tab.label}</span>
              <span
                className={cn(
                  "gradient-primary tap absolute top-0 h-1 rounded-full",
                  active ? "w-9 opacity-100" : "w-0 opacity-0",
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
