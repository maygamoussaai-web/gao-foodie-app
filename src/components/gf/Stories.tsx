import { Link } from "@tanstack/react-router";
import { ChevronRight, PlayCircle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Promotion } from "@/lib/types";
import { Button, Skeleton } from "./ui";

/** Durée d'affichage d'une image dans le viewer (les vidéos avancent à leur fin). */
const DUREE_IMAGE_MS = 5000;

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
 * Barre de statuts façon WhatsApp : avatars ronds en haut, anneau dégradé
 * tant que la promotion n'a pas été vue, anneau gris une fois consultée.
 * C'est le SEUL endroit où les promotions sont listées — pas de doublon
 * en dessous (l'ancienne grille de cartes a été retirée).
 */
export function StoriesBar({
  promotions,
  loading,
}: {
  promotions: Promotion[];
  loading?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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

  if (promotions.length === 0) return null;

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1">
        {promotions.map((promotion, index) => {
          const vue = vues.has(promotion.id);
          return (
            <button
              key={promotion.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              className="tap tap-active flex w-[68px] shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={
                  vue
                    ? "rounded-full bg-border p-[2.5px]"
                    : "rounded-full bg-gradient-to-tr from-primary to-sand p-[2.5px]"
                }
              >
                <span className="relative block rounded-full bg-background p-[2px]">
                  {promotion.type_media === "image" ? (
                    <img
                      src={promotion.media_url}
                      alt={promotion.description ?? promotion.restaurant_nom}
                      className="h-14 w-14 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : promotion.restaurant_logo ? (
                    <img
                      src={promotion.restaurant_logo}
                      alt={promotion.restaurant_nom}
                      className="h-14 w-14 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Sparkles className="h-5 w-5" />
                    </span>
                  )}
                  {promotion.type_media === "video" ? (
                    <PlayCircle className="absolute right-0 bottom-0 h-5 w-5 rounded-full bg-background text-primary" />
                  ) : null}
                </span>
              </span>
              <span className="w-full truncate text-center text-[11px] font-semibold text-muted-foreground">
                {promotion.restaurant_nom}
              </span>
            </button>
          );
        })}
      </div>
      {openIndex !== null ? (
        <StoryViewer
          promotions={promotions}
          index={openIndex}
          onIndexChange={(next) => {
            setOpenIndex(next);
            setVues((prev) => new Set(prev).add(promotions[next]!.id));
          }}
          onClose={() => setOpenIndex(null)}
          onOpenMarkSeen={(id) => setVues((prev) => new Set(prev).add(id))}
        />
      ) : null}
    </>
  );
}

function StoryViewer({
  promotions,
  index,
  onIndexChange,
  onClose,
  onOpenMarkSeen,
}: {
  promotions: Promotion[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onOpenMarkSeen: (id: string) => void;
}) {
  const promotion = promotions[index]!;
  const [progress, setProgress] = useState(0);
  const [enPause, setEnPause] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const debutRef = useRef(0);
  const ecouleAvantPauseRef = useRef(0);
  const dragStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  // Marque la promotion courante comme vue dès l'ouverture.
  useEffect(() => {
    onOpenMarkSeen(promotion.id);
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
        if (index < promotions.length - 1) onIndexChange(index + 1);
        else onClose();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, promotion.id, promotion.type_media, enPause]);

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
      if (event.key === "ArrowRight" && index < promotions.length - 1) onIndexChange(index + 1);
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, promotions.length, onClose, onIndexChange]);

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
      className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.12_0.01_255)]"
      style={{
        transform: dragY ? `translateY(${dragY}px) scale(${1 - Math.min(dragY, 200) / 900})` : undefined,
        opacity: dragY ? Math.max(0.5, 1 - dragY / 300) : 1,
        transition: dragY ? "none" : "transform 200ms ease, opacity 200ms ease",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex gap-1 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        {promotions.map((item, itemIndex) => (
          <span key={item.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <span
              className="block h-full bg-white"
              style={{
                width:
                  itemIndex < index ? "100%" : itemIndex === index ? `${progress}%` : "0%",
                transition: itemIndex === index && promotion.type_media === "video" ? "width 120ms linear" : undefined,
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
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="tap flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-center justify-center px-2">
          {promotion.type_media === "video" ? (
            <video
              key={promotion.id}
              ref={videoRef}
              src={promotion.media_url}
              className="max-h-full max-w-full rounded-2xl"
              autoPlay
              playsInline
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                if (video.duration > 0) setProgress((video.currentTime / video.duration) * 100);
              }}
              onEnded={() => {
                if (index < promotions.length - 1) onIndexChange(index + 1);
                else onClose();
              }}
            />
          ) : (
            <img
              src={promotion.media_url}
              alt={promotion.description ?? "Promotion"}
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
          )}
        </div>
        {index > 0 ? (
          <button
            type="button"
            aria-label="Promotion précédente"
            onClick={() => onIndexChange(index - 1)}
            className="absolute top-0 left-0 h-full w-1/4"
          />
        ) : null}
        {index < promotions.length - 1 ? (
          <button
            type="button"
            aria-label="Promotion suivante"
            onClick={() => onIndexChange(index + 1)}
            className="absolute top-0 right-0 h-full w-1/4"
          />
        ) : null}
      </div>

      <div className="space-y-4 px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {promotion.description ? (
          <p className="text-[15px] leading-relaxed text-white/90">{promotion.description}</p>
        ) : null}
        <PromoAction promotion={promotion} onNavigate={onClose} />
      </div>
    </div>
  );
}
