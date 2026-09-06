/**
 * Envoi de SMS pour la réinitialisation du code PIN.
 *
 * Fournisseur : Africa's Talking (bonne couverture Mali/Afrique de l'Ouest,
 * API simple). Configuré via variables d'environnement côté hébergeur :
 *   AT_USERNAME   — nom d'utilisateur Africa's Talking (ou "sandbox" en test)
 *   AT_API_KEY    — clé API du compte
 *   AT_SENDER_ID  — (optionnel) identifiant d'expéditeur validé, ex. "GAOFOOD"
 *
 * Tant que ces variables ne sont pas renseignées, `envoyerSms` retourne
 * `{ envoye: false }` sans lever d'erreur : l'appelant peut alors retomber
 * sur un mode de test (code affiché à l'écran) plutôt que de casser le flux
 * de réinitialisation en production avant que le compte SMS soit prêt.
 */

export type ResultatEnvoiSms = { envoye: true } | { envoye: false; raison: string };

function smsConfigure(): boolean {
  return Boolean(process.env.AT_USERNAME && process.env.AT_API_KEY);
}

/** Met le numéro local (8 chiffres) au format international malien. */
export function versFormatInternational(numeroLocal: string): string {
  const digits = numeroLocal.replace(/\D/g, "");
  return digits.startsWith("223") ? `+${digits}` : `+223${digits}`;
}

export async function envoyerSms(numeroLocal: string, message: string): Promise<ResultatEnvoiSms> {
  if (!smsConfigure()) {
    return { envoye: false, raison: "Service SMS non configuré (AT_USERNAME / AT_API_KEY manquants)." };
  }

  try {
    const corps = new URLSearchParams({
      username: process.env.AT_USERNAME!,
      to: versFormatInternational(numeroLocal),
      message,
      ...(process.env.AT_SENDER_ID ? { from: process.env.AT_SENDER_ID } : {}),
    });

    const reponse = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey: process.env.AT_API_KEY!,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: corps.toString(),
    });

    if (!reponse.ok) {
      return { envoye: false, raison: `Échec de l'envoi (HTTP ${reponse.status}).` };
    }

    const data = (await reponse.json()) as {
      SMSMessageData?: { Recipients?: { status: string }[] };
    };
    const recipients = data.SMSMessageData?.Recipients ?? [];
    const ok = recipients.length > 0 && recipients.every((r) => r.status === "Success");
    return ok ? { envoye: true } : { envoye: false, raison: "Le fournisseur SMS a refusé l'envoi." };
  } catch (error) {
    return { envoye: false, raison: error instanceof Error ? error.message : "Erreur réseau." };
  }
}
