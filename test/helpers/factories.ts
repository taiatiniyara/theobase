import { SELF } from "cloudflare:test";
import { jsonAuthHeaders } from "./auth";

export async function createMember(
  token: string,
  data: {
    churchId: number;
    fullName: string;
    householdId?: number;
    phone?: string;
    email?: string;
    gender?: string;
    dob?: string;
    baptismDate?: string;
    baptismType?: string;
  }
): Promise<{ id: number }> {
  const res = await SELF.fetch("http://localhost/api/members", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({
      churchId: data.churchId,
      fullName: data.fullName,
      householdId: data.householdId,
      phone: data.phone,
      email: data.email,
      gender: data.gender,
      dob: data.dob,
      baptismDate: data.baptismDate,
      baptismType: data.baptismType,
    }),
  });
  return (await res.json()) as { id: number };
}

export async function createFund(
  token: string,
  conferenceId: number,
  name: string,
  type: "tithe" | "local_budget" | "sabbath_school"
): Promise<{ id: number }> {
  const res = await SELF.fetch("http://localhost/api/funds", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({
      name,
      type,
      forwardingRule: type === "tithe" || type === "sabbath_school" ? "conference" : "local",
      conferenceId,
    }),
  });
  return (await res.json()) as { id: number };
}

export async function createHousehold(
  token: string,
  churchId: number,
  name: string
): Promise<{ id: number }> {
  const res = await SELF.fetch("http://localhost/api/households", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({ churchId, name }),
  });
  return (await res.json()) as { id: number };
}
