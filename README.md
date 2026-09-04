# Gao Eats Connect

Tu construis l'interface ACHETEUR (client grand public) de "GAO FOOD", une plateforme de commande de repas pour la ville de Gao (Mali). Lis attentivement tout ce message : c'est le seul prompt que tu recevras avant la mise en prod, il doit tout couvrir.

=== RÈGLE ABSOLUE ===
La LOGIQUE métier décrite ci-dessous est figée et ne doit jamais être simplifiée, contournée ou "améliorée" de ta propre initiative. Le VISUEL en revanche est entièrement à ta charge en tant qu'expert design — mais toujours dans l'esprit défini en section DESIGN, jamais un cliché "fait par IA".

=== BASE DE DONNÉES (Supabase) ===
Connecte ce projet via l'intégration native Supabase à un projet Supabase EXISTANT (ref: wqyebuohgyldvpaktdts, même compte Google que ce workspace Lovable). NE CRÉE AUCUNE nouvelle table pour les entités métier ci-dessous : elles existent déjà et sont utilisées par le projet Restaurateur (déjà en développement séparé sur la même base). Toute migration doit être strictement additive (nouvelles fonctions/policies RLS pour ce use-case client) — ne jamais modifier le schéma existant ni ses contraintes.

Tables existantes pertinentes :
- clients(id, prenom, nom, numero unique, code_pin_hash, created_at, updated_at)
- sessions_client(id, client_id, token unique, created_at, expires_at=now()+90j)
- codes_reset_client(id, client_id, code, created_at, expires_at=now()+15min, utilise bool)
- restaurants(id, restaurateur_id, nom, logo_url, quartier, prix_livraison 0-1000 FCFA, horaire_ouverture, horaire_fermeture, delai_livraison_min_min, delai_livraison_max_min ≤180, solde_admin, statut enum[actif,suspendu], motif_suspension)
- plats(id, restaurant_id, nom, prix, photo_url, ingredients, note_moyenne, nombre_notes, nombre_commandes, actif)
- boissons(id, restaurant_id, nom, prix, photo_url, note_moyenne, nombre_notes, nombre_commandes, actif) — pas d'ingrédients
- promotions(id, restaurant_id, media_url, type_media enum[image,video], description, plat_id?, boisson_id?, actif, created_at, expires_at)
- commandes(id, client_id, restaurant_id, statut enum[en_cours,vu,payee,annulee], total_articles, cout_livraison, total_commande, delai_livraison_min_min, delai_livraison_max_min, methode_localisation enum[audio,position], localisation_url, localisation_audio_url, created_at, vu_at, payee_at, annulee_at, annulee_par enum[client,restaurateur,systeme])
- commande_articles(id, commande_id, type_article enum[plat,boisson], plat_id?, boisson_id?, nom_article, prix_unitaire, quantite 1-10, note_donnee 1-5?)
- historique_paiements_solde, parametres_admin(prix_promotion, prix_par_commande_payee) — pas utilisées par ce projet, ne pas y toucher.

⚠️ AUTHENTIFICATION CUSTOM — PAS Supabase Auth : il n'y a pas de auth.users. Tout repose sur les tables clients/sessions_client/codes_reset_client ci-dessus. Implémente le hash du code PIN et la génération/validation des tokens de session via des Supabase Edge Functions (jamais de hash côté client). RLS : le client ne doit accéder qu'à ses propres commandes/session via son token, et en lecture seule aux restaurants/plats/boissons/promotions actifs.

