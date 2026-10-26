// TCP proxy between the API and Postgres that counts the bytes Postgres sends
// back, which is what Supabase bills as database egress. perf/bench.mjs reads
// the counter when DB_EGRESS_URL is set.
//
//   PGHOST=localhost PGPORT=5433 PROXY_PORT=5434 STATS_PORT=5435 node perf/db-egress-proxy.mjs
//   # then start the API with DB_PORT=5434
//   DB_EGRESS_URL=http://localhost:5435 node perf/bench.mjs
//
// Measurement tool only: never put it in front of a production database.

import { createServer as createHttpServer } from 'node:http';
import { connect, createServer } from 'node:net';

const target = { host: process.env.PGHOST ?? 'localhost', port: Number(process.env.PGPORT ?? 5433) };
let bytes = 0;

createServer((client) => {
  const server = connect(target);
  client.setNoDelay(true);
  server.setNoDelay(true);
  server.on('data', (chunk) => (bytes += chunk.length));
  client.pipe(server).pipe(client);
  const close = () => { client.destroy(); server.destroy(); };
  client.on('error', close);
  server.on('error', close);
}).listen(Number(process.env.PROXY_PORT ?? 5434));

createHttpServer((_req, res) => res.end(JSON.stringify({ bytes }))).listen(
  Number(process.env.STATS_PORT ?? 5435),
);
