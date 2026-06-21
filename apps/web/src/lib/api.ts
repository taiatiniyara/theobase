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

function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

async function get<T>(path: string): Promise<T> {
  const res = await api(path);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await api(path, { method: 'PATCH', body: JSON.stringify(body) });
  return res.json();
}

async function del(path: string): Promise<void> {
  await api(path, { method: 'DELETE' });
}

async function paginated<T>(path: string, limit?: number, offset?: number): Promise<T> {
  return get<T>(`${path}${qs({ limit, offset })}`);
}

export async function requestMagicLink(email: string) {
  const res = await fetch(`${API_URL}/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export function verifyToken(token: string) {
  return post('/auth/verify', { token });
}

export function getMe() {
  return get('/me');
}

export function updateMe(data: { phone?: string; address?: string }) {
  return patch('/me', data);
}

export function getReceipts(limit?: number, offset?: number) {
  return paginated('/receipts', limit, offset);
}

export function createReceipt(data: { amount: number; fundSplit: Record<string, number> }) {
  return post('/receipts', data);
}

export function getReceiptsByStatus(status: string, limit?: number) {
  return get(`/receipts${qs({ status, limit })}`);
}

export function getBoardMeetings(limit?: number, offset?: number) {
  return paginated('/board/meetings', limit, offset);
}

export function createBoardMeeting(data: { date: string; agenda: { title: string }[] }) {
  return post('/board/meetings', data);
}

export function getBoardMeeting(id: string) {
  return get(`/board/meetings/${id}`);
}

export function createBoardDecision(meetingId: string, data: { title: string; description: string; voteOutcome: string }) {
  return post(`/board/meetings/${meetingId}/decisions`, data);
}

export function getBoardMinutes(meetingId: string) {
  return get(`/board/meetings/${encodeURIComponent(meetingId)}/minutes`);
}

export function createBoardMinute(meetingId: string, content: string) {
  return post(`/board/meetings/${encodeURIComponent(meetingId)}/minutes`, { content });
}

export function updateBoardMinute(id: string, content: string) {
  return patch(`/board/minutes/${id}`, { content });
}

export function deleteBoardMinute(id: string) {
  return del(`/board/minutes/${id}`);
}

export function getTreasuryBalance() {
  return get('/treasury/balance');
}

export function getExpenses(limit?: number, offset?: number) {
  return paginated('/treasury/expenses', limit, offset);
}

export function createExpense(data: { amount: number; description: string; category: string; receiptId?: string; boardDecisionId?: string }) {
  return post('/treasury/expenses', data);
}

export function getRota(date: string) {
  return get(`/rota/${date}`);
}

export function createRotaSlot(data: { date: string; role: string; volunteerId?: string }) {
  return post('/rota/slots', data);
}

export function updateRotaSlot(id: string, data: { volunteerId?: string; status?: string }) {
  return patch(`/rota/slots/${id}`, data);
}

export function deleteRotaSlot(id: string) {
  return del(`/rota/slots/${id}`);
}

export function getPathfinderProgress(memberId: string, limit?: number, offset?: number) {
  return paginated(`/pathfinder/progress/${memberId}`, limit, offset);
}

export function createPathfinderProgress(data: { memberId: string; className: string; clubType: string; status: string }) {
  return post('/pathfinder/progress', data);
}

export function getPathfinderHonors(memberId: string, limit?: number, offset?: number) {
  return paginated(`/pathfinder/honors/${memberId}`, limit, offset);
}

export function createPathfinderHonor(data: { memberId: string; name: string; category: string; earnedAt: string }) {
  return post('/pathfinder/honors', data);
}

export function getWelfareCases(limit?: number, offset?: number) {
  return paginated('/welfare/cases', limit, offset);
}

export function createWelfareCase(data: { personId: string; assistanceType: string; description: string; value: number }) {
  return post('/welfare/cases', data);
}

export function getPantryItems(limit?: number, offset?: number) {
  return paginated('/pantry/items', limit, offset);
}

export function createPantryItem(data: { name: string; quantity: number; unit: string }) {
  return post('/pantry/items', data);
}

export function getSabbathSchoolClasses(limit?: number, offset?: number) {
  return paginated('/sabbath-school/classes', limit, offset);
}

export function createSabbathSchoolClass(data: { division: string; name: string }) {
  return post('/sabbath-school/classes', data);
}

export function recordAttendance(data: { attendance: { classId: string; date: string; memberId: string; present: boolean }[] }) {
  return post('/sabbath-school/attendance', data);
}

export function getHealthEvents(limit?: number, offset?: number) {
  return paginated('/health/events', limit, offset);
}

export function getHealthContacts(limit?: number, offset?: number) {
  return paginated('/health/contacts', limit, offset);
}

export function createHealthEvent(data: { name: string; date: string; type: string }) {
  return post('/health/events', data);
}

export function createHealthContact(data: { eventId: string; name: string; phone: string; email: string; interests: string[] }) {
  return post('/health/contacts', data);
}

export function getCommunionServices(limit?: number, offset?: number) {
  return paginated('/communion', limit, offset);
}

export function getCommunionService(id: string) {
  return get(`/communion/${id}`);
}

export function createCommunion(data: { date: string; rooms: { name: string; gender: string; volunteerIds?: string[] }[]; inventory: { item: string; quantity: number; unit: string }[] }) {
  return post('/communion', data);
}

export function getOrderOfService(date: string) {
  return get(`/av/order-of-service/${date}`);
}

export function updateOrderOfService(data: { date: string; items: { title: string; type: string; resource?: string; notes?: string }[] }) {
  return post('/av/order-of-service', data);
}

export function updateAVSlide(date: string, slideIndex: number) {
  return post('/av/order-of-service/slide', { date, slideIndex });
}

export function getDistrictRotations(limit?: number, offset?: number) {
  return paginated('/district/rotations', limit, offset);
}

export function createDistrictRotation(data: { congregationId: string; date: string; preacherId: string; topic: string }) {
  return post('/district/rotations', data);
}

export function getDistrictVisits(limit?: number, offset?: number) {
  return paginated('/district/visits', limit, offset);
}

export function createDistrictVisit(data: { householdId: string; pastorId: string; date: string; purpose: string; notes: string }) {
  return post('/district/visits', data);
}

export function getFacilityBookings(limit?: number, offset?: number) {
  return paginated('/facilities/bookings', limit, offset);
}

export function createFacilityBooking(data: { date: string; timeStart: string; timeEnd: string; purpose: string }) {
  return post('/facilities/bookings', data);
}

export function getCrisisAssets(limit?: number, offset?: number) {
  return paginated('/crisis/assets', limit, offset);
}

export function createCrisisAsset(data: { type: string; description: string; status?: string }) {
  return post('/crisis/assets', data);
}

export function getTransfers(limit?: number, offset?: number) {
  return paginated('/transfers', limit, offset);
}

export function createTransfer(data: { memberId: string; toCongregationId: string }) {
  return post('/transfers', data);
}

export function updateTransferStatus(id: string, status: string) {
  return patch(`/transfers/${id}`, { status });
}

export function getNominatingSessions() {
  return get('/nominating/sessions');
}

export function createNominatingSession(data: { year: number }) {
  return post('/nominating/sessions', data);
}

export function getNominatingRoles(sessionId: string) {
  return get(`/nominating/roles?sessionId=${encodeURIComponent(sessionId)}`);
}

export function createNominatingRole(data: { sessionId: string; roleType: string }) {
  return post('/nominating/roles', data);
}

export function getNominatingCandidates(roleId: string) {
  return get(`/nominating/candidates?roleId=${encodeURIComponent(roleId)}`);
}

export function createNominatingCandidate(data: { roleId: string; personId: string }) {
  return post('/nominating/candidates', data);
}

export function updateNominatingCandidate(id: string, status: string) {
  return patch(`/nominating/candidates/${id}`, { status });
}

export function deleteNominatingSession(id: string) {
  return del(`/nominating/sessions/${id}`);
}

export function deleteNominatingRole(id: string) {
  return del(`/nominating/roles/${id}`);
}

export function deleteNominatingCandidate(id: string) {
  return del(`/nominating/candidates/${id}`);
}

export function castBallot(data: { sessionId: string; roleId: string; candidateId: string }) {
  return post('/nominating/ballots', data);
}

export function getTally(sessionId: string) {
  return get(`/nominating/tally/${encodeURIComponent(sessionId)}`);
}

export function closeVoting(sessionId: string) {
  return post(`/nominating/sessions/${encodeURIComponent(sessionId)}/close`);
}

export function getHouseholds(limit?: number, offset?: number) {
  return paginated('/households', limit, offset);
}

export function createHousehold(data: { name: string }) {
  return post('/households', data);
}

export function getHouseholdMembers(householdId: string) {
  return get(`/households/${encodeURIComponent(householdId)}/members`);
}

export function addHouseholdMember(householdId: string, data: { personId: string; relationship: string }) {
  return post(`/households/${encodeURIComponent(householdId)}/members`, data);
}

export function removeHouseholdMember(memberId: string) {
  return del(`/household-members/${encodeURIComponent(memberId)}`);
}

export function getCandidacies(limit?: number, offset?: number) {
  return paginated('/candidacies', limit, offset);
}

export function createCandidacy(data: { personId: string; stage: string; startDate: string }) {
  return post('/candidacies', data);
}

export function updateCandidacy(id: string, data: { stage?: string; decisionDate?: string; decisionType?: string }) {
  return patch(`/candidacies/${id}`, data);
}

export function getPersons(congregationId?: string) {
  const params = congregationId ? `?congregationId=${encodeURIComponent(congregationId)}` : '';
  return get(`/persons${params}`);
}

export function createPerson(data: { firstName: string; lastName: string; email?: string; phone?: string; isMember?: boolean }) {
  return post('/persons', data);
}

export function updatePerson(id: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string; isMember?: boolean }) {
  return patch(`/persons/${id}`, data);
}

export function assignRole(data: { personId: string; congregationId: string; roleType: string }) {
  return post('/roles', data);
}

export function removeRole(roleId: string) {
  return del(`/roles/${roleId}`);
}

export function getCongregation(id: string) {
  return get(`/congregations/${id}`);
}

export function createCongregation(data: {
  name: string;
  type: string;
  timezone?: string;
  parentId?: string;
  parentType?: string;
  organizationId?: string;
}) {
  return post('/congregations', data);
}

export function inviteOfficer(congregationId: string, data: { email: string; role: string }) {
  return post(`/congregations/${congregationId}/invite`, data);
}

export function importMembers(congregationId: string, csv: string) {
  return post(`/congregations/${congregationId}/members/import`, { csv });
}

export function getCongregationMembers(congregationId: string) {
  return get(`/congregations/${encodeURIComponent(congregationId)}/members`);
}

export function getBankAccount(congregationId: string) {
  return get(`/congregations/${encodeURIComponent(congregationId)}/bank-account`);
}

export function saveBankAccount(congregationId: string, data: { bankName: string; accountName: string; accountNumber: string }) {
  return post(`/congregations/${encodeURIComponent(congregationId)}/bank-account`, data);
}

export function getSafetyClearances(limit?: number, offset?: number) {
  return paginated('/safety-clearances', limit, offset);
}

export function createSafetyClearance(data: { volunteerId: string; type: string; issuedDate: string; expiryDate: string }) {
  return post('/safety-clearances', data);
}

export function deleteSafetyClearance(id: string) {
  return del(`/safety-clearances/${id}`);
}

export function getConferenceStats(quarterStart?: string, quarterEnd?: string) {
  return get(`/conference/stats${qs({ quarterStart, quarterEnd })}`);
}

export function getConferenceExport(quarterStart?: string, quarterEnd?: string) {
  return api(`/conference/export?${qs({ format: 'csv', quarterStart, quarterEnd }).slice(1)}`).then(r => r.text());
}

export function getConferenceFullExport() {
  return get('/conference/export/full');
}

export function getAuditLog(limit?: number, offset?: number) {
  return paginated('/audit', limit, offset);
}

