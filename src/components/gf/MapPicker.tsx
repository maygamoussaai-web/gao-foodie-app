import { Check, Crosshair, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/gf/ui";

export type PointChoisi = { lat: number; lng: number; ajusteALaMain: boolean };

type Props = {
  /** Position GPS de départ. */
  lat: number;
  lng: number;
  /** Précision GPS en mètres, null si inconnue. */
  precision: number | null;
  onCancel: () => void;
  onConfirm: (point: PointChoisi) => void;
  /** Relance une recherche GPS et recentre la carte. */
  onRetryGps?: () => void;
  gpsEnCours?: boolean;
};

let mapsPromise: Promise<typeof google.maps> | null = null;

/** Charge Maps JS API une seule fois, côté navigateur uniquement. */
function chargerMaps(): Promise<typeof google.maps> {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Carte indisponible"));
      return;
    }
    const existant = (window as unknown as { google?: { maps?: typeof google.maps } }).google?.maps;
    if (existant) {
      resolve(existant);
      return;
    }
    const cle = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
      | string
      | undefined;
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
      | string
      | undefined;
    if (!cle) {
      reject(new Error("Carte indisponible"));
      return;
    }
    const callbackName = "__gfInitMaps";
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      resolve((window as unknown as { google: { maps: typeof google.maps } }).google.maps);
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${cle}&loading=async&callback=${callbackName}${
      channel ? `&channel=${channel}` : ""
    }`;
    script.async = true;
    script.onerror = () => reject(new Error("Chargement de la carte impossible"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

const SEUIL_PRECIS = 20;

export default function MapPicker({
  lat,
  lng,
  precision,
  onCancel,
  onConfirm,
  onRetryGps,
  gpsEnCours,
}: Props) {
  const conteneur = useRef<HTMLDivElement | null>(null);
  const carte = useRef<google.maps.Map | null>(null);
  const cercle = useRef<google.maps.Circle | null>(null);
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [deplace, setDeplace] = useState(false);
  const centre = useRef({ lat, lng });

  useEffect(() => {
    let annule = false;
    chargerMaps()
      .then((maps) => {
        if (annule || !conteneur.current) return;
        const map = new maps.Map(conteneur.current, {
          center: { lat, lng },
          zoom: 18,
          mapTypeId: "hybrid",
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          tilt: 0,
        });
        carte.current = map;
        if (precision !== null) {
          cercle.current = new maps.Circle({
            map,
            center: { lat, lng },
            radius: precision,
            strokeColor: "#f97316",
            strokeOpacity: 0.7,
            strokeWeight: 1.5,
            fillColor: "#f97316",
            fillOpacity: 0.12,
            clickable: false,
          });
        }
        map.addListener("center_changed", () => {
          const c = map.getCenter();
          if (!c) return;
          centre.current = { lat: c.lat(), lng: c.lng() };
        });
        map.addListener("dragstart", () => setDeplace(true));
        setPret(true);
      })
      .catch((error: Error) => setErreur(error.message));
    return () => {
      annule = true;
    };
    // Initialisation unique : les recentrages passent par l'effet ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentrage quand un nouveau relevé GPS arrive (bouton « Réessayer »).
  useEffect(() => {
    if (!carte.current) return;
    carte.current.panTo({ lat, lng });
    centre.current = { lat, lng };
    setDeplace(false);
    if (cercle.current) {
      cercle.current.setCenter({ lat, lng });
      cercle.current.setRadius(precision ?? 0);
    }
  }, [lat, lng, precision]);

  const precis = precision !== null && precision <= SEUIL_PRECIS;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div ref={conteneur} className="absolute inset-0" aria-label="Carte de livraison" />

      {!pret || erreur ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background px-8 text-center">
          {erreur ? (
            <>
              <MapPin className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-semibold">La carte n'a pas pu s'afficher</p>
              <p className="text-xs text-muted-foreground">
                Votre position GPS reste utilisable telle quelle.
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
                <Button onClick={() => onConfirm({ lat, lng, ajusteALaMain: false })}>
                  Utiliser ma position
                </Button>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Ouverture de la carte…</p>
            </>
          )}
        </div>
      ) : null}

      {pret && !erreur ? (
        <>
          {/* Épingle fixe au centre : la carte bouge dessous. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="-mt-6 flex flex-col items-center">
              <span className="animate-bounce-slow flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift ring-4 ring-background/70">
                <MapPin className="h-5.5 w-5.5" />
              </span>
              <span className="mt-0.5 h-3 w-3 rounded-full bg-foreground/25 blur-[2px]" />
            </div>
          </div>

          <header className="relative z-10 flex items-start gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Fermer la carte"
              className="tap tap-active flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card/95 text-foreground shadow-lift backdrop-blur"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <div className="rounded-2xl bg-card/95 px-3.5 py-2.5 shadow-lift backdrop-blur">
              <p className="text-[13px] font-black">Placez le point sur votre porte</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                Faites glisser la carte pour ajuster, puis validez.
              </p>
            </div>
          </header>

          <div className="mt-auto" />

          <footer className="relative z-10 space-y-2.5 p-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
            {onRetryGps ? (
              <button
                type="button"
                onClick={onRetryGps}
                disabled={gpsEnCours}
                className="tap tap-active ml-auto flex items-center gap-2 rounded-full bg-card/95 px-3.5 py-2 text-[12.5px] font-bold shadow-lift backdrop-blur disabled:opacity-60"
              >
                {gpsEnCours ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Crosshair className="h-4 w-4 text-primary" />
                )}
                {gpsEnCours ? "Recherche…" : "Recentrer sur moi"}
              </button>
            ) : null}

            <div className="rounded-2xl bg-card/95 p-3 shadow-lift backdrop-blur">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                  deplace
                    ? "bg-primary/12 text-primary"
                    : precis
                      ? "bg-success/12 text-success"
                      : "bg-warning/15 text-warning-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    deplace ? "bg-primary" : precis ? "bg-success" : "bg-warning"
                  }`}
                />
                {deplace
                  ? "Point placé à la main"
                  : precis
                    ? `Position précise · ±${precision} m`
                    : precision !== null
                      ? `Position approximative · ±${precision} m`
                      : "Position approximative"}
              </span>
              {!deplace && !precis ? (
                <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                  Le signal GPS est faible ici. Déplacez la carte pour poser le point exactement sur
                  votre porte.
                </p>
              ) : null}
              <Button
                block
                size="lg"
                className="mt-3"
                onClick={() =>
                  onConfirm({
                    lat: centre.current.lat,
                    lng: centre.current.lng,
                    ajusteALaMain: deplace,
                  })
                }
              >
                <Check className="h-4.5 w-4.5" />
                Confirmer ce point
              </Button>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}
