import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { performance } from "node:perf_hooks";

/**
 * Synthetic scalability benchmark, never writes to a production table.
 * Logs median PostgreSQL query round-trip timings for 2,000 dealers/50,000 cars.
 * These figures are NOT browser or Vercel response times.
 */
test("synthetische voorraad: 2.000 dealers en 50.000 auto's, filtering zonder/ met index", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(?:ql)?:\/\/[^@]+@(?:127\.0\.0\.1|localhost):5432\/ikkenauto_test(?:\?|$)/.test(url)) {
    throw new Error("Benchmarks mogen uitsluitend de lokale ikkenauto_test-database gebruiken.");
  }
  const client = new pg.Client({connectionString:url});
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TEMP TABLE benchmark_portal_stock ON COMMIT DROP AS
      SELECT i::bigint AS id, (i % 2000)::integer AS dealer_id,
        CASE WHEN i % 2 = 1 THEN 'ready' ELSE 'draft' END::text AS status,
        CASE WHEN i % 3 = 2 THEN 'Diesel' WHEN i % 3 = 1 THEN 'Benzine' ELSE 'Elektrisch' END::text AS fuel,
        (12000 + (i % 50000))::integer AS price_eur,
        (2010 + (i % 17))::integer AS year,
        (i * 97 % 250000)::integer AS mileage_km,
        now() - i * interval '4 minutes' AS created_at
      FROM generate_series(1, 50000) i;
    `);
    await client.query("ANALYZE benchmark_portal_stock");
    const sql = `SELECT id FROM benchmark_portal_stock WHERE dealer_id=17 AND status='ready'
      AND fuel='Diesel' AND price_eur BETWEEN 11000 AND 70000
      ORDER BY created_at DESC LIMIT 25`;
    async function run(): Promise<{medianMs:number; rows:number[]}> {
      const timings:number[] = [];
      let resultIds:number[] = [];
      for (let i=0;i<12;i++) {
        const start=performance.now();
        const result=await client.query<{id:number}>(sql);
        timings.push(performance.now()-start);
        resultIds=result.rows.map(r=>Number(r.id));
      }
      timings.sort((a,b)=>a-b);
      return {medianMs:Number(((timings[5]+timings[6])/2).toFixed(3)),rows:resultIds};
    }
    const before=await run();
    await client.query("CREATE INDEX benchmark_stock_lookup_idx ON benchmark_portal_stock(dealer_id,status,created_at DESC)");
    await client.query("CREATE INDEX benchmark_stock_fuel_price_idx ON benchmark_portal_stock(dealer_id,fuel,price_eur)");
    await client.query("ANALYZE benchmark_portal_stock");
    const after=await run();
    assert.ok(before.rows.length>0);
    assert.deepEqual(after.rows,before.rows,"Indexering mag zoekresultaten niet veranderen.");
    const plan=await client.query<{ "QUERY PLAN":string }>("EXPLAIN (ANALYZE, FORMAT TEXT) "+sql);
    console.log(JSON.stringify({
      benchmark:"synthetic_dealer_stock", dealers:2000, vehicles:50000,
      filters:["dealer_id","status","fuel","price_eur"],indexApplied:true,
      medianBeforeMs:before.medianMs,medianAfterMs:after.medianMs,
      speedup: Number((before.medianMs/Math.max(after.medianMs,0.001)).toFixed(2)),
      plan:plan.rows.map(row=>row["QUERY PLAN"]).slice(0,5),
      environment:"ephemeral Postgres in CI; not public web performance",
    }));
    await client.query("ROLLBACK");
  } finally { await client.end(); }
});
