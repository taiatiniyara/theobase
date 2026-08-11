import { ChurchDO } from './church-do';
import type { Env } from './env';

const FIJIAN_FIRST_NAMES = [
  'Jone', 'Mere', 'Savenaca', 'Litia', 'Tevita', 'Ana', 'Peni', 'Salote',
  'Ratu', 'Adi', 'Josaia', 'Vasiti', 'Emosi', 'Asenaca', 'Samuela', 'Mereoni',
  'Isikeli', 'Nanise', 'Aporosa', 'Raijieli', 'Sairusi', 'Elenoa', 'Jope', 'Makelesi',
];

const FIJIAN_LAST_NAMES = [
  'Naivalu', 'Vakalalabure', 'Tuisawau', 'Nalewavada', 'Tora', 'Rokotakala',
  'Cakobau', 'Koroi', 'Ramasi', 'Vosailagi', 'Drodrolagi', 'Tawake', 'Nadredre',
  'Vosarogo', 'Buliruarua', 'Saukuru', 'Tiko', 'Ramaka', 'Ravuso', 'Anda',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomMember(churchId: string, i: number): Record<string, unknown> {
  const fn = pick(FIJIAN_FIRST_NAMES);
  const ln = pick(FIJIAN_LAST_NAMES);
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const statuses = ['baptised', 'baptised', 'baptised', 'baptised', 'profession', 'transfer-in'];
  const status = pick(statuses);
  const year = 1950 + Math.floor(Math.random() * 50);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

  return {
    id: `demo-member-${i}`,
    churchId,
    firstName: fn,
    lastName: ln,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@demo.church`,
    phone: `+679 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
    address: `${Math.floor(Math.random() * 50) + 1} ${pick(['Bau Rd', 'Princes Rd', 'Queen Elizabeth Dr', 'Ratu Mara Rd', 'Victoria Pde', 'Toorak Rd'])}`,
    dateOfBirth: `${year}-${month}-${day}`,
    gender,
    baptismDate: `${year + 15}-${month}-${day}`,
    membershipStatus: status,
    createdAt: Date.now() - Math.floor(Math.random() * 15552000000),
    updatedAt: Date.now(),
  };
}

const CATEGORIES = ['tithe', 'sabbath-school', 'local-church-budget', 'conference-advance', 'world-budget', 'building-fund', 'adra'];

function randomGivingRecord(batchId: string, memberIndex: number, daysAgoRange: [number, number]): Record<string, unknown> {
  const type = Math.random() > 0.4 ? 'tithe' : 'offering';
  const baseAmount = type === 'tithe' ? pick([20, 30, 40, 50, 75, 100, 150]) : pick([5, 10, 15, 20, 25, 50]);
  const amount = Math.round((baseAmount + Math.random() * 20) * 100) / 100;
  const daysAgo = daysAgoRange[0] + Math.floor(Math.random() * (daysAgoRange[1] - daysAgoRange[0]));

  return {
    id: crypto.randomUUID(),
    batchId,
    memberId: `demo-member-${memberIndex}`,
    type,
    amount,
    category: pick(CATEGORIES),
    paymentMethod: pick(['envelope', 'cash', 'electronic']),
    createdAt: (Date.now() - daysAgo * 86400000) / 1000,
  };
}

export async function seedDemoChurch(env: Env): Promise<string> {
  const churchId = crypto.randomUUID();
  const doId = env.CHURCH_DO.idFromName(churchId);
  const stub = env.CHURCH_DO.get(doId);
  const seedToken = env.SEED_TOKEN || '';

  await doFetch(stub, seedToken, 'church:create', { id: churchId, name: 'DEMO: Suva Central SDA Church', address: '3 Thurston St, Suva', status: 'active' });

  for (let i = 0; i < 120; i++) {
    const m = randomMember(churchId, i);
    await doFetch(stub, seedToken, 'member:create', m);
  }

  for (let batch = 0; batch < 24; batch++) {
    const batchId = `demo-batch-${batch}`;
    const daysAgoStart = batch * 7;
    const daysAgoEnd = daysAgoStart + 7;
    const records: Array<Record<string, unknown>> = [];
    const recordCount = 40 + Math.floor(Math.random() * 60);

    for (let r = 0; r < recordCount; r++) {
      const memberIndex = Math.floor(Math.random() * 120);
      records.push(randomGivingRecord(batchId, memberIndex, [daysAgoStart, daysAgoEnd]));
    }

    await doFetch(stub, seedToken, 'giving_batch:create', {
      id: batchId, churchId, date: new Date(Date.now() - daysAgoStart * 86400000).toISOString().split('T')[0],
      counter1Id: 'demo-counter1', records, status: 'counter1-confirmed',
    });
    await doFetch(stub, seedToken, 'giving_batch:counter2-confirm', {
      batchId, counter2Id: 'demo-counter2', records, timestamp: Date.now(),
    });
    await doFetch(stub, seedToken, 'giving_batch:commit', {
      batchId, records, timestamp: Date.now(),
    });
  }

  const pendingBatchRecords: Array<Record<string, unknown>> = [];
  for (let r = 0; r < 45; r++) {
    pendingBatchRecords.push(randomGivingRecord('demo-batch-pending', Math.floor(Math.random() * 120), [0, 3]));
  }
  await doFetch(stub, seedToken, 'giving_batch:create', {
    id: 'demo-batch-pending', churchId, date: new Date().toISOString().split('T')[0],
    counter1Id: 'demo-counter1', records: pendingBatchRecords, status: 'counter1-confirmed',
  });

  const disputedRecords1: Array<Record<string, unknown>> = [];
  const disputedRecords2: Array<Record<string, unknown>> = [];
  for (let r = 0; r < 50; r++) {
    const rec = randomGivingRecord('demo-batch-disputed', Math.floor(Math.random() * 120), [3, 7]);
    disputedRecords1.push({ ...rec });
    disputedRecords2.push({ ...rec, amount: (rec.amount as number) + Math.random() * 10 });
  }
  await doFetch(stub, seedToken, 'giving_batch:create', {
    id: 'demo-batch-disputed', churchId, date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    counter1Id: 'demo-counter1', records: disputedRecords1, status: 'counter1-confirmed',
  });
  await doFetch(stub, seedToken, 'giving_batch:counter2-confirm', {
    batchId: 'demo-batch-disputed', counter2Id: 'demo-counter2', records: disputedRecords2, timestamp: Date.now(),
  });

  const demoUsers = [
    { email: 'clerk@suva.sda', role: 'clerk' as const, name: 'Jone Clerks' },
    { email: 'treasurer@suva.sda', role: 'treasurer' as const, name: 'Mere Treas' },
    { email: 'counter1@suva.sda', role: 'counter' as const, name: 'Peni Count' },
    { email: 'counter2@suva.sda', role: 'counter' as const, name: 'Ana Count' },
    { email: 'pastor@suva.sda', role: 'pastor' as const, name: 'Tevita Past' },
    { email: 'member@suva.sda', role: 'member' as const, name: 'Salote Mem' },
  ];
  for (const u of demoUsers) {
    await doFetch(stub, seedToken, 'role:assign', {
      userId: `demo-${u.email}`,
      churchId,
      role: u.role,
      email: u.email,
      name: u.name,
      timestamp: Date.now(),
    });
  }

  return churchId;
}

async function doFetch(stub: DurableObjectStub<ChurchDO>, seedToken: string, operation: string, payload: unknown): Promise<void> {
  const response = await stub.fetch('http://localhost/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${seedToken}` },
    body: JSON.stringify({ operation, payload }),
  });
  if (!response.ok) {
    throw new Error(`Seed failed for ${operation}: ${response.status}`);
  }
}
