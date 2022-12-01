import { Handler } from "@netlify/functions";
import { Event } from "@netlify/functions/dist/function/event";
import dayjs from "dayjs";
import { OAuth2Client } from "google-auth-library";
import jwtDecode from "jwt-decode";
import { Db, MongoClient } from "mongodb";
import invariant from "tiny-invariant";

export async function verify(token: string) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    console.log({ ticket });
    if (!ticket) throw "Token not verfied.";
    const userId = ticket.getUserId();
    return userId;
  } catch (e) {
    return null;
  }
}

function convertStats(raw: Stats) {
  return {
    ...raw,
    lastWin: dayjs(raw.lastWin).toDate(),
  };
}

async function get(event: Event, db: Db) {
  const tokenString = event.queryStringParameters?.token || "";
  const userId = await verify(tokenString);
  if (!userId) return { statusCode: 205 };
  const email = jwtDecode<Token>(tokenString).email;
  const document = await db.collection("users").findOne({ email });
  console.log({ document });
  if (document) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        document,
      }),
    };
  }
  return {
    statusCode: 204,
  };
}

async function put(event: Event, db: Db) {
  const body = JSON.parse(event.body || "{}");
  const tokenString = body.token as string;
  // invariant(tokenString, "No token submitted")
  if (!tokenString)
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Failed to save backup. Please contact support.",
      }),
    };
  const stats = body.stats as Stats;
  const parsedStats = convertStats(stats);
  const userId = await verify(tokenString);
  if (!userId) return { statusCode: 205 };
  console.log({ userId });
  const email = jwtDecode<Token>(tokenString).email;
  const data = {
    userId,
    email,
    ...parsedStats,
  };
  invariant(userId, "Token error.");
  const udpateResult = await db
    .collection("users")
    .updateOne({ email }, { $set: data }, { upsert: true });
  console.log(udpateResult);
  if (udpateResult.acknowledged) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Backup saved!" }),
    };
  }
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: "Failed to save backup. Please contact support.",
    }),
  };
}

async function del(event: Event, db: Db) {
  const tokenString = event.queryStringParameters?.token || "";
  await verify(tokenString);
  const email = jwtDecode<Token>(tokenString).email;
  const deleteResult = await db.collection("users").deleteOne({ email });
  console.log(deleteResult);
  if (deleteResult.acknowledged) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Backup deleted.",
      }),
    };
  }
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: "Failed to delete backup. Please contact support.",
    }),
  };
}

const handler: Handler = async (event, context) => {
  const MONGO_URL = process.env.MONGO_URL || "";
  const DATABASE_NAME = process.env.DATABASE_NAME || "";
  const client = new MongoClient(MONGO_URL);
  const db = client.db(DATABASE_NAME);

  try {
    switch (event.httpMethod) {
      case "PUT":
        return await put(event, db);
      case "GET":
        return await get(event, db);
      case "DELETE":
        return await del(event, db);
      default:
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Internal server error",
          }),
        };
    }
  } catch (error) {
    console.error(error);
    const message = "Internal server error";
    return {
      statusCode: 500,
      body: JSON.stringify({
        message,
        error,
      }),
    };
  }
};

export { handler };
