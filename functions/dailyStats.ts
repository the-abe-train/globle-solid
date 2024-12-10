import { mongoApi } from "./account";

type E = {
  MONGO_URL: string;
  DATABASE_NAME: string;
  MONGO_API_KEY: string;
};

export const onRequestPut: PagesFunction<E> = async (context) => {
  // Parse email from token
  const { request, env } = context;
  const body = await request.json();
  const stats = body as DailyStats;

  const output = await mongoApi(env, "globle-daily", "updateOne", {
    filter: { email: stats.email, date: stats.date },
    update: { $set: stats },
    upsert: true,
  });
  console.log("Daily stats update:", output);

  return new Response(
    JSON.stringify({
      message: "Stats updated",
    }),
    { status: 200, statusText: "Stats updated" }
  );
};
