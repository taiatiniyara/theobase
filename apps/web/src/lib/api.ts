const API_URL = 'https://api.theobase.net';

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
  if (res.status === 401 && token) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/';
    }
    return res;
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
export async function getReceipts() {
  const res = await api('/receipts');
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
export async function getBoardMeetings() {
  const res = await api('/board/meetings');
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

export async function getExpenses() {
  const res = await api('/treasury/expenses');
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
export async function getPathfinderProgress(memberId: string) {
  const res = await api(`/pathfinder/progress/${memberId}`);
  return res.json();
}

export async function createPathfinderProgress(data: { memberId: string; className: string; clubType: string; status: string }) {
  const res = await api('/pathfinder/progress', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function getPathfinderHonors(memberId: string) {
  const res = await api(`/pathfinder/honors/${memberId}`);
  return res.json();
}

export async function createPathfinderHonor(data: { memberId: string; name: string; category: string; earnedAt: string }) {
  const res = await api('/pathfinder/honors', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Welfare (issue 012)
export async function getWelfareCases() {
  const res = await api('/welfare/cases');
  return res.json();
}

export async function createWelfareCase(data: { personId: string; assistanceType: string; description: string; value: number }) {
  const res = await api('/welfare/cases', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function getPantryItems() {
  const res = await api('/pantry/items');
  return res.json();
}

export async function createPantryItem(data: { name: string; quantity: number; unit: string }) {
  const res = await api('/pantry/items', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Sabbath School (issue 011)
export async function getSabbathSchoolClasses() {
  const res = await api('/sabbath-school/classes');
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
export async function getHealthContacts() {
  const res = await api('/health/contacts');
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
export async function getCommunionServices() {
  const res = await api('/communion');
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
export async function getDistrictRotations() {
  const res = await api('/district/rotations');
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
export async function getFacilityBookings() {
  const res = await api('/facilities/bookings');
  return res.json();
}

export async function createFacilityBooking(data: { date: string; timeStart: string; timeEnd: string; purpose: string }) {
  const res = await api('/facilities/bookings', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Crisis (issue 020)
export async function getCrisisAssets() {
  const res = await api('/crisis/assets');
  return res.json();
}

export async function createCrisisAsset(data: { type: string; description: string; status?: string }) {
  const res = await api('/crisis/assets', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Transfers (issue 021)
export async function getTransfers() {
  const res = await api('/transfers');
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
export async function getHealthEvents() {
  const res = await api('/health/events');
  return res.json();
}

// Households (issue 014)
export async function getHouseholds() {
  const res = await api('/households');
  return res.json();
}

export async function createHousehold(data: { name: string }) {
  const res = await api('/households', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

// Candidacies (issue 014)
export async function getCandidacies() {
  const res = await api('/candidacies');
  return res.json();
}

export async function createCandidacy(data: { personId: string; stage: string; startDate: string }) {
  const res = await api('/candidacies', { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}
