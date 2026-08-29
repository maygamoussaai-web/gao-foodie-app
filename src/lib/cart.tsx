import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "./types";

const STORAGE_KEY = "gaofood.cart.v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  totalArticles: number;
  totalLivraison: number;
  total: number;
  groups: { restaurant_id: string; restaurant_nom: string; prix_livraison: number; items: CartItem[] }[];
  add: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantite: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* panier illisible : on repart d'un panier vide */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.type_article}:${item.article_id}`;
    setItems((current) => {
      const existing = current.find((entry) => entry.key === key);
      if (existing) {
        return current.map((entry) =>
          entry.key === key
            ? { ...entry, quantite: Math.min(10, entry.quantite + item.quantite) }
            : entry,
        );
      }
      return [...current, { ...item, key }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantite: number) => {
    setItems((current) =>
      quantite <= 0
        ? current.filter((entry) => entry.key !== key)
        : current.map((entry) =>
            entry.key === key ? { ...entry, quantite: Math.min(10, quantite) } : entry,
          ),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((entry) => entry.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const groupsMap = new Map<string, CartContextValue["groups"][number]>();
    for (const item of items) {
      const group = groupsMap.get(item.restaurant_id) ?? {
        restaurant_id: item.restaurant_id,
        restaurant_nom: item.restaurant_nom,
        prix_livraison: item.prix_livraison,
        items: [],
      };
      group.items.push(item);
      groupsMap.set(item.restaurant_id, group);
    }
    const groups = [...groupsMap.values()];
    const totalArticles = items.reduce((sum, item) => sum + item.prix * item.quantite, 0);
    const totalLivraison = groups.reduce((sum, group) => sum + group.prix_livraison, 0);
    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantite, 0),
      totalArticles,
      totalLivraison,
      total: totalArticles + totalLivraison,
      groups,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart doit être utilisé dans CartProvider");
  return context;
}
