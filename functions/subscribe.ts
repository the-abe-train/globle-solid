import { mongoApi } from "./account";

type E = {
  MONGO_URL: string;
  DATABASE_NAME: string;
  MONGO_API_KEY: string;
  BEEHIIV_API_KEY: string;
};

export const onRequestPost: PagesFunction<E> = async (context) => {
  const { env, request } = context;
  const email = await request.text();
  const publicationId = "pub_3325f981-0abb-4e7b-b294-d8002235bf18";

  // Update twl document and get twl id
  let userId = "";
  try {
    const twlAccount = await mongoApi(env, "accounts", "findOne", {
      filter: { email },
    });
    console.log(twlAccount);
    userId = twlAccount?.document?._id;
  } catch (e) {
    console.error("Error: Failed to update twl document");
    console.error(e);
  }

  if (!userId) {
    console.error("Error: Failed to update twl document");
    return new Response("Failed to update twl document.", { status: 400 });
  }

  // Subscribe to newsletter
  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: "capitals",
          utm_medium: "website",
          referring_site: request.url,
          custom_fields: [{ name: "twlId", value: userId }],
        }),
      }
    );
    if (res.status === 201) {
      console.log("Already subscribed to newsletter");
      return new Response("Already subscribed to newsletter.");
    } else if (res.status !== 200) {
      const body = await res.json();
      console.log("Status: " + res.status);
      console.log(body);
      console.error("Failed to subscribe to newsletter");
      return new Response("Failed to subscribe to newsletter.");
    }

    // Update twl document
    await mongoApi(env, "accounts", "findOne", {
      filter: { email },
      update: { $set: { newsletter: true } },
    });
  } catch (e) {
    console.error("Error: Failed to subscribe to newsletter");
    console.error(e);
    return new Response("Failed to subscribe to newsletter.");
  }

  console.log("Signing up for newsletter");

  return new Response("Signed up for newsletter.");
};
