# Correction de la connexion — limite PBKDF2 du runtime

## Ce qui se passe

Le code PIN est protégé par un hachage PBKDF2 à 150 000 itérations. Le runtime serveur (Cloudflare Worker) refuse tout ce qui dépasse 100 000 itérations : la vérification échoue avant même de comparer le PIN, d'où le message d'erreur à la connexion.

Vérification faite en base : les 3 comptes clients existants ont tous un hachage à 150 000 itérations. Ils sont donc actuellement invérifiables tels quels.

## Correctif

1. Ramener le paramètre de hachage à 100 000 itérations (limite maximale supportée, niveau de sécurité toujours conforme aux recommandations OWASP pour PBKDF2-SHA256 côté serveur). Tous les nouveaux comptes et tous les changements/réinitialisations de PIN utiliseront cette valeur.
2. Ajouter un garde-fou à la vérification : si un hachage stocké annonce plus de 100 000 itérations, on ne tente pas l'appel qui plante — on renvoie un message clair invitant à réinitialiser le code PIN, au lieu d'une erreur technique.
3. Migration transparente : à chaque connexion réussie avec un hachage encore à l'ancien format, le PIN est ré-haché automatiquement en 100 000 itérations (aucune action pour le client).
4. Les 3 comptes existants ne peuvent pas être migrés automatiquement (le PIN en clair n'existe nulle part). Ils passeront par l'écran « Code PIN oublié » déjà en place, qui fonctionne sans WhatsApp (numéro + prénom + nom) et reconnecte immédiatement.

## Détails techniques

- `src/lib/supabase.server.ts` : `PBKDF2_ITERATIONS = 100_000` ; `verifyPin` retourne `false` proprement (sans appel WebCrypto) si `iterations > 100_000` ; ajout d'un helper `needsRehash(stored)`.
- `src/lib/auth.functions.ts` : dans `loginFn`, message d'erreur dédié quand le hachage est à l'ancien format (« Sécurité mise à jour : réinitialisez votre code PIN »), et ré-hachage silencieux après une vérification réussie quand `needsRehash` est vrai.
- Aucune modification de schéma, aucune table créée, aucune logique métier touchée.

## Alternative possible

Si vous préférez qu'aucun compte existant n'ait à réinitialiser son PIN, je peux implémenter un PBKDF2 en JavaScript pur (boucle HMAC-SHA256) utilisé uniquement pour les anciens hachages à 150 000 itérations, avec ré-hachage immédiat après la première connexion. C'est fonctionnel mais ajoute environ 1 à 3 secondes à la première connexion de ces 3 comptes.
