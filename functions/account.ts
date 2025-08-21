import { GATEWAY_GAME_NAME, MONGO_GATEWAY_BASE } from "../src/util/api";

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const target = `${MONGO_GATEWAY_BASE}/account${url.search}`;

  // Helper: ensure a value is ISO datetime if present
  const normalizeLastWin = (val: unknown): string | unknown => {
    if (typeof val !== "string") return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toISOString();
  };

  // Helper: walk common shapes and normalize stats.lastWin
  const normalizePayload = (obj: any): any => {
    try {
      if (!obj || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) return obj.map((el) => normalizePayload(el));
      if ("lastWin" in obj) obj.lastWin = normalizeLastWin(obj.lastWin);
      if (
        obj.stats &&
        typeof obj.stats === "object" &&
        "lastWin" in obj.stats
      ) {
        obj.stats.lastWin = normalizeLastWin(obj.stats.lastWin);
      }
      if (obj.document?.stats?.lastWin) {
        obj.document.stats.lastWin = normalizeLastWin(
          obj.document.stats.lastWin
        );
      }
      if (Array.isArray(obj.documents)) {
        obj.documents = obj.documents.map((d: any) => normalizePayload(d));
      }
    } catch {}
    return obj;
  };

  const headers = new Headers(request.headers);
  headers.set("X-Game-Name", GATEWAY_GAME_NAME);

  // If there's a body, default to JSON unless already set
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const init: RequestInit = { method: request.method, headers };
  if (hasBody) {
    // Attempt to JSON-normalize outbound body
    try {
      const text = await request.text();
      const parsed = JSON.parse(text);
      const normalized = normalizePayload(parsed);
      init.body = JSON.stringify(normalized);
    } catch {
      // Fallback to raw bytes if not JSON
      init.body = await request.arrayBuffer();
    }
  }

  const resp = await fetch(target, init);

  // If JSON response, normalize any stats.lastWin fields before returning
  const respCT = resp.headers.get("Content-Type") || "";
  if (respCT.includes("application/json")) {
    try {
      const data = await resp.clone().json();
      const normalized = normalizePayload(data);
      const newHeaders = new Headers(resp.headers);
      // Content-Length will change; let the runtime recalc by deleting it
      newHeaders.delete("Content-Length");
      return new Response(JSON.stringify(normalized), {
        status: resp.status,
        statusText: resp.statusText,
        headers: newHeaders,
      });
    } catch {
      // If parsing fails, return original response
      return resp;
    }
  }

  return resp;
};

