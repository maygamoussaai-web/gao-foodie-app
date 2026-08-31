import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "tap tap-active inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "gradient-primary text-primary-foreground shadow-glow hover:brightness-[1.06] active:brightness-95",
        soft: "bg-secondary text-secondary-foreground hover:bg-secondary/75",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        sand: "bg-sand text-sand-foreground hover:bg-sand/90",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-11 px-4 text-sm",
        lg: "h-13 px-5 text-[15px]",
        icon: "h-10 w-10",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-xl border border-input bg-card px-4 text-[15px] text-foreground outline-none tap placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/12",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "sand";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-secondary text-secondary-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-sand-foreground dark:text-warning",
    danger: "bg-destructive/12 text-destructive",
    sand: "bg-sand/20 text-sand-foreground dark:text-sand",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stars({
  note,
  count,
  size = 13,
}: {
  note: number | null | undefined;
  count?: number | null | undefined;
  size?: number | undefined;
}) {
  const value = Number(note ?? 0);
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground">
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((index) => (
          <svg key={index} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <defs>
              <linearGradient id={`gf-star-${index}-${Math.round(value * 100)}`}>
                <stop offset={`${Math.max(0, Math.min(1, value - index + 1)) * 100}%`} stopColor="currentColor" />
                <stop offset="0%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.45 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95L12 2.6z"
              fill={`url(#gf-star-${index}-${Math.round(value * 100)})`}
              stroke="currentColor"
              strokeWidth="1.3"
              className="text-sand"
            />
          </svg>
        ))}
      </span>
      <span className="tabular-nums">{value > 0 ? value.toFixed(1) : "—"}</span>
      {typeof count === "number" && count > 0 ? <span className="font-normal">({count})</span> : null}
    </span>
  );
}

export function StarPicker({
  value,
  onSelect,
  disabled,
}: {
  value: number;
  onSelect: (note: number) => void;
  disabled?: boolean | undefined;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((note) => (
        <button
          key={note}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(note)}
          aria-label={`Noter ${note} sur 5`}
          className="tap tap-active rounded-md p-0.5 disabled:cursor-default"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" className={note <= value ? "text-sand" : "text-border"}>
            <path
              d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.45 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95L12 2.6z"
              fill={note <= value ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode | undefined;
}) {
  return (
    <div className="animate-rise flex flex-col items-center px-6 py-14 text-center">
      <span className="animate-float gradient-primary mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground shadow-glow">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
