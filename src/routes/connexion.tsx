import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, LogIn, MessageSquare, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AskiaBackdrop } from "@/components/gf/AppShell";
import { PinField } from "@/components/gf/PinField";
import { Button, Field, Input } from "@/components/gf/ui";
import { loginFn, requestPinResetFn, resetPinFn } from "@/lib/auth.functions";
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

type Mode = "connexion" | "reset_demande" | "reset_code";

function Connexion() {
  const navigate = useNavigate();
  const router = useRouter();
  const invalidateSession = useInvalidateSession();
  const [mode, setMode] = useState<Mode>("connexion");

  const [numero, setNumero] = useState("");
  const [pin, setPin] = useState("");

  const [codeDebug, setCodeDebug] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [nouveauPin, setNouveauPin] = useState("");
  const [confirmationPin, setConfirmationPin] = useState("");

  const entrer = async (client: { prenom: string; token: string }, message: string) => {
    setSessionToken(client.token);
    await invalidateSession();
    await router.invalidate();
    toast.success(message);
    navigate({ to: "/" });
  };

  const login = useMutation({
    mutationFn: () => loginFn({ data: { numero, pin } }),
    onSuccess: (client) => entrer(client, `Content de vous revoir, ${client.prenom} !`),
    onError: (error: Error) => toast.error(error.message || "Connexion impossible."),
  });

  const demanderCode = useMutation({
    mutationFn: () => requestPinResetFn({ data: { numero } }),
    onSuccess: (res) => {
      setCodeDebug(res.code_debug ?? null);
      setMode("reset_code");
      toast.success(res.sms_envoye ? "Code envoyé par SMS." : "Code généré.");
    },
    onError: (error: Error) => toast.error(error.message || "Demande impossible."),
  });

  const reset = useMutation({
    mutationFn: () => resetPinFn({ data: { numero, code, pin: nouveauPin } }),
    onSuccess: (client) => entrer(client, "Nouveau code PIN enregistré."),
    onError: (error: Error) => toast.error(error.message || "Réinitialisation impossible."),
  });

  return (
    <div className="relative min-h-screen px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-12">
      <AskiaBackdrop ambiance="auth" />
      <button
        type="button"
        onClick={() => {
          if (mode === "reset_code") {
            setMode("reset_demande");
            return;
          }
          if (mode === "reset_demande") {
            setMode("connexion");
            return;
          }
          navigate({ to: "/bienvenue" });
        }}
        className="tap inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
        aria-label="Retour"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mx-auto mt-6 max-w-md">
        <h1 className="animate-slide-up text-[30px] leading-tight font-black">
          {mode === "connexion"
            ? "Se connecter"
            : mode === "reset_demande"
              ? "Code PIN oublié"
              : "Entrez le code"}
        </h1>
        <p className="animate-slide-up mt-2 text-sm text-muted-foreground [animation-delay:60ms]">
          {mode === "connexion"
            ? "Votre numéro et votre code PIN suffisent."
            : mode === "reset_demande"
              ? "Nous vous envoyons un code de vérification par SMS."
              : `Un code à 6 chiffres a été envoyé au ${numero}.`}
        </p>

        {mode === "connexion" ? (
          <form
            className="animate-slide-up mt-8 space-y-4 [animation-delay:120ms]"
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
              onClick={() => setMode("reset_demande")}
              className="tap w-full pt-1 text-center text-sm font-semibold text-primary"
            >
              Code PIN oublié ?
            </button>
          </form>
        ) : mode === "reset_demande" ? (
          <form
            className="animate-slide-up mt-8 space-y-4 [animation-delay:120ms]"
            onSubmit={(event) => {
              event.preventDefault();
              if (numero.trim().length < 8) {
                toast.error("Renseignez votre numéro de téléphone.");
                return;
              }
              demanderCode.mutate();
            }}
          >
            <div className="surface-card flex gap-3 p-4 text-sm text-muted-foreground">
              <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>Indiquez le numéro de votre compte : un code à 6 chiffres vous sera envoyé par SMS.</p>
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
            <Button
              block
              size="lg"
              type="submit"
              loading={demanderCode.isPending}
              disabled={numero.trim().length < 8}
            >
              Recevoir le code
            </Button>
            <Button block variant="ghost" type="button" onClick={() => setMode("connexion")}>
              Revenir à la connexion
            </Button>
          </form>
        ) : (
          <form
            className="animate-slide-up mt-8 space-y-4 [animation-delay:120ms]"
            onSubmit={(event) => {
              event.preventDefault();
              if (nouveauPin !== confirmationPin) {
                toast.error("Les deux codes PIN ne sont pas identiques.");
                return;
              }
              reset.mutate();
            }}
          >
            {codeDebug ? (
              <div className="surface-card flex gap-3 border-warning/40 bg-warning/10 p-4 text-sm">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <p>
                  Service SMS pas encore branché — mode test. Votre code :{" "}
                  <strong className="tracking-widest">{codeDebug}</strong>
                </p>
              </div>
            ) : null}
            <Field label="Code reçu par SMS" hint="6 chiffres, valable 15 minutes.">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em]"
              />
            </Field>
            <Field label="Nouveau code PIN" hint="4 à 6 chiffres">
              <PinField value={nouveauPin} onChange={setNouveauPin} />
            </Field>
            <Field label="Confirmer le code PIN">
              <PinField value={confirmationPin} onChange={setConfirmationPin} />
            </Field>
            <Button
              block
              size="lg"
              type="submit"
              loading={reset.isPending}
              disabled={code.length !== 6 || nouveauPin.length < 4}
            >
              <KeyRound className="h-4.5 w-4.5" />
              Réinitialiser mon code PIN
            </Button>
            <button
              type="button"
              onClick={() => demanderCode.mutate()}
              disabled={demanderCode.isPending}
              className="tap w-full pt-1 text-center text-sm font-semibold text-primary disabled:opacity-50"
            >
              Renvoyer le code
            </button>
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
