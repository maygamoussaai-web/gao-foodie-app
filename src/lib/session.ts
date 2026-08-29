import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { meFn } from "./auth.functions";
import type { Client } from "./types";

export const sessionQuery = {
  queryKey: ["session"] as const,
  queryFn: () => meFn(),
  staleTime: 60_000,
};

export function useSession() {
  return useQuery<Client | null>(sessionQuery);
}

/** Redirige vers l'authentification si aucune session valide. */
export function useRequireSession() {
  const navigate = useNavigate();
  const query = useSession();
  useEffect(() => {
    if (!query.isLoading && !query.data) {
      navigate({ to: "/bienvenue" });
    }
  }, [query.isLoading, query.data, navigate]);
  return query;
}

export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["session"] });
}
