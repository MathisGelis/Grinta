// Measures the main endpoints against a running API on a database seeded with
// perf/seed-perf.sql (see PERFORMANCE.md).
//
// For each endpoint it reports the number of SQL statements and the database
// time per request, read from pg_stat_statements, plus the wall-clock time, the
// response size, its size on the wire when the client accepts compression, and,
// when the API reaches Postgres through perf/db-egress-proxy.mjs
// (DB_EGRESS_URL), the bytes Postgres sent per request. The database must have
// the pg_stat_statements extension.
//
//   node perf/bench.mjs --label before --out perf/results-before.json
//
// Environment: API_URL (default http://localhost:3100), PGHOST, PGPORT,
// PGUSER, PGPASSWORD, PGDATABASE, RUNS (default 15), DB_EGRESS_URL.

import { writeFileSync } from 'node:fs';
import { request } from 'node:http';
import pg from 'pg';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
    return acc;
  }, []),
);
const API = process.env.API_URL ?? 'http://localhost:3100';
const RUNS = Number(process.env.RUNS ?? 15);
const MAIN_EMAIL = process.env.MAIN_EMAIL ?? 'perf_main@example.com';
const MAIN_PASSWORD = process.env.MAIN_PASSWORD ?? 'Password123!';

const db = new pg.Client({
  host: process.env.PGHOST ?? 'localhost',
  port: Number(process.env.PGPORT ?? 5433),
  user: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'x',
  database: process.env.PGDATABASE ?? 'grinta_perf',
});
await db.connect();

