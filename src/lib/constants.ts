export const ADMIN_WHATSAPP = "22360673302";
export const ADMIN_PHONE_DISPLAY = "+223 60 67 33 02";

export function whatsappLink(message: string): string {
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
