import * as jose from "jose";
import { MONGO_GATEWAY_BASE, GATEWAY_GAME_NAME } from "../src/util/api";

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

type ExtendedE = {
  NITROPAY_PRIVATE_KEY: string;
};

export const onRequestGet: PagesFunction<ExtendedE> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  if (!email) {
    return new Response("No email found in token", { status: 400 });
  }
  console.log("Fetching token for user:", email);

  // Get TWL account ID via gateway
  const acctUrl = `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(
    email
  )}`;
  const acctResp = await fetch(acctUrl, {
    headers: { "X-Game-Name": GATEWAY_GAME_NAME },
  });
  if (!acctResp.ok) {
    return new Response("Failed to look up account", { status: 400 });
  }
  let twlId: string | undefined;
  try {
    const a = (await acctResp.json()) as any;
    // Accept possible shapes
    if (a?.document?._id) twlId = a.document._id;
    else if (Array.isArray(a?.documents) && a.documents[0]?._id)
      twlId = a.documents[0]._id;
    else if (Array.isArray(a) && a[0]?._id) twlId = a[0]._id;
  } catch {}
  if (!twlId) {
    return new Response("No TWL account found", { status: 400 });
  }

  try {
    const signer = new Signer(env.NITROPAY_PRIVATE_KEY);

    // Check teacher via gateway by email
    const teacherUrl = `${MONGO_GATEWAY_BASE}/teachers?email=${encodeURIComponent(
      email
    )}`;
    const teacherResp = await fetch(teacherUrl, {
      headers: { "X-Game-Name": GATEWAY_GAME_NAME },
    });
    let isTeacher = false;
    if (teacherResp.ok) {
      try {
        const t = (await teacherResp.json()) as {
          exists?: boolean;
          twlId?: string;
          email?: string;
          matchedBy?: "twlId" | "email";
        };
        isTeacher = Boolean(t?.exists);
      } catch {}
    }

    const token = await signer.sign({
      userId: twlId,
      siteId: "58",
    });

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

