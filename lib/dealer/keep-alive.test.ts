import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { handleKeepAlive } from "@/lib/dealer/keep-alive";

describe("keep-alive", () => {
  const previous = process.env.CRON_SECRET;

  before(() => {
    process.env.CRON_SECRET = "cron-test-geheim";
  });

  after(() => {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  });

  it("weigert een verzoek zonder het cron-geheim", async () => {
    const response = await handleKeepAlive(new Request("http://127.0.0.1:3000/api/cron/keep-alive"));
    assert.equal(response.status, 401);
  });

  it("houdt de database wakker met het juiste geheim", async () => {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ontbreekt.");
    const response = await handleKeepAlive(
      new Request("http://127.0.0.1:3000/api/cron/keep-alive", {
        headers: { authorization: "Bearer cron-test-geheim" },
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(((await response.json()) as { ok: boolean }).ok, true);
  });
});
