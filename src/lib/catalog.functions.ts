import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchPromotions, fetchRestaurantDetail, fetchRestaurants } from "./catalog.server";

export const listRestaurantsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchRestaurants();
});

export const listPromotionsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchPromotions();
});

export const getRestaurantFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    return await fetchRestaurantDetail(data.id);
  });
