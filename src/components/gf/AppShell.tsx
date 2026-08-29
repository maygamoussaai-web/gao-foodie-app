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

export function AskiaBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <img
        src={askia}
        alt=""
        width={1024}
        height={1024}
        loading="lazy"
        className="absolute -right-16 bottom-8 w-[78vw] max-w-[520px] opacity-[var(--askia-opacity)] dark:invert"
      />
      <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-secondary/50 blur-3xl dark:bg-primary/10" />
    </div>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  right,
  back,
}: {
  children: React.ReactNode;
  title?: string | undefined;
  subtitle?: string | undefined;
  right?: React.ReactNode | undefined;
  back?: React.ReactNode | undefined;
}) {
  return (
    <div className="min-h-screen">
      <AskiaBackdrop />
      {title ? (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
            {back}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[19px] leading-tight font-extrabold">{title}</h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {right}
          </div>
        </header>
      ) : null}
      <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { count } = useCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
        {TABS.map((tab) => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "tap tap-active relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.4]")} />
                {tab.to === "/panier" && count > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </span>
              {tab.label}
              <span
                className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-full bg-primary tap",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
