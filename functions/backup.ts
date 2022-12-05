// import { Event } from "@netlify/functions/dist/function/event";
import dayjs from "dayjs";
// import { OAuth2Client } from "google-auth-library";
import jwtDecode from "jwt-decode";
// import { Db, MongoClient } from "mongodb";
import invariant from "tiny-invariant";

type E = {
  MONGO_URL: string;
  DATABASE_NAME: string;
  MONGO_API_KEY: string;
};

function convertStats(raw: Stats) {
  return {
    ...raw,
    lastWin: dayjs(raw.lastWin).toDate(),
  };
}

export const onRequestGet: PagesFunction<E> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const tokenString = url.searchParams.get("token") || "";
  const email = jwtDecode<Token>(tokenString).email;
  console.log({ email });
  const api =
    "https://data.mongodb-api.com/app/data-dmkae/endpoint/data/beta/action/findOne";
  const body = JSON.stringify({
    dataSource: "Web2",
    database: "countries",
    collection: "users",
    filter: {
      email,
    },
  });
  const mongoResponse = await fetch(api, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "api-key": env.MONGO_API_KEY,
    },
  });
  try {
    console.log("Get request", { mongoResponse });
    const document = await mongoResponse.json();
    console.log(document);
    if (document) {
      return new Response(JSON.stringify(document));
    }
  } catch (e) {
    console.error(e);
  }
  return new Response(
    JSON.stringify({
      message: "No document found",
    }),
    { status: 400, statusText: "No document found" }
  );
};

export const onRequestPut: PagesFunction<E> = async (context) => {
  const { request, env } = context;
  const reqBody = JSON.parse(await request.clone().text());
  console.log(reqBody);
  const url = new URL(request.url);
  const tokenString = url.searchParams.get("token") || "";
  // invariant(tokenString, "No token submitted")
  if (!tokenString)
    return new Response(
      JSON.stringify({
        message: "No token",
      }),
      { status: 400, statusText: "No token" }
    );
  const stats = reqBody.stats as Stats;
  const parsedStats = convertStats(stats);
  // const userId = await verify(tokenString);
  // if (!userId) return { statusCode: 205 };
  // console.log({ userId });
  const email = jwtDecode<Token>(tokenString).email;
  const data = {
    email,
    ...parsedStats,
  };
  const api =
    "https://data.mongodb-api.com/app/data-dmkae/endpoint/data/beta/action/updateOne";
  const body = {
    dataSource: "Web2",
    database: "countries",
    collection: "users",
    filter: { email },
    // document: data,
    update: { $set: data },
    upsert: true,
  };
  console.log({ body });
  const mongoResponse = await fetch(api, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "api-key": env.MONGO_API_KEY,
    },
  });
  try {
    console.log({ mongoResponse });
    console.log(JSON.stringify(mongoResponse.body));
    const document = await mongoResponse.json();
    console.log({ document });
    if (document) {
      return new Response(
        JSON.stringify({
          document,
        })
      );
    }
  } catch (e) {
    console.error(e);
  }
  return new Response(
    JSON.stringify({
      message: "Server error",
    }),
    { status: 500, statusText: "Server error" }
  );
};

export const onRequestDelete: PagesFunction<E> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const tokenString = url.searchParams.get("token") || "";
  const email = jwtDecode<Token>(tokenString).email;
  console.log({ email });
  const api =
    "https://data.mongodb-api.com/app/data-dmkae/endpoint/data/beta/action/deleteOne";
  const body = JSON.stringify({
    dataSource: "Web2",
    database: "countries",
    collection: "users",
    filter: { email },
  });
  const mongoResponse = await fetch(api, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "api-key": env.MONGO_API_KEY,
    },
  });
  try {
    console.log("Del request", { mongoResponse });
    const document = await mongoResponse.json();
    console.log({ document });
    if (document) {
      return new Response(
        JSON.stringify({
          document,
        })
      );
    }
  } catch (e) {
    console.error(e);
  }
  return new Response(
    JSON.stringify({
      message: "No document found",
    }),
    { status: 400, statusText: "No document found" }
  );
};

// const handler: Handler = async (event, context) => {
//   const MONGO_URL = process.env.MONGO_URL || "";
//   const DATABASE_NAME = process.env.DATABASE_NAME || "";
//   const client = new MongoClient(MONGO_URL);
//   const db = client.db(DATABASE_NAME);

//   try {
//     switch (event.httpMethod) {
//       case "PUT":
//         return await put(event, db);
//       case "GET":
//         return await get(event, db);
//       case "DELETE":
//         return await del(event, db);
//       default:
//         return {
//           statusCode: 500,
//           body: JSON.stringify({
//             message: "Internal server error",
//           }),
//         };
//     }
//   } catch (error) {
//     console.error(error);
//     const message = "Internal server error";
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         message,
//         error,
//       }),
//     };
//   }
// };

// export { handler };
