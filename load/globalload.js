// Theobase load testing script
// Simulates 1,000 concurrent users across 10 Conferences
// Usage: node load/globalload.js
//
// Configurable via env vars:
//   TARGET_URL  — base URL (default: http://localhost:8787)
//   CONCURRENT  — virtual users per Conference (default: 100)
//   CONFERENCES — number of Conferences (default: 10)
//   DURATION    — test duration in seconds (default: 30)

const TARGET = process.env.TARGET_URL || "http://localhost:8787";
const PER_CONF = Number(process.env.CONCURRENT || "100");
const CONFERENCES = Number(process.env.CONFERENCES || "10");
const DURATION = Number(process.env.DURATION || "30");

const stats = { total: 0, ok: 0, errors: 0, latencies: [] };

async function signup(email, password) {
  const res = await fetch(`${TARGET}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Theobase-Test-Bypass": "email-verification",
    },
    body: JSON.stringify({
      email,
      password,
      fullName: "Load Test User",
      conferenceName: `LoadConf-${email.split("@")[0]}`,
    }),
  });
  const body = await res.json();
  return body.accessToken || null;
}

async function makeRequest(token, method, path, body) {
  const start = Date.now();
  try {
    const res = await fetch(`${TARGET}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    stats.latencies.push(Date.now() - start);
    stats.total++;
    if (res.ok) {
      stats.ok++;
      return true;
    }
    stats.errors++;
    return false;
  } catch (_e) {
    stats.errors++;
    stats.total++;
    return false;
  }
}

async function simulateUser(confIndex, userIndex) {
  const email = `load-${confIndex}-${userIndex}@test.com`;
  const password = "loadtest123";

  const token = await signup(email, password);
  if (!token) return;

  const deadline = Date.now() + DURATION * 1000;

  while (Date.now() < deadline) {
    await makeRequest(token, "GET", "/api/conferences");
    await makeRequest(token, "GET", "/api/members");
    await makeRequest(token, "POST", "/api/attendance", {
      churchId: 1,
      date: new Date().toISOString().split("T")[0],
      count: 50 + Math.floor(Math.random() * 100),
      category: "church-service",
    });
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function main() {
  console.log(`Load test: ${TARGET}`);
  console.log(`Conferences: ${CONFERENCES}, Users/Conf: ${PER_CONF}, Duration: ${DURATION}s`);
  console.log(`Total virtual users: ${CONFERENCES * PER_CONF}`);

  const start = Date.now();
  const users = [];

  for (let c = 0; c < CONFERENCES; c++) {
    for (let u = 0; u < PER_CONF; u++) {
      users.push(simulateUser(c, u));
    }
  }

  await Promise.all(users);
  const elapsed = (Date.now() - start) / 1000;

  const latencies = stats.latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const errorRate = stats.total > 0 ? ((stats.errors / stats.total) * 100).toFixed(1) : "0.0";

  console.log("\n=== Results ===");
  console.log(`Duration:         ${elapsed.toFixed(1)}s`);
  console.log(`Total requests:   ${stats.total}`);
  console.log(`OK:               ${stats.ok}`);
  console.log(`Errors:           ${stats.errors}`);
  console.log(`Error rate:       ${errorRate}%`);
  console.log(`p50 latency:      ${p50}ms`);
  console.log(`p95 latency:      ${p95}ms`);
  console.log(`p99 latency:      ${p99}ms`);
  console.log(`Requests/sec:     ${(stats.total / elapsed).toFixed(1)}`);

  const passed = parseFloat(errorRate) < 1 && p95 < 500;
  console.log(`\nThreshold: error < 1%, p95 < 500ms — ${passed ? "PASSED" : "FAILED"}`);
  process.exit(passed ? 0 : 1);
}

main().catch(console.error);
