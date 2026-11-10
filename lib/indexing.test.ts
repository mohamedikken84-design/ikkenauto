import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { indexingClosed } from "@/lib/indexing";

describe("indexering zolang de site gesloten is", () => {
  const previous = process.env.PUBLIC_CLOSED;

  after(() => {
    if (previous === undefined) delete process.env.PUBLIC_CLOSED;
    else process.env.PUBLIC_CLOSED = previous;
  });

  it("blijft gesloten voor crawlers zonder PUBLIC_CLOSED=false", async () => {
    delete process.env.PUBLIC_CLOSED;
    assert.equal(await indexingClosed(), true);
  });

  it("blijft gesloten wanneer de database public_closed nog true is", async () => {
    process.env.PUBLIC_CLOSED = "false";
    if (!process.env.DATABASE_URL) return;
    assert.equal(await indexingClosed(), true);
  });
});
