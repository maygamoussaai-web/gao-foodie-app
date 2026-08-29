export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      boissons: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          nom: string
          nombre_commandes: number
          nombre_notes: number
          note_moyenne: number
          photo_url: string | null
          prix: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          nom: string
          nombre_commandes?: number
          nombre_notes?: number
          note_moyenne?: number
          photo_url?: string | null
          prix: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          nom?: string
          nombre_commandes?: number
          nombre_notes?: number
          note_moyenne?: number
          photo_url?: string | null
          prix?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boissons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boissons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_notes"
            referencedColumns: ["restaurant_id"]
          },
        ]
      }
      clients: {
        Row: {
          code_pin_hash: string
          created_at: string
          id: string
          nom: string
          numero: string
          prenom: string
          updated_at: string
        }
        Insert: {
          code_pin_hash: string
          created_at?: string
          id?: string
          nom: string
          numero: string
          prenom: string
          updated_at?: string
        }
        Update: {
          code_pin_hash?: string
          created_at?: string
          id?: string
          nom?: string
          numero?: string
          prenom?: string
          updated_at?: string
        }
        Relationships: []
      }
      codes_reset_client: {
        Row: {
          client_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          utilise: boolean
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          utilise?: boolean
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          utilise?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "codes_reset_client_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      codes_reset_restaurateur: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          restaurateur_id: string
          utilise: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          restaurateur_id: string
          utilise?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          restaurateur_id?: string
          utilise?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "codes_reset_restaurateur_restaurateur_id_fkey"
            columns: ["restaurateur_id"]
            isOneToOne: false
            referencedRelation: "restaurateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      commande_articles: {
        Row: {
          boisson_id: string | null
          commande_id: string
          id: string
          nom_article: string
          note_donnee: number | null
          plat_id: string | null
          prix_unitaire: number
          quantite: number
          type_article: Database["public"]["Enums"]["type_article"]
        }
        Insert: {
          boisson_id?: string | null
          commande_id: string
          id?: string
          nom_article: string
          note_donnee?: number | null
          plat_id?: string | null
          prix_unitaire: number
          quantite: number
          type_article: Database["public"]["Enums"]["type_article"]
        }
        Update: {
          boisson_id?: string | null
          commande_id?: string
          id?: string
          nom_article?: string
          note_donnee?: number | null
          plat_id?: string | null
          prix_unitaire?: number
          quantite?: number
          type_article?: Database["public"]["Enums"]["type_article"]
        }
        Relationships: [
          {
            foreignKeyName: "commande_articles_boisson_id_fkey"
            columns: ["boisson_id"]
            isOneToOne: false
            referencedRelation: "boissons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commande_articles_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commande_articles_plat_id_fkey"
            columns: ["plat_id"]
            isOneToOne: false
            referencedRelation: "plats"
            referencedColumns: ["id"]
          },
        ]
      }
      commandes: {
        Row: {
          annulee_at: string | null
          annulee_par: string | null
          client_id: string
          cout_livraison: number
          created_at: string
          delai_livraison_max_min: number | null
          delai_livraison_min_min: number | null
          id: string
          localisation_audio_url: string | null
          localisation_url: string | null
          methode_localisation:
            | Database["public"]["Enums"]["methode_localisation"]
            | null
          payee_at: string | null
          restaurant_id: string
          statut: Database["public"]["Enums"]["statut_commande"]
          total_articles: number
          total_commande: number
          vu_at: string | null
        }
        Insert: {
          annulee_at?: string | null
          annulee_par?: string | null
          client_id: string
          cout_livraison: number
          created_at?: string
          delai_livraison_max_min?: number | null
          delai_livraison_min_min?: number | null
          id?: string
          localisation_audio_url?: string | null
          localisation_url?: string | null
          methode_localisation?:
            | Database["public"]["Enums"]["methode_localisation"]
            | null
          payee_at?: string | null
          restaurant_id: string
          statut?: Database["public"]["Enums"]["statut_commande"]
          total_articles: number
          total_commande: number
          vu_at?: string | null
        }
        Update: {
          annulee_at?: string | null
          annulee_par?: string | null
          client_id?: string
          cout_livraison?: number
          created_at?: string
          delai_livraison_max_min?: number | null
          delai_livraison_min_min?: number | null
          id?: string
          localisation_audio_url?: string | null
          localisation_url?: string | null
          methode_localisation?:
            | Database["public"]["Enums"]["methode_localisation"]
            | null
          payee_at?: string | null
          restaurant_id?: string
          statut?: Database["public"]["Enums"]["statut_commande"]
          total_articles?: number
          total_commande?: number
          vu_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commandes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_notes"
            referencedColumns: ["restaurant_id"]
          },
        ]
      }
      historique_paiements_solde: {
        Row: {
          created_at: string
          id: string
          montant: number
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          montant: number
          restaurant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          montant?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historique_paiements_solde_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historique_paiements_solde_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_notes"
            referencedColumns: ["restaurant_id"]
          },
        ]
      }
      parametres_admin: {
        Row: {
          id: number
          mot_de_passe_admin_hash: string
          prix_par_commande_payee: number
          prix_promotion: number
          updated_at: string
        }
        Insert: {
          id?: number
          mot_de_passe_admin_hash: string
          prix_par_commande_payee?: number
          prix_promotion?: number
          updated_at?: string
        }
        Update: {
          id?: number
          mot_de_passe_admin_hash?: string
          prix_par_commande_payee?: number
          prix_promotion?: number
          updated_at?: string
        }
        Relationships: []
      }
      plats: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          ingredients: string | null
          nom: string
          nombre_commandes: number
          nombre_notes: number
          note_moyenne: number
          photo_url: string | null
          prix: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          ingredients?: string | null
          nom: string
          nombre_commandes?: number
          nombre_notes?: number
          note_moyenne?: number
          photo_url?: string | null
          prix: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          ingredients?: string | null
          nom?: string
          nombre_commandes?: number
          nombre_notes?: number
          note_moyenne?: number
          photo_url?: string | null
          prix?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plats_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plats_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_notes"
            referencedColumns: ["restaurant_id"]
          },
        ]
      }
      promotions: {
        Row: {
          actif: boolean
          boisson_id: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          media_url: string
          plat_id: string | null
          restaurant_id: string
          type_media: Database["public"]["Enums"]["type_media"]
        }
        Insert: {
          actif?: boolean
          boisson_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          media_url: string
          plat_id?: string | null
          restaurant_id: string
          type_media: Database["public"]["Enums"]["type_media"]
        }
        Update: {
          actif?: boolean
          boisson_id?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          media_url?: string
          plat_id?: string | null
          restaurant_id?: string
          type_media?: Database["public"]["Enums"]["type_media"]
        }
        Relationships: [
          {
            foreignKeyName: "promotions_boisson_id_fkey"
            columns: ["boisson_id"]
            isOneToOne: false
            referencedRelation: "boissons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_plat_id_fkey"
            columns: ["plat_id"]
            isOneToOne: false
            referencedRelation: "plats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_notes"
            referencedColumns: ["restaurant_id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          delai_livraison_max_min: number
          delai_livraison_min_min: number
          horaire_fermeture: string
          horaire_ouverture: string
          id: string
          logo_url: string | null
          motif_suspension: string | null
          nom: string
          prix_livraison: number
          quartier: string
          restaurateur_id: string
          solde_admin: number
          statut: Database["public"]["Enums"]["statut_restaurant"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          delai_livraison_max_min: number
          delai_livraison_min_min: number
          horaire_fermeture: string
          horaire_ouverture: string
          id?: string
          logo_url?: string | null
          motif_suspension?: string | null
          nom: string
          prix_livraison?: number
          quartier: string
          restaurateur_id: string
          solde_admin?: number
          statut?: Database["public"]["Enums"]["statut_restaurant"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          delai_livraison_max_min?: number
          delai_livraison_min_min?: number
          horaire_fermeture?: string
          horaire_ouverture?: string
          id?: string
          logo_url?: string | null
          motif_suspension?: string | null
          nom?: string
          prix_livraison?: number
          quartier?: string
          restaurateur_id?: string
          solde_admin?: number
          statut?: Database["public"]["Enums"]["statut_restaurant"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_restaurateur_id_fkey"
            columns: ["restaurateur_id"]
            isOneToOne: false
            referencedRelation: "restaurateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurateurs: {
        Row: {
          created_at: string
          id: string
          mot_de_passe_hash: string
          nom: string
          numero: string
          prenom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mot_de_passe_hash: string
          nom: string
          numero: string
          prenom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mot_de_passe_hash?: string
          nom?: string
          numero?: string
          prenom?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions_client: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          id?: string
          token: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_restaurateur: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          restaurateur_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          restaurateur_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          restaurateur_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_restaurateur_restaurateur_id_fkey"
            columns: ["restaurateur_id"]
            isOneToOne: false
            referencedRelation: "restaurateurs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurants_notes: {
        Row: {
          nombre_notes: number | null
          note_moyenne: number | null
          restaurant_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      annuler_commandes_expirees: { Args: never; Returns: undefined }
      compter_annulations_jour: {
        Args: { p_restaurant_id: string }
        Returns: number
      }
      enregistrer_note_article: {
        Args: { p_commande_article_id: string; p_note: number }
        Returns: undefined
      }
      hash_password: { Args: { plain: string }; Returns: string }
      incrementer_solde: {
        Args: { p_montant: number; p_restaurant_id: string }
        Returns: undefined
      }
      verify_password: {
        Args: { hashed: string; plain: string }
        Returns: boolean
      }
    }
    Enums: {
      methode_localisation: "audio" | "position"
      statut_commande: "en_cours" | "vu" | "payee" | "annulee"
      statut_restaurant: "actif" | "suspendu"
      type_article: "plat" | "boisson"
      type_media: "image" | "video"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      methode_localisation: ["audio", "position"],
      statut_commande: ["en_cours", "vu", "payee", "annulee"],
      statut_restaurant: ["actif", "suspendu"],
      type_article: ["plat", "boisson"],
      type_media: ["image", "video"],
    },
  },
} as const
