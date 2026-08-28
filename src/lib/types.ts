export type Client = {
  id: string;
  prenom: string;
  nom: string;
  numero: string;
};

export type Restaurant = {
  id: string;
  nom: string;
  logo_url: string | null;
  quartier: string | null;
  prix_livraison: number;
  horaire_ouverture: string | null;
  horaire_fermeture: string | null;
  delai_livraison_min_min: number;
  delai_livraison_max_min: number;
  statut: string;
  note_moyenne?: number;
  nombre_notes?: number;
};

export type Article = {
  id: string;
  restaurant_id: string;
  nom: string;
  prix: number;
  photo_url: string | null;
  ingredients?: string | null;
  note_moyenne: number | null;
  nombre_notes: number | null;
  actif: boolean;
};

export type Promotion = {
  id: string;
  restaurant_id: string;
  media_url: string;
  type_media: "image" | "video";
  description: string | null;
  plat_id: string | null;
  boisson_id: string | null;
  restaurant_nom: string;
  restaurant_logo: string | null;
};

export type CommandeArticle = {
  id: string;
  type_article: "plat" | "boisson";
  plat_id: string | null;
  boisson_id: string | null;
  nom_article: string;
  prix_unitaire: number;
  quantite: number;
  note_donnee: number | null;
  photo_url?: string | null;
};

export type Commande = {
  id: string;
  restaurant_id: string;
  statut: "en_cours" | "vu" | "payee" | "annulee";
  total_articles: number;
  cout_livraison: number;
  total_commande: number;
  delai_livraison_min_min: number | null;
  delai_livraison_max_min: number | null;
  methode_localisation: "audio" | "position" | null;
  localisation_url: string | null;
  localisation_audio_url: string | null;
  created_at: string;
  annulee_par: string | null;
  restaurant: {
    nom: string;
    logo_url: string | null;
    quartier: string | null;
    numero?: string | null;
  } | null;
  articles: CommandeArticle[];
};

export type CartItem = {
  key: string;
  type_article: "plat" | "boisson";
  article_id: string;
  nom: string;
  prix: number;
  photo_url: string | null;
  quantite: number;
  restaurant_id: string;
  restaurant_nom: string;
  prix_livraison: number;
};
