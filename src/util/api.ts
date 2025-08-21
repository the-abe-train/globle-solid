
export const accountEndpoint = (email: string) =>
  `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(email)}`;

// External Mongo gateway base URL for API endpoints
export const MONGO_GATEWAY_BASE =
  "https://mongo-gateway-globle.twl-early-access.deno.net";
export const DAILY_STATS_ENDPOINT = `${MONGO_GATEWAY_BASE}/dailyStats`;
export const SUBSCRIBE_ENDPOINT = `${MONGO_GATEWAY_BASE}/subscribe`;

// Required header value for gateway identification
export const GATEWAY_GAME_NAME = "Globle";

// Helper to merge headers ensuring X-Game-Name is present
export function withGatewayHeaders(init?: RequestInit): RequestInit {
  const existing = init?.headers || {};
  const headers = new Headers(existing as any);
  // Always include game name header for gateway requests
  if (!headers.has("X-Game-Name")) {
    headers.set("X-Game-Name", GATEWAY_GAME_NAME);
  }
  // If sending a body, ensure Content-Type is JSON so the server can read it
  const hasBody = init && "body" in init && (init as any).body != null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return { ...(init || {}), headers };
}
