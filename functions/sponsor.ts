import * as jose from "jose";
import { mongoApi } from "./account";

class Signer {
  private privateKey: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }

  async sign(userInfo: UserInfo): Promise<string> {
    const secret = new TextEncoder().encode(this.privateKey);
    const alg = "HS512";
    const payload = {
      iss: "sponsor_pid:" + userInfo.siteId,
      sub: userInfo.userId,
      iat: Math.floor(Date.now() / 1000),
      name: userInfo.name || userInfo.email || "",
      email: userInfo.email || "",
      avatar: userInfo.avatar || "",
    };
    // console.log("payload", payload);

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg, typ: "JWT" })
      .sign(secret);

    return jwt;
  }

  async isSponsor(userId: string): Promise<boolean> {
    const url = `https://sponsor-api.nitropay.com/v1/users/${userId}/subscription`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: this.privateKey,
      },
    });
    try {
      const body = (await response.json()) as SubscriptionInfo;
      return body.status === "active";
    } catch (_ex) {
      return false;
    }
  }
}

export interface UserInfo {
  siteId: string;
  userId: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export interface SubscriptionInfo {
  tier: {
    id: number;
    name: string;
    description: string;
    benefits: {
      id: number;
      name: string;
      description: string;
    }[];
    order: number;
  };
  status: string;
  subscribedUntil: string;
}

type E = {
  MONGO_URL: string;
  DATABASE_NAME: string;
  MONGO_API_KEY: string;
  NITROPAY_PRIVATE_KEY: string;
};

export const onRequestGet: PagesFunction<E> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  if (!email) {
    return new Response("No email found in token", { status: 400 });
  }
  console.log("Fetching token for user:", email);

  // Get TWL account ID
  const json = await mongoApi(env, "accounts", "findOne", {
    filter: { email },
  });
  const twlId = json?.document?._id;
  if (!twlId) {
    return new Response("No TWL account found", { status: 400 });
  }

  try {
    const signer = new Signer(env.NITROPAY_PRIVATE_KEY);
    const [teacherJson, token] = await Promise.all([
      mongoApi(env, "teachers", "findOne", {
        filter: { twlId: { $oid: twlId } },
      }),
      signer.sign({
        userId: twlId,
        siteId: "58",
      }),
    ]);
    const isTeacher = !!teacherJson?.document;

    // If stats, return stats
    const clubMember = signer.isSponsor(twlId);
    return new Response(JSON.stringify({ token, clubMember, isTeacher }), {
      status: 200,
      statusText: "Stats found",
    });
  } catch (ex) {
    console.error(ex);
    return new Response(JSON.stringify({ message: "Error signing token" }), {
      status: 400,
    });
  }
};
