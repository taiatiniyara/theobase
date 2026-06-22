import { getMe } from "./api";
import { goto } from "$app/navigation";

let cachedRoles: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;

export async function getRoles(): Promise<string[]> {
  if (cachedRoles) return cachedRoles;

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const profile = (await getMe()) as Record<string, unknown> | null;
      const roles: string[] = (profile?.roles as string[]) || [];
      cachedRoles = roles;
      return roles;
    } catch {
      cachedRoles = null;
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function clearRoles() {
  cachedRoles = null;
  fetchPromise = null;
}

export async function requireRole(
  ...requiredRoles: string[]
): Promise<boolean> {
  try {
    const roles = await getRoles();
    if (roles.length === 0) {
      goto("/");
      return false;
    }

    const hasRole = requiredRoles.some((r) => roles.includes(r));
    if (!hasRole) {
      goto("/dashboard");
      return false;
    }

    return true;
  } catch {
    goto("/");
    return false;
  }
}
