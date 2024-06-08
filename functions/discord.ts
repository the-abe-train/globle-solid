type E = {
  MONGO_URL: string;
  DATABASE_NAME: string;
  MONGO_API_KEY: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_SECRET: string;
  DISCORD_STATE: string;
};

export const onRequestGet: PagesFunction<E> = async (context) => {
  const { request, env } = context;

  const API_ENDPOINT = "https://discord.com/api/v10";
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/discord`;
  console.log(`Redirect URI: ${redirectUri}`);
  const code = url.searchParams.get("code") ?? "";

  // "State" is a security measure to prevent CSRF attacks
  const state = url.searchParams.get("state") ?? "";
  console.log(`State: ${state}, expected: ${env.DISCORD_STATE}`);

  if (parseInt(state) !== parseInt(env.DISCORD_STATE)) {
    return new Response("Security check failed");
  }

  const fd = new FormData();
  fd.append("client_id", env.DISCORD_CLIENT_ID);
  fd.append("client_secret", env.DISCORD_SECRET);
  fd.append("grant_type", "authorization_code");
  fd.append("code", code);
  fd.append("redirect_uri", redirectUri);
  console.log(fd);

  const tokenResponse = await fetch(`${API_ENDPOINT}/oauth2/token`, {
    method: "POST",
    body: fd,
  });

  const tokenJson = (await tokenResponse.json()) as Record<string, string>;

  const access_token = tokenJson.access_token;

  const userDataResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userData = (await userDataResponse.json()) as Record<string, string>;
  console.log(userData);

  const email = userData["email"];

  const { origin } = url;

  const destinationURL = `${origin}/settings/?email=${email}`;
  // return Response.redirect(destinationURL, 301);
  return new Response(null, {
    status: 301, // Use 307 or 308 for temporary redirects without method change
    headers: {
      Location: destinationURL,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
};