let fakeIp = 0;
async function http(method, path, token, body) {
  // A distinct client address per request keeps the global rate limiter out of the measurement.
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.${(fakeIp >> 16) & 255}.${(fakeIp >> 8) & 255}.${fakeIp++ & 255}`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, bytes: Buffer.byteLength(text), text };
}

// Bytes actually sent for one response when the client accepts compression,
// as a phone does.
function wireBytes(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const payload = body ? JSON.stringify(body) : undefined;
    const req = request(url, {
      method,
      headers: {
        'Accept-Encoding': 'br, gzip',
        'Content-Type': 'application/json',
        'X-Forwarded-For': `10.${(fakeIp >> 16) & 255}.${(fakeIp >> 8) & 255}.${fakeIp++ & 255}`,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let n = 0;
      res.on('data', (c) => (n += c.length));
      res.on('end', () => resolve(n));
    });
    req.on('error', reject);
    req.end(payload);
  });
}

const dbEgress = async () =>
  process.env.DB_EGRESS_URL ? (await (await fetch(process.env.DB_EGRESS_URL)).json()).bytes : 0;

const login = await http('POST', '/auth/login', null, { identifier: MAIN_EMAIL, password: MAIN_PASSWORD });
const token = JSON.parse(login.text).access_token;
const one = async (sql) => (await db.query(sql)).rows[0];

const me = (await one(`SELECT id FROM users WHERE email = '${MAIN_EMAIL}'`)).id;
const publicPost = (await one(`
  SELECT p.id FROM posts p JOIN users u ON u.id = p."userId"
  WHERE u."isPublic" ORDER BY (SELECT count(*) FROM post_comments c WHERE c."postId" = p.id) DESC LIMIT 1`)).id;
const myWorkout = (await one(`SELECT id FROM completed_workouts WHERE "userId" = '${me}' ORDER BY "completionDate" DESC LIMIT 1`)).id;
const myPlanned = (await one(`SELECT id FROM planned_workouts WHERE "userId" = '${me}' LIMIT 1`)).id;
const myProgramme = (await one(`SELECT id FROM programmes WHERE "userId" = '${me}' LIMIT 1`)).id;
const exerciseIds = (await db.query('SELECT id FROM exercises LIMIT 6')).rows.map((r) => r.id);
const sets = [{ reps: 8, weight: 60 }, { reps: 8, weight: 60 }, { reps: 6, weight: 65 }];
const today = new Date().toISOString();

const cases = [
  ['GET /posts/feed/following', 'GET', '/posts/feed/following'],
  ['GET /posts/feed/top', 'GET', '/posts/feed/top'],
  ['GET /posts/:id', 'GET', `/posts/${publicPost}`],
  ['GET /posts/:id/comments', 'GET', `/posts/${publicPost}/comments`],
  ['GET /posts/:id/likes', 'GET', `/posts/${publicPost}/likes`],
  ['GET /posts/mine', 'GET', '/posts/mine'],
  ['GET /workouts/completed', 'GET', '/workouts/completed'],
  ['GET /workouts/completed?limit=20', 'GET', '/workouts/completed?limit=20'],
  ['GET /workouts/planned', 'GET', '/workouts/planned'],
  ['GET /workouts/completed/:id', 'GET', `/workouts/completed/${myWorkout}`],
  ['GET /workouts/planned/:id', 'GET', `/workouts/planned/${myPlanned}`],
  ['GET /programmes', 'GET', '/programmes'],
  ['GET /programmes/:id', 'GET', `/programmes/${myProgramme}`],
  ['GET /stats/summary', 'GET', '/stats/summary?period=month'],
  ['GET /stats/muscle-distribution', 'GET', '/stats/muscle-distribution?period=month'],
  ['GET /stats/balance', 'GET', '/stats/balance?period=month'],
  ['GET /stats/consistency', 'GET', '/stats/consistency'],
  ['GET /stats/muscle-frequency', 'GET', '/stats/muscle-frequency'],
  ['GET /stats/workout/:id', 'GET', `/stats/workout/${myWorkout}`],
  ['GET /stats/progression', 'GET', `/stats/progression?exerciseId=${exerciseIds[0]}&period=1y`],
  ['GET /stats/records', 'GET', '/stats/records'],
  ['GET /stats/comparisons', 'GET', '/stats/comparisons?period=month'],
  ['GET /stats/adherence', 'GET', `/stats/adherence?completedWorkoutId=${myWorkout}&plannedWorkoutId=${myPlanned}`],
  ['GET /users/:id/profile', 'GET', `/users/${me}/profile`],
  ['GET /users/search', 'GET', '/users/search?q=perfuser1'],
  ['GET /connections/recommendations', 'GET', '/connections/recommendations'],
  ['GET /connections/:id/followers', 'GET', `/connections/${me}/followers`],
  ['GET /exercises', 'GET', '/exercises'],
  ['GET /exercises/:id', 'GET', `/exercises/${exerciseIds[0]}`],
  ['POST /workouts/completed (6 exercises)', 'POST', '/workouts/completed', () => ({
    title: 'Bench', completionDate: today, totalDurationSeconds: 3000,
    exercises: exerciseIds.map((exerciseId) => ({ exerciseId, sets })),
  })],
  ['PATCH /workouts/planned/:id (6 exercises)', 'PATCH', `/workouts/planned/${myPlanned}`, () => ({
    exercises: exerciseIds.map((exerciseId) => ({ exerciseId, sets })),
  })],
  ['POST /programmes (7 days)', 'POST', '/programmes', () => ({
    weekNumber: 1, difficulty: 'BEGINNER', locationType: 'GYM', title: 'Bench programme',
    days: Array.from({ length: 7 }, (_, i) => ({ dayNumber: i + 1, workoutId: i % 2 ? undefined : myPlanned })),
  })],
];

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const p95 = (a) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.ceil(a.length * 0.95) - 1)];
const results = [];

for (const [name, method, path, makeBody] of cases) {
  for (let i = 0; i < 2; i++) await http(method, path, token, makeBody?.()); // warm-up
  await db.query('SELECT pg_stat_statements_reset()');
  const egressBefore = await dbEgress();
  const times = [];
  let bytes = 0;
  let status = 0;

  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const r = await http(method, path, token, makeBody?.());
    times.push(performance.now() - t0);
    bytes = r.bytes;
    status = r.status;
  }
  const egress = (await dbEgress()) - egressBefore;
  const wire = method === 'GET' ? await wireBytes(method, path, token) : null;
  const { rows } = await db.query(`
    SELECT coalesce(sum(calls), 0)::int AS calls, coalesce(sum(total_exec_time), 0) AS ms
    FROM pg_stat_statements WHERE query NOT ILIKE '%pg_stat_statements%'`);

  results.push({
    name, status,
    queries: +(rows[0].calls / RUNS).toFixed(1),
    dbMs: +(rows[0].ms / RUNS).toFixed(1),
    p50: +median(times).toFixed(1),
    p95: +p95(times).toFixed(1),
    kb: +(bytes / 1024).toFixed(1),
    wireKb: wire === null ? null : +(wire / 1024).toFixed(1),
    dbKb: +(egress / RUNS / 1024).toFixed(1),
  });
}

const line = (r) =>
  `${r.name.padEnd(42)} ${String(r.status).padEnd(4)} ${String(r.queries).padStart(7)} ${String(r.dbMs).padStart(8)} ${String(r.p50).padStart(8)} ${String(r.p95).padStart(8)} ${String(r.kb).padStart(9)} ${String(r.wireKb ?? '-').padStart(8)} ${String(r.dbKb).padStart(8)}`;

console.log(`${'endpoint'.padEnd(42)} ${'http'.padEnd(4)} ${'queries'.padStart(7)} ${'db ms'.padStart(8)} ${'p50 ms'.padStart(8)} ${'p95 ms'.padStart(8)} ${'resp KB'.padStart(9)} ${'wire KB'.padStart(8)} ${'db KB'.padStart(8)}`);
results.forEach((r) => console.log(line(r)));
if (args.out) writeFileSync(args.out, JSON.stringify({ label: args.label, runs: RUNS, results }, null, 2));
await db.end();
