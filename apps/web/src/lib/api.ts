export const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'https://api.theobase.net';
export const WS_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WS_URL) || 'wss://api.theobase.net';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('theobase_token');
}

export function setToken(token: string) {
  localStorage.setItem('theobase_token', token);
}

export function clearToken() {
  localStorage.removeItem('theobase_token');
}

export async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/';
    }
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    throw new Error("Forbidden");
  }
  return res;
}

export async function requestMagicLink(email: string) {
  const res = await fetch(`${API_URL}/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyToken(token: string) {
  const res = await api('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function getMe() {
  const res = await api('/me');
  return res.json();
}

export async function updateMe(data: { phone?: string; address?: string }) {
  const res = await api('/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}

// Receipts (issue 004)
export async function getReceipts(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/receipts${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createReceipt(data: { amount: number; fundSplit: Record<string, number> }) {
  const res = await api('/receipts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// Boardroom (issue 005)
export async function getBoardMeetings(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/board/meetings${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createBoardMeeting(data: { date: string; agenda: { title: string }[] }) {
  const res = await api('/board/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getBoardMeeting(id: string) {
  const res = await api(`/board/meetings/${id}`);
  return res.json();
}

export async function createBoardDecision(meetingId: string, data: { title: string; description: string; voteOutcome: string }) {
  const res = await api(`/board/meetings/${meetingId}/decisions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// Treasury (issue 007)
export async function getTreasuryBalance() {
  const res = await api('/treasury/balance');
  return res.json();
}

export async function getExpenses(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/treasury/expenses${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createExpense(data: { amount: number; description: string; category: string; receiptId?: string; boardDecisionId?: string }) {
  const res = await api('/treasury/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// Rota (issue 006)
export async function getRota(date: string) {
  const res = await api(`/rota/${date}`);
  return res.json();
}

// Pathfinders (issue 010)
export async function getPathfinderProgress(memberId: string, limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/pathfinder/progress/${memberId}${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createPathfinderProgress(data: { memberId: string; className: string; clubType: string; status: string }) {
  const res = await api('/pathfinder/progress', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function getPathfinderHonors(memberId: string, limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/pathfinder/honors/${memberId}${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createPathfinderHonor(data: { memberId: string; name: string; category: string; earnedAt: string }) {
  const res = await api('/pathfinder/honors', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Welfare (issue 012)
export async function getWelfareCases(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/welfare/cases${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createWelfareCase(data: { personId: string; assistanceType: string; description: string; value: number }) {
  const res = await api('/welfare/cases', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function getPantryItems(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/pantry/items${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createPantryItem(data: { name: string; quantity: number; unit: string }) {
  const res = await api('/pantry/items', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Sabbath School (issue 011)
export async function getSabbathSchoolClasses(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/sabbath-school/classes${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createSabbathSchoolClass(data: { division: string; name: string }) {
  const res = await api('/sabbath-school/classes', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function recordAttendance(data: { attendance: { classId: string; date: string; memberId: string; present: boolean }[] }) {
  const res = await api('/sabbath-school/attendance', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Health (issue 013)
export async function getHealthContacts(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/health/contacts${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createHealthEvent(data: { name: string; date: string; type: string }) {
  const res = await api('/health/events', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function createHealthContact(data: { eventId: string; name: string; phone: string; email: string; interests: string[] }) {
  const res = await api('/health/contacts', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Communion (issue 016)
export async function getCommunionServices(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/communion${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function getCommunionService(id: string) {
  const res = await api(`/communion/${id}`);
  return res.json();
}

export async function createCommunion(data: { date: string; rooms: any[]; inventory: any[] }) {
  const res = await api('/communion', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// AV Sync (issue 017)
export async function getOrderOfService(date: string) {
  const res = await api(`/av/order-of-service/${date}`);
  return res.json();
}

export async function updateOrderOfService(data: { date: string; items: any[] }) {
  const res = await api('/av/order-of-service', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// District Hub (issue 018)
export async function getDistrictRotations(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/district/rotations${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createDistrictRotation(data: { congregationId: string; date: string; preacherId: string; topic: string }) {
  const res = await api('/district/rotations', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function createDistrictVisit(data: { householdId: string; pastorId: string; date: string; purpose: string; notes: string }) {
  const res = await api('/district/visits', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Facilities (issue 019)
export async function getFacilityBookings(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/facilities/bookings${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createFacilityBooking(data: { date: string; timeStart: string; timeEnd: string; purpose: string }) {
  const res = await api('/facilities/bookings', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Crisis (issue 020)
export async function getCrisisAssets(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/crisis/assets${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createCrisisAsset(data: { type: string; description: string; status?: string }) {
  const res = await api('/crisis/assets', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Transfers (issue 021)
export async function getTransfers(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/transfers${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createTransfer(data: { memberId: string; toCongregationId: string }) {
  const res = await api('/transfers', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function updateTransferStatus(id: string, status: string) {
  const res = await api(`/transfers/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  return res.json();
}

// Nominating (issue 023)
export async function createNominatingSession(data: { year: number }) {
  const res = await api('/nominating/sessions', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function createNominatingRole(data: { sessionId: string; roleType: string }) {
  const res = await api('/nominating/roles', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Health (issue 013)
export async function getHealthEvents(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/health/events${qs ? `?${qs}` : ""}`);
  return res.json();
}

// Households (issue 014)
export async function getHouseholds(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/households${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createHousehold(data: { name: string }) {
  const res = await api('/households', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Candidacies (issue 014)
export async function getCandidacies(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const res = await api(`/candidacies${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createCandidacy(data: { personId: string; stage: string; startDate: string }) {
  const res = await api('/candidacies', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function getConferenceStats(quarterStart?: string, quarterEnd?: string) {
  const params = new URLSearchParams();
  if (quarterStart) params.set("quarterStart", quarterStart);
  if (quarterEnd) params.set("quarterEnd", quarterEnd);
  const qs = params.toString();
  const res = await api(`/conference/stats${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function getConferenceExport(quarterStart?: string, quarterEnd?: string) {
  const params = new URLSearchParams({ format: "csv" });
  if (quarterStart) params.set("quarterStart", quarterStart);
  if (quarterEnd) params.set("quarterEnd", quarterEnd);
  const res = await api(`/conference/export?${params.toString()}`);
  return res.text();
}

export async function getCongregation(id: string) {
  const res = await api(`/congregations/${id}`);
  return res.json();
}

export async function createCongregation(data: {
  name: string;
  type: string;
  timezone?: string;
  parentId?: string;
  parentType?: string;
  organizationId?: string;
}) {
  const res = await api('/congregations', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function inviteOfficer(congregationId: string, data: { email: string; role: string }) {
  const res = await api(`/congregations/${congregationId}/invite`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function importMembers(congregationId: string, csv: string) {
  const res = await api(`/congregations/${congregationId}/members/import`, {
    method: 'POST',
    body: JSON.stringify({ csv }),
  });
  return res.json();
}

export async function createRotaSlot(data: { date: string; role: string; volunteerId?: string }) {
  const res = await api('/rota/slots', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function updateRotaSlot(id: string, data: { volunteerId?: string; status?: string }) {
  const res = await api(`/rota/slots/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return res.json();
}

export async function deleteRotaSlot(id: string) {
  await api(`/rota/slots/${id}`, { method: 'DELETE' });
}

export async function getNominatingSessions() {
  const res = await api('/nominating/sessions');
  return res.json();
}

export async function getNominatingRoles(sessionId: string) {
  const res = await api(`/nominating/roles?sessionId=${encodeURIComponent(sessionId)}`);
  return res.json();
}

export async function getNominatingCandidates(roleId: string) {
  const res = await api(`/nominating/candidates?roleId=${encodeURIComponent(roleId)}`);
  return res.json();
}

export async function createNominatingCandidate(data: { roleId: string; personId: string }) {
  const res = await api('/nominating/candidates', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function updateNominatingCandidate(id: string, status: string) {
  const res = await api(`/nominating/candidates/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  return res.json();
}

export async function deleteNominatingSession(id: string) {
  await api(`/nominating/sessions/${id}`, { method: 'DELETE' });
}

export async function deleteNominatingRole(id: string) {
  await api(`/nominating/roles/${id}`, { method: 'DELETE' });
}

export async function deleteNominatingCandidate(id: string) {
  await api(`/nominating/candidates/${id}`, { method: 'DELETE' });
}

export async function getSafetyClearances(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const qs = params.toString();
  const res = await api(`/safety-clearances${qs ? `?${qs}` : ''}`);
  return res.json();
}

export async function createSafetyClearance(data: { volunteerId: string; type: string; issuedDate: string; expiryDate: string }) {
  const res = await api('/safety-clearances', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function getHouseholdMembers(householdId: string) {
  const res = await api(`/households/${encodeURIComponent(householdId)}/members`);
  return res.json();
}

export async function addHouseholdMember(householdId: string, data: { personId: string; relationship: string }) {
  const res = await api(`/households/${encodeURIComponent(householdId)}/members`, { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function removeHouseholdMember(memberId: string) {
  await api(`/household-members/${encodeURIComponent(memberId)}`, { method: 'DELETE' });
}

export async function getBoardMinutes(meetingId: string) {
  const res = await api(`/board/meetings/${encodeURIComponent(meetingId)}/minutes`);
  return res.json();
}

export async function createBoardMinute(meetingId: string, content: string) {
  const res = await api(`/board/meetings/${encodeURIComponent(meetingId)}/minutes`, { method: 'POST', body: JSON.stringify({ content }) });
  return res.json();
}

export async function updateCandidacy(id: string, data: { stage?: string; decisionDate?: string; decisionType?: string }) {
  const res = await api(`/candidacies/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return res.json();
}

export async function getAuditLog(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const qs = params.toString();
  const res = await api(`/audit${qs ? `?${qs}` : ''}`);
  return res.json();
}

export async function updateBoardMinute(id: string, content: string) {
  const res = await api(`/board/minutes/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) });
  return res.json();
}

export async function deleteBoardMinute(id: string) {
  await api(`/board/minutes/${id}`, { method: 'DELETE' });
}

export async function deleteSafetyClearance(id: string) {
  await api(`/safety-clearances/${id}`, { method: 'DELETE' });
}

export async function getCongregationMembers(congregationId: string) {
  const res = await api(`/congregations/${encodeURIComponent(congregationId)}/members`);
  return res.json();
}

export async function getDistrictVisits(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const qs = params.toString();
  const res = await api(`/district/visits${qs ? `?${qs}` : ''}`);
  return res.json();
}

export async function createPerson(data: { firstName: string; lastName: string; email?: string; phone?: string; isMember?: boolean }) {
  const res = await api('/persons', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function updatePerson(id: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string; isMember?: boolean }) {
  const res = await api(`/persons/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return res.json();
}

export async function assignRole(data: { personId: string; congregationId: string; roleType: string }) {
  const res = await api('/roles', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function removeRole(roleId: string) {
  await api(`/roles/${roleId}`, { method: 'DELETE' });
}

export async function getReceiptsByStatus(status: string, limit?: number) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', String(limit));
  const res = await api(`/receipts?${params.toString()}`);
  return res.json();
}

export async function getConferenceFullExport() {
  const res = await api('/conference/export/full');
  return res.json();
}

export async function updateAVSlide(date: string, slideIndex: number) {
  const res = await api('/av/order-of-service/slide', { method: 'POST', body: JSON.stringify({ date, slideIndex }) });
  return res.json();
}

export async function getPersons(congregationId?: string) {
  const params = congregationId ? `?congregationId=${encodeURIComponent(congregationId)}` : '';
  const res = await api(`/persons${params}`);
  return res.json();
}

export async function castBallot(data: { sessionId: string; roleId: string; candidateId: string }) {
  const res = await api('/nominating/ballots', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function getTally(sessionId: string) {
  const res = await api(`/nominating/tally/${encodeURIComponent(sessionId)}`);
  return res.json();
}

export async function closeVoting(sessionId: string) {
  const res = await api(`/nominating/sessions/${encodeURIComponent(sessionId)}/close`, { method: 'POST' });
  return res.json();
}

export async function getBankAccount(congregationId: string) {
  const res = await api(`/congregations/${encodeURIComponent(congregationId)}/bank-account`);
  return res.json();
}

export async function saveBankAccount(congregationId: string, data: { bankName: string; accountName: string; accountNumber: string }) {
  const res = await api(`/congregations/${encodeURIComponent(congregationId)}/bank-account`, { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

