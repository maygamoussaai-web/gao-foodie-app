import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { getSessionToken } from "./lib/session-token";

// Ajoute le jeton de session aux appels serveur quand le cookie httpOnly ne
// peut pas être renvoyé (aperçu en iframe / cookies tiers bloqués).
const sessionHeaderMiddleware = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = getSessionToken();
    return token ? next({ headers: { "x-gf-session": token } }) : next();
  },
);

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
  functionMiddleware: [sessionHeaderMiddleware],
}));
