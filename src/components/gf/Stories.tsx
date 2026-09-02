import { Link } from "@tanstack/react-router";
import { ChevronRight, PlayCircle, Sparkles, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Promotion } from "@/lib/types";
import { Button, Skeleton } from "./ui";

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
  variant = "primary",
}: {
  promotion: Promotion;
  onNavigate?: () => void;
  variant?: "primary" | "soft";
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
      <Button block size={variant === "primary" ? "lg" : "md"} variant={variant === "primary" ? "primary" : "soft"}>
        {label}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}

export function StoriesBar({
  promotions,
  loading,
}: {
  promotions: Promotion[];
  loading?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
        {promotions.map((promotion, index) => (
          <button
            key={promotion.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="tap tap-active flex w-[68px] shrink-0 flex-col items-center gap-1.5"
          >
            <span className="rounded-full bg-gradient-to-tr from-primary to-sand p-[2.5px]">
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
        ))}
      </div>
      {openIndex !== null ? (
        <StoryViewer
          promotions={promotions}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  );
}

/** Toutes les promotions visibles d'un coup, chacune avec son bouton d'action. */
export function PromotionsGrid({
  promotions,
  loading,
}: {
  promotions: Promotion[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-64 w-[78%] shrink-0 rounded-3xl" />
        ))}
      </div>
    );
  }
  if (promotions.length === 0) return null;

  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {promotions.map((promotion, index) => (
        <article
          key={promotion.id}
          className="surface-card animate-rise flex w-[80%] max-w-[320px] shrink-0 snap-start flex-col overflow-hidden p-0"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="relative aspect-[4/3] w-full bg-muted">
            {promotion.type_media === "video" ? (
              <video
                src={promotion.media_url}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
              />
            ) : (
              <img
                src={promotion.media_url}
                alt={promotion.description ?? `Promotion ${promotion.restaurant_nom}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
            <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
              {promotion.restaurant_logo ? (
                <img src={promotion.restaurant_logo} alt="" className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="max-w-[130px] truncate">{promotion.restaurant_nom}</span>
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-3.5">
            <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
              {promotion.description ?? "Promotion en cours dans ce restaurant."}
            </p>
            <div className="mt-auto">
              <PromoAction promotion={promotion} variant="soft" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function StoryViewer({
  promotions,
  index,
  onIndexChange,
  onClose,
}: {
  promotions: Promotion[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const promotion = promotions[index]!;

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[oklch(0.12_0.01_255)] animate-rise">
      <div className="flex gap-1 px-3 pt-3">
        {promotions.map((item, itemIndex) => (
          <span
            key={item.id}
            className={`h-[3px] flex-1 rounded-full ${itemIndex <= index ? "bg-white" : "bg-white/25"}`}
          />
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
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-center justify-center px-2">
          {promotion.type_media === "video" ? (
            <video
              src={promotion.media_url}
              className="max-h-full max-w-full rounded-2xl"
              autoPlay
              controls
              playsInline
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
