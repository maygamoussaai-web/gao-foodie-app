import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ADMIN_PHONE_DISPLAY } from "@/lib/constants";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions & Confidentialité — GAO FOOD" },
      {
        name: "description",
        content:
          "Conditions d'utilisation et politique de confidentialité de GAO FOOD, la plateforme de commande de repas à Gao.",
      },
      { property: "og:title", content: "Conditions & Confidentialité — GAO FOOD" },
      {
        property: "og:description",
        content: "Vos droits, vos données et les règles d'utilisation de GAO FOOD.",
      },
    ],
  }),
  component: Conditions,
});

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="surface-card animate-rise p-4">
      <h3 className="text-[15px] font-bold">{titre}</h3>
      <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Conditions() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Retour"
            className="tap flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[19px] font-extrabold">Conditions & Confidentialité</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pt-5 pb-16">
        <p className="text-sm leading-relaxed text-muted-foreground">
          GAO FOOD met en relation les habitants de Gao avec les restaurants partenaires de la ville
          pour la commande et la livraison de repas. En utilisant l'application, vous acceptez les
          conditions ci-dessous.
        </p>

        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-wide text-primary uppercase">
            Conditions d'utilisation
          </h2>

          <Bloc titre="1. Objet du service">
            <p>
              GAO FOOD est une plateforme de mise en relation entre les habitants de Gao et les
              restaurants partenaires, permettant de commander des plats et des boissons et de se
              faire livrer.
            </p>
          </Bloc>

          <Bloc titre="2. Compte utilisateur">
            <p>
              L'inscription nécessite un prénom, un nom, un numéro de téléphone et un code PIN.
              Chaque utilisateur est seul responsable de la confidentialité de son code PIN et des
              commandes passées depuis son compte.
            </p>
          </Bloc>

          <Bloc titre="3. Commandes et paiement">
            <p>
              Le paiement se fait exclusivement à la livraison, en espèces auprès du livreur ou du
              restaurant. GAO FOOD n'encaisse aucun paiement en ligne côté acheteur : il n'existe
              donc aucun risque de paiement anticipé.
            </p>
          </Bloc>

          <Bloc titre="4. Annulation">
            <p>
              Vous pouvez annuler une commande tant qu'elle n'a pas été marquée comme payée. Toute
              commande restée sans mise à jour de statut pendant 24 heures est automatiquement
              annulée par le système.
            </p>
          </Bloc>

          <Bloc titre="5. Localisation de livraison">
            <p>
              La livraison nécessite le partage d'une localisation : position exacte (recommandée)
              ou message vocal explicatif. Ces informations servent uniquement à l'exécution de la
              commande en cours.
            </p>
          </Bloc>

          <Bloc titre="6. Notation">
            <p>
              Une fois la commande bouclée, vous pouvez noter les articles commandés de 1 à 5
              étoiles. Ces notes sont publiques et agrégées par plat ou par boisson.
            </p>
          </Bloc>

          <Bloc titre="7. Responsabilité">
            <p>
              GAO FOOD est une plateforme de mise en relation. La qualité, la préparation et
              l'hygiène des plats relèvent de la responsabilité du restaurant partenaire.
            </p>
          </Bloc>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-wide text-primary uppercase">
            Politique de confidentialité
          </h2>

          <Bloc titre="8. Données collectées">
            <p>
              Nous collectons uniquement : prénom, nom, numéro de téléphone, code PIN (chiffré,
              jamais stocké en clair), historique de commandes et localisation associée à chaque
              commande.
            </p>
          </Bloc>

          <Bloc titre="9. Utilisation des données">
            <p>
              Ces données servent exclusivement au fonctionnement du service : traitement et
              livraison des commandes, support client. Elles ne sont jamais vendues ni cédées à des
              tiers à des fins commerciales.
            </p>
          </Bloc>

          <Bloc titre="10. Contact, réclamations et suppression de compte">
            <p>
              Tout signalement, réclamation ou demande de suppression de compte et de données se
              fait via WhatsApp au {ADMIN_PHONE_DISPLAY}.
            </p>
          </Bloc>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="tap tap-active inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
