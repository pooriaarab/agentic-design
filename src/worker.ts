import { tokensJson } from "./tokens/index.js";
import { VERSION } from "./version.js";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
    if (pathname === "/health") return json({ ok: true, pack: "agentic-design", version: VERSION });
    if (pathname === "/api/v1/tokens") return json(tokensJson());
    return json({ error: "not found" }, 404);
  },
};
