import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleLogin } from "@/lib/dealer/auth-http";

describe("csrf-locale", () => {
  it("geeft de Franse csrf-zin wanneer de taal Frans is", async () => {
    process.env.APP_ORIGIN = "http://127.0.0.1:3000";
    process.env.AUTH_MODE = "development-session";
    const response = await handleLogin(
      new Request("http://127.0.0.1:3000/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:3000",
          "content-type": "application/json",
          cookie: "ikken_csrf=andere-waarde",
        },
        body: JSON.stringify({ csrf: "verkeerd", uiLocale: "fr", email: "a@example.test", password: "wachtwoord-12" }),
      }),
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as { message: string };
    assert.equal(body.message, "Le jeton de sécurité est manquant ou a expiré. Veuillez recharger la page.");
  });
});
