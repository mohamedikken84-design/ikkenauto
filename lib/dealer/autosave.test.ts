import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { createAutosave } from "@/lib/dealer/autosave";

test("autosave wacht en schrijft niet meteen", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  let writes = 0;
  const autosave = createAutosave(1500, () => {
    writes += 1;
  });
  autosave.schedule();
  autosave.schedule();
  assert.equal(writes, 0);
  mock.timers.tick(1499);
  assert.equal(writes, 0);
  mock.timers.tick(1);
  assert.equal(writes, 1);
  mock.timers.reset();
});
