import { tokensJson } from "./tokens/index.js";
import { VERSION } from "./version.js";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const routes: Record<string, () => unknown> = {
  "/health": () => ({ ok: true, name: "agentic-design", version: VERSION }),
  "/api/v1/tokens": () => tokensJson(),
};

export default {
  async fetch(request: Request): Promise<Response> {
    const route = routes[new URL(request.url).pathname];
    if (!route) return json({ error: "not found" }, 404);
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
    return json(route());
  },
};
