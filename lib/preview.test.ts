import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { previewAllows } from "@/lib/preview";

describe("preview-afscherming", () => {
  it("laat alles door wanneer er geen sleutel is", () => {
    assert.equal(previewAllows({ password: undefined, cookie: undefined, pathname: "/nl/autos" }), true);
  });

  it("stuurt een publieke pagina naar de teaser zonder cookie", () => {
    assert.equal(previewAllows({ password: "sleutel", cookie: undefined, pathname: "/nl/autos" }), false);
  });

  it("laat account en de teaser zelf door", () => {
    assert.equal(previewAllows({ password: "sleutel", cookie: undefined, pathname: "/account/login" }), true);
    assert.equal(previewAllows({ password: "sleutel", cookie: undefined, pathname: "/teaser" }), true);
    assert.equal(previewAllows({ password: "sleutel", cookie: undefined, pathname: "/api/cron/keep-alive" }), true);
  });

  it("opent de site met de juiste cookie", () => {
    assert.equal(previewAllows({ password: "sleutel", cookie: "sleutel", pathname: "/" }), true);
    assert.equal(previewAllows({ password: "sleutel", cookie: "fout", pathname: "/" }), false);
  });
});
