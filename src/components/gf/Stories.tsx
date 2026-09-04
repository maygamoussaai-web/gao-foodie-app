import { Link } from "@tanstack/react-router";
import { ChevronRight, PlayCircle, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Promotion } from "@/lib/types";
import { Button, Skeleton } from "./ui";

/** Durée d'affichage d'une image dans le viewer (les vidéos avancent à leur fin). */
const DUREE_IMAGE_MS = 5000;

/** Regroupe les promotions par restaurant, en conservant l'ordre d'apparition. */
function grouperParRestaurant(promotions: Promotion[]): Promotion[][] {
  const ordreRestaurants: string[] = [];
  const parRestaurant = new Map<string, Promotion[]>();
  for (const promo of promotions) {
    if (!parRestaurant.has(promo.restaurant_id)) {
      parRestaurant.set(promo.restaurant_id, []);
      ordreRestaurants.push(promo.restaurant_id);
    }
    parRestaurant.get(promo.restaurant_id)!.push(promo);
  }
  return ordreRestaurants.map((id) => parRestaurant.get(id)!);
}

/** Libellé et cible du bouton d'action d'une promotion. */
function actionPromotion(promotion: Promotion) {
  const articleId = promotion.plat_id ?? promotion.boisson_id ?? null;
  return {
    articleId,
    label: promotion.plat_id
      ? "Voir le plat"
      : promotion.boisson_id
        ? "Voir la boisson"
        : "Voir le menu",
  };
}

function PromoAction({
  promotion,
  onNavigate,
}: {
  promotion: Promotion;
  onNavigate?: () => void;
}) {
  const { articleId, label } = actionPromotion(promotion);
  return (
    <Link
      to="/restaurant/$id"
      params={{ id: promotion.restaurant_id }}
      search={articleId ? { article: articleId } : {}}
      onClick={onNavigate}
      className="block"
    >
      <Button block size="lg" variant="primary">
        {label}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}

/**
 * Barre de statuts façon WhatsApp : UN rond par restaurant (pas par
 * promotion). Un restaurant avec plusieurs promotions n'a qu'un seul rond ;
 * l'ouvrir enchaîne toutes ses promotions, comme les statuts groupés d'un
 * contact WhatsApp. Anneau dégradé tant qu'il reste au moins une promotion
 * non vue dans le groupe, gris une fois tout consulté.
 */
export function StoriesBar({
  promotions,
  loading,
}: {
  promotions: Promotion[];
  loading?: boolean;
}) {
  const groupes = useMemo(() => grouperParRestaurant(promotions), [promotions]);
  const [ouverture, setOuverture] = useState<{ groupe: number; item: number } | null>(null);
  const [vues, setVues] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex w-16 flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (groupes.length === 0) return null;

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1">
        {groupes.map((groupe, groupeIndex) => {
          const premiere = groupe[0]!;
          const toutVu = groupe.every((p) => vues.has(p.id));
          return (
            <button
              key={premiere.restaurant_id}
              type="button"
              onClick={() => setOuverture({ groupe: groupeIndex, item: 0 })}
              className="tap tap-active flex w-[68px] shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={
                  toutVu
                    ? "rounded-full bg-border p-[2.5px]"
                    : "rounded-full bg-gradient-to-tr from-primary to-sand p-[2.5px]"
                }
              >
                <span className="relative block rounded-full bg-background p-[2px]">
                  {premiere.restaurant_logo ? (
                    <img
                      src={premiere.restaurant_logo}
                      alt={premiere.restaurant_nom}
                      className="h-14 w-14 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : premiere.type_media === "image" ? (
                    <img
                      src={premiere.media_url}
                      alt={premiere.restaurant_nom}
                      className="h-14 w-14 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Sparkles className="h-5 w-5" />
                    </span>
                  )}
                  {groupe.length > 1 ? (
                    <span className="absolute -right-0.5 -bottom-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {groupe.length}
                    </span>
                  ) : premiere.type_media === "video" ? (
                    <PlayCircle className="absolute right-0 bottom-0 h-5 w-5 rounded-full bg-background text-primary" />
                  ) : null}
                </span>
              </span>
              <span className="w-full truncate text-center text-[11px] font-semibold text-muted-foreground">
                {premiere.restaurant_nom}
              </span>
            </button>
          );
        })}
      </div>
      {ouverture !== null ? (
        <StoryViewer
          groupes={groupes}
          groupeIndex={ouverture.groupe}
          itemIndex={ouverture.item}
          onNaviguer={(groupe, item) => {
            setOuverture({ groupe, item });
            setVues((prev) => new Set(prev).add(groupes[groupe]![item]!.id));
          }}
          onClose={() => setOuverture(null)}
          onMarquerVu={(id) => setVues((prev) => new Set(prev).add(id))}
        />
      ) : null}
    </>
  );
}

