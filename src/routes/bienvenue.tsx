import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, ChevronRight, MapPinned, Store, Timer } from "lucide-react";
import { useState } from "react";
import { AskiaBackdrop } from "@/components/gf/AppShell";
import { Button } from "@/components/gf/ui";

export const Route = createFileRoute("/bienvenue")({
  head: () => ({
    meta: [
      { title: "Bienvenue sur GAO FOOD — commandez à Gao" },
      {
        name: "description",
        content:
          "Découvrez GAO FOOD : commandez vos repas auprès des restaurants de Gao, suivez votre commande et payez à la livraison.",
      },
      { property: "og:title", content: "Bienvenue sur GAO FOOD" },
      {
        property: "og:description",
        content: "Tous les restaurants de Gao, livrés chez vous. Paiement à la livraison.",
      },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  {
    icon: Store,
    titre: "Tout Gao dans votre poche",
    texte:
      "Les restaurants de la ville réunis au même endroit. Parcourez les menus, comparez, choisissez — sans bouger de chez vous.",
  },
  {
    icon: Timer,
    titre: "Commandez en trois gestes",
    texte:
      "Ajoutez au panier, indiquez où vous êtes, validez. Votre repas est en préparation en moins d'une minute.",
  },
  {
    icon: MapPinned,
    titre: "Suivez votre commande",
    texte:
      "Reçue, vue par le restaurant, en route : vous êtes prévenu à chaque étape, avec le délai de livraison annoncé.",
  },
  {
    icon: BadgeCheck,
    titre: "Payez à la livraison",
    texte:
      "Aucun paiement en ligne, aucun risque d'arnaque. Vous réglez en espèces quand le repas est entre vos mains.",
  },
];

function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[index]!;
  const Icon = slide.icon;
  const last = index === SLIDES.length - 1;

  return (
    <div className="relative flex min-h-screen flex-col px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <AskiaBackdrop />

      <div className="flex items-center justify-between">
        <span className="text-lg font-black tracking-tight">
          GAO<span className="text-primary"> FOOD</span>
        </span>
        {!last ? (
          <button
            type="button"
            onClick={() => setIndex(SLIDES.length - 1)}
            className="tap text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Passer
          </button>
        ) : null}
      </div>

      <div key={index} className="animate-rise flex flex-1 flex-col justify-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
          <Icon className="h-9 w-9 text-primary" />
        </span>
        <h1 className="mt-8 text-[34px] leading-[1.08] font-black">{slide.titre}</h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          {slide.texte}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {SLIDES.map((item, itemIndex) => (
          <span
            key={item.titre}
            className={`tap h-1.5 rounded-full ${
              itemIndex === index ? "w-7 bg-primary" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {last ? (
          <>
            <Button block size="lg" onClick={() => navigate({ to: "/inscription" })}>
              Créer mon compte
            </Button>
            <Button
              block
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: "/connexion" })}
            >
              J'ai déjà un compte
            </Button>
          </>
        ) : (
          <Button block size="lg" onClick={() => setIndex((current) => current + 1)}>
            Continuer
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <p className="pt-1 text-center text-xs text-muted-foreground">
          <Link to="/conditions" className="underline underline-offset-4">
            Conditions & confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}
