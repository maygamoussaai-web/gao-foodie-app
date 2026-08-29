import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSessionClient } from "./auth.server";
import { getDb } from "./supabase.server";

const BUCKET = "localisations";

/** Envoie le message vocal de localisation (base64) vers le stockage et renvoie son URL publique. */
export const uploadAudioFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        base64: z.string().min(10).max(4_000_000),
        mime: z.string().max(80),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const client = await requireSessionClient();
    const db = getDb();
    const binary = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0));
    const extension = data.mime.includes("mp4") ? "mp4" : data.mime.includes("mpeg") ? "mp3" : "webm";
    const path = `${client.id}/${Date.now()}.${extension}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, binary, { contentType: data.mime, upsert: false });
    if (error) throw new Error("Envoi du message vocal impossible. Réessayez.");

    const { data: publicUrl } = db.storage.from(BUCKET).getPublicUrl(path);
    return { url: publicUrl.publicUrl };
  });
