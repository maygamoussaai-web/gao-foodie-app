# Localisation : carte ajustable + précision affichée

Objectif : que le restaurateur reçoive un point vraiment juste, corrigé à la main par le client, avec une indication honnête de la qualité du signal.

## Ce que verra le client (page Panier)

1. Il appuie sur « Partager ma position ». L'app cherche le GPS comme aujourd'hui, en affichant la précision atteinte en direct.
2. Une carte s'ouvre, centrée sur sa position, avec un point au milieu. Il déplace la carte du doigt pour placer le point exactement sur sa porte, et peut zoomer.
3. Un bandeau indique la qualité :
   - vert « Position précise » (environ 20 mètres ou mieux),
   - orange « Position approximative — déplacez le point sur votre porte » (au-delà),
   - un bouton « Réessayer le GPS » quand le signal est faible.
   - Si le client déplace le point lui-même, le bandeau devient « Point placé à la main », sans mention de mètres.
4. Il valide : le lien envoyé au restaurateur pointe sur le point corrigé, pas sur le relevé brut.
5. Un aperçu du point choisi reste visible dans le panier, avec un bouton « Modifier ».

Le message vocal reste disponible comme alternative, inchangé.

## Détails techniques

- Carte : connecteur Google Maps Platform géré par Lovable (clé fournie sans compte à créer). Chargement de Maps JavaScript API en `loading=async` avec callback, uniquement côté navigateur, derrière `ClientOnly` et import dynamique pour ne pas casser le rendu serveur.
- Le marqueur est fixe au centre de l'écran, la carte bouge dessous (schéma habituel des apps de livraison, plus simple au doigt que de traîner une épingle).
- La logique GPS existante (`watchPosition`, meilleur relevé, seuil 5 m, limite 25 s) est conservée telle quelle ; on ajoute seulement l'étape de correction et l'état de qualité.
- Les coordonnées finales sont écrites dans `localisation_url` au même format Google Maps qu'aujourd'hui (`https://maps.google.com/?q=lat,lng`), et `methode_localisation` reste `position`. Aucun changement de base de données, aucune nouvelle table, aucune modification de la logique de commande.
- Nouveau composant dédié à la carte dans `src/components/gf/`, intégré dans `src/routes/panier.tsx`.
- Style de la carte accordé au thème orange, mode clair et mode sombre, avec état de chargement soigné.

## Prérequis

Le connecteur Google Maps doit être relié au projet ; je proposerai la connexion au démarrage. Si vous préférez Mapbox, dites-le avant validation : les deux ne peuvent pas cohabiter dans un même projet.

## Hors périmètre

Aucune précision « au centimètre » n'est promise : ce n'est pas réalisable avec un téléphone du commerce. La correction manuelle sur carte donne un résultat bien meilleur en pratique.
