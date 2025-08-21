import { GATEWAY_GAME_NAME, MONGO_GATEWAY_BASE } from "../src/util/api";

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const target = `${MONGO_GATEWAY_BASE}/dailyStats${url.search}`;

  const headers = new Headers(request.headers);
  headers.set("X-Game-Name", GATEWAY_GAME_NAME);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const init: RequestInit = { method: request.method, headers };
  if (hasBody) init.body = await request.arrayBuffer();

  return fetch(target, init);
};

