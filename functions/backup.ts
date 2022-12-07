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
    const document = await mongoResponse.json();
    console.log({ document });
    if (document) {
      return new Response(
        JSON.stringify({
          message: "Backup saved!",
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
    const document = await mongoResponse.json();
    console.log({ document });
    if (document) {
      return new Response(
        JSON.stringify({
          document,
          message: "Backup deleted.",
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