function StoryViewer({
  groupes,
  groupeIndex,
  itemIndex,
  onNaviguer,
  onClose,
  onMarquerVu,
}: {
  groupes: Promotion[][];
  groupeIndex: number;
  itemIndex: number;
  onNaviguer: (groupeIndex: number, itemIndex: number) => void;
  onClose: () => void;
  onMarquerVu: (id: string) => void;
}) {
  const groupe = groupes[groupeIndex]!;
  const promotion = groupe[itemIndex]!;
  const [progress, setProgress] = useState(0);
  const [enPause, setEnPause] = useState(false);
  const [muet, setMuet] = useState(true);
  const [erreurMedia, setErreurMedia] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const debutRef = useRef(0);
  const ecouleAvantPauseRef = useRef(0);
  const dragStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  function suivant() {
    if (itemIndex < groupe.length - 1) {
      onNaviguer(groupeIndex, itemIndex + 1);
    } else if (groupeIndex < groupes.length - 1) {
      onNaviguer(groupeIndex + 1, 0);
    } else {
      onClose();
    }
  }
  function precedent() {
    if (itemIndex > 0) {
      onNaviguer(groupeIndex, itemIndex - 1);
    } else if (groupeIndex > 0) {
      onNaviguer(groupeIndex - 1, groupes[groupeIndex - 1]!.length - 1);
    }
  }

  useEffect(() => {
    onMarquerVu(promotion.id);
    setErreurMedia(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotion.id]);

  // Progression automatique façon story WhatsApp : barre qui se remplit,
  // avance toute seule à la fin (image = durée fixe, vidéo = sa propre durée).
  useEffect(() => {
    setProgress(0);
    ecouleAvantPauseRef.current = 0;
    if (promotion.type_media === "video") return; // pilotée par onTimeUpdate/onEnded

    debutRef.current = performance.now();
    let frame: number;
    const tick = () => {
      if (enPause) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const ecoule = ecouleAvantPauseRef.current + (performance.now() - debutRef.current);
      const ratio = Math.min(1, ecoule / DUREE_IMAGE_MS);
      setProgress(ratio * 100);
      if (ratio >= 1) {
        suivant();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeIndex, itemIndex, promotion.type_media, enPause]);

  // Pause/reprise vidéo quand on maintient l'appui.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (enPause) video.pause();
    else video.play().catch(() => {});
  }, [enPause]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") suivant();
      if (event.key === "ArrowLeft") precedent();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeIndex, itemIndex]);

  function onTouchStart(event: React.TouchEvent) {
    dragStartY.current = event.touches[0]!.clientY;
    setEnPause(true);
  }
  function onTouchMove(event: React.TouchEvent) {
    if (dragStartY.current == null) return;
    const delta = event.touches[0]!.clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }
  function onTouchEnd() {
    setEnPause(false);
    if (dragY > 90) {
      onClose();
      return;
    }
    setDragY(0);
    dragStartY.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[oklch(0.12_0.01_255)]"
      style={{
        height: "100dvh",
        transform: dragY ? `translateY(${dragY}px) scale(${1 - Math.min(dragY, 200) / 900})` : undefined,
        opacity: dragY ? Math.max(0.5, 1 - dragY / 300) : 1,
        transition: dragY ? "none" : "transform 200ms ease, opacity 200ms ease",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Média plein écran, façon WhatsApp : la story occupe toute la hauteur. */}
      <div className="absolute inset-0">
        {erreurMedia ? (
          <p className="flex h-full items-center justify-center text-sm text-white/70">
            Ce média n'a pas pu être chargé.
          </p>
        ) : promotion.type_media === "video" ? (
          <video
            key={promotion.id}
            ref={videoRef}
            src={promotion.media_url}
            className="h-full w-full object-contain"
            autoPlay
            muted={muet}
            playsInline
            onError={() => setErreurMedia(true)}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              if (video.duration > 0) setProgress((video.currentTime / video.duration) * 100);
            }}
            onEnded={suivant}
          />
        ) : (
          <img
            src={promotion.media_url}
            alt={promotion.description ?? "Promotion"}
            className="h-full w-full object-contain"
            onError={() => setErreurMedia(true)}
          />
        )}
      </div>

      {/* Zones de navigation tactile (comme WhatsApp : gauche/droite). */}
      <button
        type="button"
        aria-label="Précédent"
        onClick={precedent}
        className="absolute top-24 bottom-32 left-0 w-1/3"
      />
      <button
        type="button"
        aria-label="Suivant"
        onClick={suivant}
        className="absolute top-24 right-0 bottom-32 w-1/3"
      />

      {/* Dégradés de lisibilité haut/bas. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 to-transparent" />

      <div className="absolute inset-x-0 top-0">
      {/* Une barre de progression par promotion DU GROUPE COURANT uniquement. */}
      <div className="flex gap-1 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">

        {groupe.map((item, i) => (
          <span key={item.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <span
              className="block h-full bg-white"
              style={{
                width: i < itemIndex ? "100%" : i === itemIndex ? `${progress}%` : "0%",
                transition: i === itemIndex && promotion.type_media === "video" ? "width 120ms linear" : undefined,
              }}
            />
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {promotion.restaurant_logo ? (
          <img
            src={promotion.restaurant_logo}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : null}
        <p className="flex-1 truncate text-sm font-bold text-white">{promotion.restaurant_nom}</p>
        {promotion.type_media === "video" ? (
          <button
            type="button"
            onClick={() => setMuet((m) => !m)}
            aria-label={muet ? "Activer le son" : "Couper le son"}
            className="tap flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            {muet ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="tap flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          ✕
        </button>
      </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-3 px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {promotion.description ? (
          <p className="line-clamp-3 text-[15px] leading-relaxed text-white/90">
            {promotion.description}
          </p>
        ) : null}
        <PromoAction promotion={promotion} onNavigate={onClose} />
      </div>
    </div>

  );
}