=== STACK & CONTRAINTES TECHNIQUES ===
- PWA installable (manifest, service worker, icônes maskable), responsive design impeccable sur mobile (priorité absolue, c'est le device principal des utilisateurs de Gao), tablette, desktop.
- Notifications push web (via service worker) : alerter le client à chaque changement de statut de sa commande.
- Un job planifié (Supabase cron/Edge Function) doit auto-annuler toute commande en_cours/vu inchangée depuis 24h (statut → annulee, annulee_par='systeme').

=== DESIGN — LIS ATTENTIVEMENT ===
Objectif : un niveau visuel digne de WhatsApp / Instagram / Tiktok / grandes apps mondiales. INTERDICTION FORMELLE de tout ce qui sent le "site fait par IA" : pas de dégradés multicolores gratuits, pas d'amoncellement de couleurs, pas de composants shadcn par défaut non retravaillés. Chaque écran doit avoir des micro-détails soignés (transitions, ombres subtiles, espacement, hiérarchie typographique, empty states, skeleton loaders) — c'est TOI l'expert graphisme senior, prends toutes les décisions de détail (boutons, loaders, pages d'erreur, messages succès/erreur, iconographie — utilise une bibliothèque d'icônes cohérente et moderne type Lucide/Phosphor, choisis un style et garde-le partout).

Mode clair : primaire blanc, secondaire bleu clair, tertiaire à ta main (cohérente) ; en arrière-plan une évocation visuelle élégante et discrète (faible opacité) du Tombeau des Askia (monument historique de Gao) — utilise un rendu illustré/stylisé sobre plutôt qu'une photo brute pour rester dans une esthétique premium et éviter tout souci de droits d'image.
Mode sombre : primaire noir, secondaire bleu, tertiaire blanc.
Inspiration listes/simplicité : WhatsApp (pas ses couleurs, sa simplicité d'usage et de hiérarchie d'info).

Un détail visuel manquant, une icône imparfaite ou un cadre qui dépasse ne doit jamais arriver — livre un travail fini, jamais un brouillon.

=== ONBOARDING ===
2-4 écrans d'onboarding avant l'authentification, texte orienté grand public/acheteur (pas de restaurateur) : valoriser la simplicité de commander à Gao sans se déplacer, découvrir tous les restaurants de la ville, suivi de commande en temps réel, paiement à la livraison sans risque. Rédige des textes courts et impactants toi-même.

=== AUTHENTIFICATION ===
Inscription (une seule page) : prénom, nom, numéro de téléphone, code PIN (icône œil ouvert/barré pour afficher/masquer). Tout en bas : texte lien "En vous inscrivant vous acceptez nos conditions, nos politiques de sécurité et de confidentialité" → mène vers la page Conditions & Confidentialité (contenu fourni plus bas).
Connexion : numéro + code PIN (œil). "Code PIN oublié ?" → génère un code dans codes_reset_client (6 chiffres, 15min) et ouvre un lien WhatsApp pré-rempli vers le +223 60673302 (numéro admin) pour vérification d'identité manuelle et communication du code, cohérent avec le reste de l'app qui utilise WhatsApp comme canal de contact admin.
Session persistante 90 jours via sessions_client (token stocké de façon sécurisée), sans re-demander la connexion à chaque ouverture, sans faille de sécurité (token en httpOnly-like storage adapté au contexte PWA, rotation à l'expiration proche).

=== PAGE VITRINE (accueil) ===
- Bandeau "statuts" façon stories WhatsApp/Instagram : uniquement les promotions actives (image ou vidéo), au clic ouverture plein écran avec nom du restaurant en haut, média, description en bas, et bouton "Voir le menu" (ou "Voir le plat/boisson" si liée). Design aux couleurs de Gao Food.
- Barre de recherche restaurants par nom.
- Liste des restaurants (statut='actif' uniquement) en cartes compactes tenant sur 2 lignes max : logo à gauche, nom en haut au centre, prix de livraison en haut à gauche, intervalle de délai de livraison, note moyenne (moyenne des notes de tous ses plats/boissons, /5 étoiles), quartier.
- Clic → page restaurant : infos + onglets Plats/Boissons. Chaque item : photo, nom, prix, note moyenne. Clic sur un item → sélecteur de quantité (1 à 10) avec total temporaire, bouton "Ajouter au panier".

=== MON PANIER ===
Badge = nombre d'articles, sur l'onglet. Un panier peut contenir des articles de plusieurs restaurants ; à la validation, regroupe automatiquement les articles par restaurant en une commande distincte par restaurant (un solde_admin/une entrée commandes par restaurant concerné). En haut : total articles + somme des coûts de livraison de chaque restaurant concerné = total commande. Précise clairement "Paiement à la livraison — aucun risque d'arnaque". Chaque article : photo, prix, restaurant, quantité modifiable. Bloc infos client (prénom/nom/numéro, non modifiables ici) + choix localisation : message vocal explicatif OU partage de position exacte (recommandée, badge "recommandé"). Bouton "Valider la commande" → redemande le code PIN → crée les commandes + commande_articles → vide le panier → redirige vers Mes commandes.

=== MES COMMANDES ===
Filtrable par date + recherche (restaurant/article). Deux groupes visuels :
- En cours (statuts en_cours/vu) : cartes rétractables, articles+quantités+prix, total, bouton "voir les articles" (photos), bouton appeler le restaurant (tel:), coût et délai de livraison, date/heure, bouton "Annuler la commande".
- Bouclées (payee/annulee) : mêmes infos sans délai/bouton annuler, + un bloc de notation par étoiles (1-5) pour chaque article commandé (écrit note_donnee, met à jour note_moyenne/nombre_notes du plat ou boisson concerné). Les infos restaurant restent live (changent si le restaurateur les modifie).
Notification push au client à chaque changement de statut.

=== MON COMPTE ===
Voir/modifier prénom, nom, numéro. Changer le code PIN (ancien + nouveau + confirmation). Bouton Se déconnecter. Bouton "Signaler un problème" → lien WhatsApp pré-rempli vers +223 60673302.

=== PAGE CONDITIONS D'UTILISATION & POLITIQUE DE CONFIDENTIALITÉ (acheteur) ===
Crée une page statique avec ce contenu (adapte la mise en forme, garde le fond) :
1. Objet : GAO FOOD met en relation les habitants de Gao avec les restaurants partenaires de la ville pour la commande et la livraison de repas.
2. Compte utilisateur : l'inscription nécessite prénom, nom, numéro de téléphone et code PIN ; l'utilisateur est responsable de la confidentialité de son code PIN.
3. Commandes et paiement : le paiement se fait exclusivement à la livraison, en espèces auprès du livreur/restaurant — GAO FOOD n'encaisse aucun paiement en ligne côté acheteur.
4. Annulation : l'utilisateur peut annuler une commande tant qu'elle n'a pas été marquée payée ; toute commande sans mise à jour de statut pendant 24h est automatiquement annulée.
5. Localisation : la livraison nécessite le partage d'une position (position exacte recommandée ou message vocal explicatif) ; ces données ne sont utilisées que pour l'exécution de la commande en cours.
6. Données personnelles collectées : prénom, nom, numéro de téléphone, code PIN (chiffré, jamais stocké en clair), historique de commandes, localisation associée à chaque commande. Ces données sont utilisées uniquement pour le fonctionnement du service (traitement des commandes, support) et ne sont jamais vendues à des tiers.
7. Notation : l'utilisateur peut noter les articles commandés une fois la commande bouclée ; les notes sont publiques et agrégées par plat/boisson.
8. Responsabilité : GAO FOOD est une plateforme de mise en relation ; la qualité et la préparation des plats relèvent du restaurant partenaire.
9. Contact & réclamations : tout signalement se fait via WhatsApp au +223 60673302.
10. Suppression de compte : l'utilisateur peut demander la suppression de son compte et de ses données via le support WhatsApp.
Rédige un texte fluide et professionnel en français à partir de ces points, structuré en deux sections claires (Conditions d'utilisation / Politique de confidentialité).

=== LIVRABLE ===
Livre une app complète, fonctionnelle de bout en bout (auth → vitrine → commande → suivi → compte), visuellement impeccable, sans que j'aie à signaler un seul détail manquant. Si un point de logique te semble incomplet dans ce brief, complète-le toi-même intelligemment en cohérence avec tout ce qui précède plutôt que de me redemander.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gao-foodie-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/df05cbe2-9424-4728-8217-94be463302ab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
