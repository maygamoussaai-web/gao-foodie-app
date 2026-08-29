import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Loader2,
  MapPin,
  Mic,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Square,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/gf/AppShell";
import { PinField } from "@/components/gf/PinField";
import { Badge, Button, EmptyState, Skeleton } from "@/components/gf/ui";
import { confirmPinFn } from "@/lib/auth.functions";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/format";
import { createOrdersFn } from "@/lib/orders.functions";
import { useSession } from "@/lib/session";
import { uploadAudioFn } from "@/lib/upload.functions";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Mon panier — GAO FOOD" },
      {
        name: "description",
        content:
          "Vérifiez vos articles, choisissez votre localisation et validez votre commande. Paiement à la livraison.",
      },
      { property: "og:title", content: "Mon panier — GAO FOOD" },
      { property: "og:description", content: "Validez votre commande GAO FOOD en quelques secondes." },
    ],
  }),
  component: Panier,
});

type Localisation =
  | { methode: "position"; url: string }
  | { methode: "audio"; url: string }
  | null;

function Panier() {
  const navigate = useNavigate();
  const session = useSession();
  const queryClient = useQueryClient();
  const { items, groups, totalArticles, totalLivraison, total, setQuantity, remove, clear } = useCart();

  const [localisation, setLocalisation] = useState<Localisation>(null);
  const [demandePin, setDemandePin] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!session.isLoading && !session.data) navigate({ to: "/bienvenue" });
  }, [session.isLoading, session.data, navigate]);

  const validation = useMutation({
    mutationFn: async () => {
      if (!localisation) throw new Error("Choisissez une localisation de livraison.");
      await confirmPinFn({ data: { pin } });
      return await createOrdersFn({
        data: {
          items: items.map((item) => ({
            type_article: item.type_article,
            article_id: item.article_id,
            quantite: item.quantite,
          })),
          methode_localisation: localisation.methode,
          localisation_url: localisation.methode === "position" ? localisation.url : null,
          localisation_audio_url: localisation.methode === "audio" ? localisation.url : null,
        },
      });
    },
    onSuccess: () => {
      clear();
      setDemandePin(false);
      setPin("");
      void queryClient.invalidateQueries({ queryKey: ["commandes"] });
      toast.success("Commande envoyée ! Le restaurant a été prévenu.");
      navigate({ to: "/commandes" });
    },
    onError: (error: Error) => toast.error(error.message || "Validation impossible."),
  });

  if (session.isLoading) {
    return (
      <AppShell title="Mon panier">
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (items.length === 0) {
    return (
      <AppShell title="Mon panier">
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Parcourez les restaurants de Gao et ajoutez vos plats préférés."
          action={
            <Link to="/">
              <Button>Découvrir les restaurants</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Mon panier" subtitle={`${items.length} article(s)`}>
      <div className="surface-card animate-rise p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total articles</span>
          <span className="font-bold tabular-nums">{fcfa(totalArticles)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Livraison ({groups.length} restaurant{groups.length > 1 ? "s" : ""})
          </span>
          <span className="font-bold tabular-nums">{fcfa(totalLivraison)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-bold">Total commande</span>
          <span className="text-xl font-black text-primary tabular-nums">{fcfa(total)}</span>
        </div>
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-[12px] font-semibold text-secondary-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Paiement à la livraison — aucun risque d'arnaque.
        </p>
      </div>

      {groups.length > 1 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Vos articles seront envoyés en {groups.length} commandes distinctes, une par restaurant.
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <section key={group.restaurant_id}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                <Store className="h-4 w-4 text-muted-foreground" />
                {group.restaurant_nom}
              </span>
              <Badge tone="primary">Livraison {fcfa(group.prix_livraison)}</Badge>
            </div>
            <div className="space-y-2.5">
              {group.items.map((item) => (
                <article key={item.key} className="surface-card flex items-center gap-3 p-3">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.nom}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <UtensilsCrossed className="h-5 w-5 text-secondary-foreground" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{item.nom}</p>
                    <p className="text-sm font-extrabold text-primary">
                      {fcfa(item.prix * item.quantite)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        onClick={() => setQuantity(item.key, item.quantite - 1)}
                        className="tap flex h-8 w-8 items-center justify-center rounded-lg bg-muted"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">
                        {item.quantite}
                      </span>
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        onClick={() => setQuantity(item.key, item.quantite + 1)}
                        disabled={item.quantite >= 10}
                        className="tap flex h-8 w-8 items-center justify-center rounded-lg bg-muted disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Retirer ${item.nom}`}
                    onClick={() => remove(item.key)}
                    className="tap flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="surface-card mt-5 p-4">
        <h2 className="text-sm font-bold">Vos informations</h2>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>
            {session.data?.prenom} {session.data?.nom}
          </p>
          <p>{session.data?.numero}</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Modifiable depuis l'onglet Compte.
        </p>
      </section>

      <ChoixLocalisation value={localisation} onChange={setLocalisation} />

      <Button
        block
        size="lg"
        className="mt-5"
        disabled={!localisation}
        onClick={() => setDemandePin(true)}
      >
        Valider la commande · {fcfa(total)}
      </Button>

      {demandePin ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute inset-0"
            onClick={() => setDemandePin(false)}
          />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              validation.mutate();
            }}
            className="animate-rise relative w-full max-w-md rounded-t-3xl border border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift"
          >
            <button
              type="button"
              onClick={() => setDemandePin(false)}
              aria-label="Fermer"
              className="tap absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="text-base font-black">Confirmez avec votre code PIN</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sécurité : votre code PIN est demandé avant chaque commande.
            </p>
            <div className="mt-4">
              <PinField value={pin} onChange={setPin} autoFocus />
            </div>
            <Button
              type="submit"
              block
              size="lg"
              className="mt-4"
              loading={validation.isPending}
              disabled={pin.length < 4}
            >
              Envoyer la commande
            </Button>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}

function ChoixLocalisation({
  value,
  onChange,
}: {
  value: Localisation;
  onChange: (value: Localisation) => void;
}) {
  const [enCours, setEnCours] = useState<"position" | "audio" | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const partagerPosition = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setEnCours("position");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({
          methode: "position",
          url: `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
        });
        setEnCours(null);
        toast.success("Position enregistrée");
      },
      () => {
        setEnCours(null);
        toast.error("Position refusée. Autorisez la localisation ou envoyez un message vocal.");
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  };

  const demarrerAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => chunks.current.push(event.data);
      media.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setEnCours("audio");
        try {
          const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
          const buffer = await blob.arrayBuffer();
          let binary = "";
          new Uint8Array(buffer).forEach((byte) => {
            binary += String.fromCharCode(byte);
          });
          const { url } = await uploadAudioFn({
            data: { base64: btoa(binary), mime: blob.type || "audio/webm" },
          });
          onChange({ methode: "audio", url });
          toast.success("Message vocal enregistré");
        } catch (error) {
          toast.error((error as Error).message || "Envoi du message vocal impossible.");
        } finally {
          setEnCours(null);
        }
      };
      recorder.current = media;
      media.start();
      setRecording(true);
    } catch {
      toast.error("Micro indisponible. Autorisez l'accès au microphone.");
    }
  };

  return (
    <section className="surface-card mt-4 p-4">
      <h2 className="text-sm font-bold">Localisation de livraison</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Aidez le livreur à vous trouver rapidement.
      </p>

      <div className="mt-3 space-y-2.5">
        <button
          type="button"
          onClick={partagerPosition}
          disabled={enCours !== null}
          className={`tap tap-active flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
            value?.methode === "position" ? "border-primary bg-secondary" : "border-border bg-card"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {enCours === "position" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-sm font-bold">Partager ma position exacte</span>
              <Badge tone="success">recommandé</Badge>
            </span>
            <span className="block text-xs text-muted-foreground">
              {value?.methode === "position" ? "Position enregistrée" : "Livraison plus rapide et fiable"}
            </span>
          </span>
          {value?.methode === "position" ? <Check className="h-5 w-5 text-primary" /> : null}
        </button>

        <button
          type="button"
          onClick={() => (recording ? recorder.current?.stop() : demarrerAudio())}
          disabled={enCours === "position" || enCours === "audio"}
          className={`tap tap-active flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
            value?.methode === "audio" ? "border-primary bg-secondary" : "border-border bg-card"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {enCours === "audio" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : recording ? (
              <Square className="h-4.5 w-4.5 fill-current" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">
              {recording ? "Arrêter l'enregistrement" : "Message vocal explicatif"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {value?.methode === "audio"
                ? "Message vocal enregistré"
                : "Expliquez où vous vous trouvez"}
            </span>
          </span>
          {value?.methode === "audio" ? <Check className="h-5 w-5 text-primary" /> : null}
        </button>
      </div>
    </section>
  );
}
