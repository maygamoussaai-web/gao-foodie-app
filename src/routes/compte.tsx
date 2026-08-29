import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LifeBuoy, LogOut, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/gf/AppShell";
import { PinField } from "@/components/gf/PinField";
import { Button, Field, Input, Skeleton } from "@/components/gf/ui";
import { changePinFn, logoutFn, updateProfileFn } from "@/lib/auth.functions";
import { ADMIN_PHONE_DISPLAY, whatsappLink } from "@/lib/constants";
import { initials } from "@/lib/format";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — GAO FOOD" },
      {
        name: "description",
        content: "Gérez vos informations, changez votre code PIN et contactez le support GAO FOOD.",
      },
      { property: "og:title", content: "Mon compte — GAO FOOD" },
      { property: "og:description", content: "Vos informations et votre sécurité sur GAO FOOD." },
    ],
  }),
  component: Compte,
});

function Compte() {
  const navigate = useNavigate();
  const session = useSession();
  const queryClient = useQueryClient();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [numero, setNumero] = useState("");
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!session.isLoading && !session.data) navigate({ to: "/bienvenue" });
  }, [session.isLoading, session.data, navigate]);

  useEffect(() => {
    if (!session.data) return;
    setPrenom(session.data.prenom);
    setNom(session.data.nom);
    setNumero(session.data.numero);
  }, [session.data]);

  const profil = useMutation({
    mutationFn: () => updateProfileFn({ data: { prenom, nom, numero } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Informations mises à jour");
    },
    onError: (error: Error) => toast.error(error.message || "Mise à jour impossible."),
  });

  const pin = useMutation({
    mutationFn: async () => {
      if (nouveau !== confirmation) throw new Error("La confirmation ne correspond pas.");
      return await changePinFn({ data: { ancien, nouveau } });
    },
    onSuccess: () => {
      setAncien("");
      setNouveau("");
      setConfirmation("");
      toast.success("Code PIN modifié");
    },
    onError: (error: Error) => toast.error(error.message || "Modification impossible."),
  });

  const deconnexion = useMutation({
    mutationFn: () => logoutFn(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate({ to: "/connexion" });
    },
  });

  if (session.isLoading || !session.data) {
    return (
      <AppShell title="Mon compte">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-56 w-full rounded-2xl" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Mon compte">
      <div className="surface-card animate-rise flex items-center gap-4 p-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
          {initials(`${session.data.prenom} ${session.data.nom}`)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-black">
            {session.data.prenom} {session.data.nom}
          </p>
          <p className="text-sm text-muted-foreground">{session.data.numero}</p>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          profil.mutate();
        }}
        className="surface-card mt-4 space-y-3 p-4"
      >
        <h2 className="inline-flex items-center gap-2 text-sm font-bold">
          <User className="h-4 w-4 text-muted-foreground" />
          Mes informations
        </h2>
        <Field label="Prénom">
          <Input id="prenom" value={prenom} onChange={(event) => setPrenom(event.target.value)} />
        </Field>
        <Field label="Nom">
          <Input id="nom" value={nom} onChange={(event) => setNom(event.target.value)} />
        </Field>
        <Field label="Numéro de téléphone">
          <Input
            id="numero"
            inputMode="tel"
            value={numero}
            onChange={(event) => setNumero(event.target.value)}
          />
        </Field>
        <Button type="submit" block loading={profil.isPending}>
          Enregistrer
        </Button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          pin.mutate();
        }}
        className="surface-card mt-4 space-y-3 p-4"
      >
        <h2 className="inline-flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Changer mon code PIN
        </h2>
        <Field label="Code PIN actuel">
          <PinField value={ancien} onChange={setAncien} />
        </Field>
        <Field label="Nouveau code PIN">
          <PinField value={nouveau} onChange={setNouveau} />
        </Field>
        <Field label="Confirmer le nouveau code">
          <PinField value={confirmation} onChange={setConfirmation} />
        </Field>
        <Button
          type="submit"
          block
          variant="soft"
          loading={pin.isPending}
          disabled={ancien.length < 4 || nouveau.length < 4 || confirmation.length < 4}
        >
          Mettre à jour le code PIN
        </Button>
      </form>

      <div className="mt-4 space-y-2.5">
        <a
          href={whatsappLink(
            `Bonjour GAO FOOD, je suis ${session.data.prenom} ${session.data.nom} (${session.data.numero}) et je souhaite signaler un problème :`,
          )}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <Button variant="outline" block>
            <LifeBuoy className="h-4 w-4" />
            Signaler un problème ({ADMIN_PHONE_DISPLAY})
          </Button>
        </a>
        <Button variant="danger" block loading={deconnexion.isPending} onClick={() => deconnexion.mutate()}>
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
        <Link to="/conditions" className="block pt-1 text-center text-xs text-muted-foreground underline">
          Conditions d'utilisation & politique de confidentialité
        </Link>
      </div>
    </AppShell>
  );
}
