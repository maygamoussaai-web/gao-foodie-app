import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AskiaBackdrop } from "@/components/gf/AppShell";
import { PinField } from "@/components/gf/PinField";
import { Button, Field, Input } from "@/components/gf/ui";
import { registerFn } from "@/lib/auth.functions";
import { useInvalidateSession } from "@/lib/session";
import { setSessionToken } from "@/lib/session-token";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Créer un compte — GAO FOOD" },
      {
        name: "description",
        content:
          "Créez votre compte GAO FOOD en une minute : prénom, nom, numéro de téléphone et code PIN.",
      },
      { property: "og:title", content: "Créer un compte — GAO FOOD" },
      {
        property: "og:description",
        content: "Rejoignez GAO FOOD et commandez vos repas à Gao.",
      },
    ],
  }),
  component: Inscription,
});

function Inscription() {
  const navigate = useNavigate();
  const router = useRouter();
  const invalidateSession = useInvalidateSession();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [numero, setNumero] = useState("");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const mutation = useMutation({
    mutationFn: () => registerFn({ data: { prenom, nom, numero, pin } }),
    onSuccess: async (client) => {
      setSessionToken(client.token);
      await invalidateSession();
      await router.invalidate();
      toast.success(`Bienvenue ${client.prenom} !`);
      navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message || "Inscription impossible."),
  });

  const canSubmit =
    prenom.trim().length >= 2 &&
    nom.trim().length >= 2 &&
    numero.trim().length >= 8 &&
    pin.length >= 4 &&
    pin === confirmation;

  return (
    <div className="relative min-h-screen px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-12">
      <AskiaBackdrop />
      <Link
        to="/bienvenue"
        className="tap inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
        aria-label="Retour"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="mx-auto mt-6 max-w-md">
        <h1 className="text-[30px] leading-tight font-black">Créer mon compte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vos informations servent uniquement à livrer vos commandes.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) {
              toast.error(
                pin !== confirmation
                  ? "Les deux codes PIN ne correspondent pas."
                  : "Complétez tous les champs.",
              );
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
              <Input
                value={prenom}
                onChange={(event) => setPrenom(event.target.value)}
                placeholder="Aïcha"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Nom">
              <Input
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                placeholder="Maïga"
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field label="Numéro de téléphone">
            <Input
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              inputMode="tel"
              placeholder="76 12 34 56"
              autoComplete="tel"
            />
          </Field>

          <Field label="Code PIN" hint="4 à 6 chiffres, à ne jamais partager.">
            <PinField value={pin} onChange={setPin} />
          </Field>

          <Field label="Confirmer le code PIN">
            <PinField value={confirmation} onChange={setConfirmation} />
          </Field>

          <Button block size="lg" type="submit" loading={mutation.isPending}>
            <UserPlus className="h-4.5 w-4.5" />
            Créer mon compte
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/connexion" className="font-semibold text-primary underline underline-offset-4">
            Se connecter
          </Link>
        </p>

        <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
          <Link to="/conditions" className="underline underline-offset-4">
            En vous inscrivant vous acceptez nos conditions, nos politiques de sécurité et de
            confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}
