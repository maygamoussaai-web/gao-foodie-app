import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, LogIn, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AskiaBackdrop } from "@/components/gf/AppShell";
import { PinField } from "@/components/gf/PinField";
import { Button, Field, Input } from "@/components/gf/ui";
import { loginFn, requestPinResetFn, resetPinFn } from "@/lib/auth.functions";
import { whatsappLink } from "@/lib/constants";
import { useInvalidateSession } from "@/lib/session";
import { setSessionToken } from "@/lib/session-token";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — GAO FOOD" },
      {
        name: "description",
        content: "Connectez-vous à GAO FOOD avec votre numéro de téléphone et votre code PIN.",
      },
      { property: "og:title", content: "Connexion — GAO FOOD" },
      { property: "og:description", content: "Accédez à vos commandes GAO FOOD." },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const navigate = useNavigate();
  const router = useRouter();
  const invalidateSession = useInvalidateSession();
  const [numero, setNumero] = useState("");
  const [pin, setPin] = useState("");
  const [resetStep, setResetStep] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [nouveauPin, setNouveauPin] = useState("");

  const login = useMutation({
    mutationFn: () => loginFn({ data: { numero, pin } }),
    onSuccess: async (client) => {
      setSessionToken(client.token);
      await invalidateSession();
      await router.invalidate();
      toast.success(`Content de vous revoir, ${client.prenom} !`);
      navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message || "Connexion impossible."),
  });

  const askReset = useMutation({
    mutationFn: () => requestPinResetFn({ data: { numero } }),
    onSuccess: (client) => {
      setResetStep("code");
      window.open(
        whatsappLink(
          `Bonjour GAO FOOD, je suis ${client.prenom} ${client.nom} (${numero}). J'ai oublié mon code PIN, merci de vérifier mon identité et de me communiquer mon code de réinitialisation.`,
        ),
        "_blank",
        "noopener",
      );
      toast.success("Code généré. Envoyez le message WhatsApp pour le recevoir.");
    },
    onError: (error: Error) => toast.error(error.message || "Demande impossible."),
  });

  const applyReset = useMutation({
    mutationFn: () => resetPinFn({ data: { numero, code, pin: nouveauPin } }),
    onSuccess: async (client) => {
      setSessionToken(client.token);
      await invalidateSession();
      await router.invalidate();
      toast.success("Nouveau code PIN enregistré.");
      navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message || "Réinitialisation impossible."),
  });

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
        <h1 className="text-[30px] leading-tight font-black">Se connecter</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre numéro et votre code PIN suffisent.
        </p>

        {resetStep === "idle" ? (
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (numero.trim().length < 8 || pin.length < 4) {
                toast.error("Renseignez votre numéro et votre code PIN.");
                return;
              }
              login.mutate();
            }}
          >
            <Field label="Numéro de téléphone">
              <Input
                value={numero}
                onChange={(event) => setNumero(event.target.value)}
                inputMode="tel"
                placeholder="76 12 34 56"
                autoComplete="tel"
              />
            </Field>
            <Field label="Code PIN">
              <PinField value={pin} onChange={setPin} />
            </Field>

            <Button block size="lg" type="submit" loading={login.isPending}>
              <LogIn className="h-4.5 w-4.5" />
              Se connecter
            </Button>

            <button
              type="button"
              onClick={() => {
                if (numero.trim().length < 8) {
                  toast.error("Entrez d'abord votre numéro.");
                  return;
                }
                askReset.mutate();
              }}
              className="tap w-full pt-1 text-center text-sm font-semibold text-primary"
            >
              Code PIN oublié ?
            </button>
          </form>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              applyReset.mutate();
            }}
          >
            <div className="surface-card flex gap-3 p-4 text-sm text-muted-foreground">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <p>
                Un code à 6 chiffres valable 15 minutes a été généré. Notre équipe vous le
                communique sur WhatsApp après vérification de votre identité.
              </p>
            </div>
            <Field label="Code reçu">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                className="tracking-[0.3em]"
              />
            </Field>
            <Field label="Nouveau code PIN">
              <PinField value={nouveauPin} onChange={setNouveauPin} />
            </Field>
            <Button
              block
              size="lg"
              type="submit"
              loading={applyReset.isPending}
              disabled={code.length !== 6 || nouveauPin.length < 4}
            >
              Enregistrer mon nouveau code
            </Button>
            <Button block variant="ghost" type="button" onClick={() => setResetStep("idle")}>
              Revenir à la connexion
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            to="/inscription"
            className="font-semibold text-primary underline underline-offset-4"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
