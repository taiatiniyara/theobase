import { verifyToken } from "./auth";

export interface AuthContext {
  userId: string;
  role: string;
  conferenceId?: number;
  churchId?: number;
}

async function extractToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam) return tokenParam;
  return null;
}

export async function authenticate(request: Request, env: Env): Promise<AuthContext | Response> {
  const token = await extractToken(request);
  if (!token) {
    return json({ error: "Authentication required" }, 401);
  }
  try {
    const payload = await verifyToken(token, env.JWT_SECRET);
    if (payload.type !== "access") {
      return json({ error: "Invalid token type" }, 401);
    }
    return {
      userId: payload.sub,
      role: payload.role,
      conferenceId: payload.conferenceId,
      churchId: payload.churchId,
    };
  } catch {
    return json({ error: "Invalid or expired token" }, 401);
  }
}

export function authorize(auth: AuthContext, allowedRoles: string[]): Response | null {
  if (!allowedRoles.includes(auth.role)) {
    return json({ error: "Insufficient permissions" }, 403);
  }
  return null;
}

export function requireConference(auth: AuthContext, conferenceId: number): Response | null {
  if (auth.conferenceId !== conferenceId && auth.role !== "sysadmin") {
    return json({ error: "Access denied — not your conference" }, 403);
  }
  return null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
