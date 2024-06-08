import jwtDecode from "jwt-decode";

type E = {
  MONGO_URL: string;
  DATABASE_NAME: string;
  MONGO_API_KEY: string;
};

export async function mongoApi(
  env: E,
  collection: string,
  action: string,
  query: Record<string, any>
) {
  // console.log(`\nMongoDB API ${action} ${collection} with query:`, query);
  let api =
    "https://data.mongodb-api.com/app/data-dmkae/endpoint/data/v1/action/";
  api += action;
  const body: Record<string, any> = {
    dataSource: "Web2",
    database: "trainwreck-labs",
    collection,
    ...query,
  };
  // console.log(body);
  const mongoResponse = await fetch(api, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/ejson",
      "Access-Control-Request-Headers": "*",
      "api-key": env.MONGO_API_KEY,
    },
  });
  // console.log(mongoResponse.status, mongoResponse.statusText);
  const json = (await mongoResponse.json()) as Record<string, any>;
  // console.log("MongoDB API response:", json);
  return json;
}

export const onRequestPost: PagesFunction<E> = async (context) => {
  // Parse email
  const { request, env } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const loginMethod = "google"; // TODO: add Discord login

  // Check if game account exists
  const gameAccount = await mongoApi(env, "globle", "findOne", {
    filter: { email },
  });

  // If so, return account stats
  if (gameAccount?.document) {
    return new Response(JSON.stringify(gameAccount.document), {
      status: 200,
      statusText: "Stats found",
    });
  }

  // If not, check if TWL account exists
  const json = await mongoApi(env, "accounts", "findOne", {
    filter: { email },
  });
  // console.log("Exising TWL account:", json);
  let twlId = json?.document?._id;
  console.log({ twlId });

  // If so, add game account to TWL account
  const globleUserId = crypto.randomUUID();
  if (twlId) {
    console.log("Adding game account to TWL account");
    const twlResponse = await mongoApi(env, "accounts", "updateOne", {
      filter: { _id: { $oid: twlId } },
      update: {
        $push: {
          accounts: {
            game: "Globle",
            _id: globleUserId,
            connected: { $date: new Date() },
          },
        },
        $addToSet: { loginMethods: loginMethod },
      },
    });
    // console.log(twlResponse);
  }

  // If not, create new TWL account, and get inserted ID
  if (!twlId) {
    console.log("Creating new TWL account");
    const twlResponse = await mongoApi(env, "accounts", "insertOne", {
      document: {
        email,
        created: { $date: new Date() },
        loginMethods: [loginMethod],
        accounts: [
          {
            game: "Globle",
            _id: globleUserId,
            connected: { $date: new Date() },
          },
        ],
      },
    });
    twlId = twlResponse?.insertedId;
  }

  // If still no TWL account, return error
  if (!twlId) {
    console.error("Failed to create TWL account", { twlId, email });
    return new Response(
      JSON.stringify({
        message: "Failed to create TWL account",
      }),
      { status: 400, statusText: "Failed to create TWL account" }
    );
  }

  // Get stats data from req body
  const stats = (await request.json()) as Record<string, any>;
  if (!stats.lastWin.$date) stats.lastWin = { $date: new Date(stats.lastWin) };

  // Create new game account with TWL account ID
  console.log("Creating new Globle game document");
  await mongoApi(env, "globle", "insertOne", {
    document: {
      _id: globleUserId,
      email,
      twlId: { $oid: twlId },
      stats,
    },
  });
  return new Response(
    JSON.stringify({
      message: "Account created",
    }),
    { status: 200, statusText: "Account created" }
  );
};

export const onRequestPut: PagesFunction<E> = async (context) => {
  // Parse email from token
  const { request, env } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";

  //Put stats to existing account
  const stats = (await request.json()) as Record<string, any>;
  stats.lastWin = { $date: new Date(stats.lastWin) };

  // If games won > 2000, don't PUT
  if (stats?.gamesWon > 2000) {
    console.log("Games won > 2000, not updating");
    return new Response(
      JSON.stringify({
        message: "Games won > 2000, not updating",
      }),
      { status: 200, statusText: "Games won > 2000, not updating" }
    );
  }

  const output = await mongoApi(env, "globle", "updateOne", {
    filter: { email },
    update: { $set: { stats } },
  });
  if (!output?.matchedCount) {
    console.log("Account not found");
    await fetch(url.origin + "/account?email=" + email, {
      method: "POST",
      body: JSON.stringify(stats),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  return new Response(
    JSON.stringify({
      message: "Stats updated",
    }),
    { status: 200, statusText: "Stats updated" }
  );
};

export const onRequestDelete: PagesFunction<E> = async (context) => {
  // Parse email from token
  const { request, env } = context;
  const url = new URL(request.url);
  const tokenString = url.searchParams.get("token") || "";
  const email = jwtDecode<Token>(tokenString).email;

  //Delete account
  await mongoApi(env, "globle", "deleteOne", {
    filter: { email },
  });

  return new Response(
    JSON.stringify({
      message: "Account deleted.",
    }),
    { status: 200, statusText: "Account deleted" }
  );
};

export const onRequestGet: PagesFunction<E> = async (context) => {
  // Parse email from token
  const { request, env } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";

  // Get stats from account
  const json = await mongoApi(env, "globle", "findOne", {
    filter: { email },
  });

  // If no stats, return error
  if (!json?.document) {
    return new Response(
      JSON.stringify({
        message: "No document found",
      }),
      { status: 400, statusText: "No document found" }
    );
  }

  // If stats, return stats
  return new Response(JSON.stringify(json.document), {
    status: 200,
    statusText: "Stats found",
  });
};
