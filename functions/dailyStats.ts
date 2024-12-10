import { mongoApi } from "./account";

type E = {
  MONGO_URL: string;
  DATABASE_NAME: string;
  MONGO_API_KEY: string;
};

export const onRequestPut: PagesFunction<E> = async (context) => {
  const { request, env } = context;
  const body = await request.json();
  const stats = body as DailyStats;
  const { email, date } = stats;
  // If not, check if TWL account exists
  const json = await mongoApi(env, "accounts", "findOne", {
    filter: { email },
  });
  // console.log("Exising TWL account:", json);
  let twlId = json?.document?._id;
  console.log({ twlId });

  // Parse email from token
  const output = await mongoApi(env, "globle-daily", "updateOne", {
    filter: { email, date },
    update: { $set: { ...stats, twlId: { $oid: twlId } } },
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
