import * as jose from 'jose';
import { MONGO_GATEWAY_BASE, GATEWAY_GAME_NAME } from '../src/util/api';

function json(body: Record<string, any>, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

class Signer {
  private privateKey: string;

  constructor(privateKey: string) {
    this.privateKey = privateKey;
  }

  async sign(userInfo: UserInfo): Promise<string> {
    const secret = new TextEncoder().encode(this.privateKey);
    const alg = 'HS512';
    const payload = {
      iss: 'sponsor_pid:' + userInfo.siteId,
      sub: userInfo.userId,
      iat: Math.floor(Date.now() / 1000),
      name: userInfo.name || userInfo.email || '',
      email: userInfo.email || '',
      avatar: userInfo.avatar || '',
    };
    console.log('payload', payload);

    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg, typ: 'JWT' })
      .sign(secret);

    return jwt;
  }

  async isSponsor(userId: string): Promise<boolean> {
    const url = `https://sponsor-api.nitropay.com/v1/users/${userId}/subscription`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: this.privateKey,
      },
    });
    try {
      const body = (await response.json()) as SubscriptionInfo;
      console.log('Subscription info:', body);
      return body.status === 'active';
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
  const email = url.searchParams.get('email') || '';
  if (!email) {
    return json({ message: 'No email provided' }, { status: 400 });
  }
  console.log('Fetching token for user:', email);

  // Get TWL account ID via gateway
  const acctUrl = `${MONGO_GATEWAY_BASE}/account?email=${encodeURIComponent(email)}`;
  const acctResp = await fetch(acctUrl, {
    headers: { 'X-Game-Name': GATEWAY_GAME_NAME },
  });
  if (!acctResp.ok) {
    console.error('Failed to fetch account:', acctResp.status, acctResp.statusText);
    return json({ message: 'Failed to look up account' }, { status: 400 });
  }
  let twlId: string | undefined;
  try {
    const a = (await acctResp.json()) as any;
    // console.log('Account data:', a);
    // Accept possible shapes
    twlId = a.twlId;
    console.log('Found TWL ID:', twlId);
  } catch {}
  if (!twlId) {
    return json({ message: 'No TWL account found' }, { status: 400 });
  }

  try {
    const signer = new Signer(env.NITROPAY_PRIVATE_KEY);

    // Check teacher via gateway by email
    const teacherUrl = `${MONGO_GATEWAY_BASE}/teachers?email=${encodeURIComponent(email)}`;
    const teacherResp = await fetch(teacherUrl, {
      headers: { 'X-Game-Name': GATEWAY_GAME_NAME },
    });
    let isTeacher = false;
    if (teacherResp.ok) {
      try {
        const t = (await teacherResp.json()) as {
          exists?: boolean;
          twlId?: string;
          email?: string;
          matchedBy?: 'twlId' | 'email';
        };
        isTeacher = Boolean(t?.exists);
      } catch {}
    }

    const token = await signer.sign({
      userId: twlId,
      siteId: '58',
    });
    console.log(`Generated token for user ${email}: ${token}`);

    const clubMember = await signer.isSponsor(twlId);
    console.log(
      `User ${email} (TWL ID: ${twlId}) club member: ${clubMember}, teacher: ${isTeacher}`,
    );
    return json({ token, clubMember, isTeacher }, { status: 200 });
  } catch (ex) {
    console.error(ex);
    return json({ message: 'Error signing token' }, { status: 400 });
  }
};
