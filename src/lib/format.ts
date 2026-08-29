export function fcfa(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} FCFA`;
}

export function dateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function initials(nom: string): string {
  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
