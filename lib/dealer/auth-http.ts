import { randomBytes, timingSafeEqual } from "node:crypto";
import { AuthConfigError, readBearerToken, resolveActor } from "@/lib/dealer/auth";
import {
  AccountFieldError,
  AccountInputError,
  confirmPasswordReset,
  createGarageClaim,
  loginAccount,
  logoutAccount,
  readOwnProfile,
  registerAccount,
  requestPasswordReset,
  resendVerification,
  verifyEmailToken,
} from "@/lib/dealer/account";
import { RateLimitError } from "@/lib/dealer/rate-limit";

const sessionCookie = "ikken_session";
const csrfCookie = "ikken_csrf";

function json(body: unknown, status = 200, headers?: Headers) {
  const response = Response.json(body, { status });
  headers?.forEach((value, key) => response.headers.append(key, value));
  return response;
}

function cookie(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(header);
  return match ? decodeURIComponent(match[1]) : "";
}

export function readSessionToken(request: Request) {
  return readBearerToken(request) || readCookie(request, sessionCookie);
}

function clientKey(request: Request) {
  return (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0]?.trim() || "unknown";
}

function assertOrigin(request: Request) {
  const expected = (process.env.APP_ORIGIN ?? "").replace(/\/$/, "");
  if (!expected) throw new AuthConfigError("APP_ORIGIN ontbreekt.");
  const origin = request.headers.get("origin");
  if (origin && origin !== expected) throw new AccountInputError("Herkomst geweigerd.");
  if (!origin) {
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") throw new AccountInputError("Herkomst geweigerd.");
  }
}

function assertCsrf(request: Request, token: string) {
  const cookieToken = readCookie(request, csrfCookie);
  const left = Buffer.from(token);
  const right = Buffer.from(cookieToken);
  if (!token || left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new AccountInputError("Beveiligingstoken ontbreekt of is verlopen.");
  }
}

export function handleCsrf() {
  const token = randomBytes(32).toString("base64url");
  const headers = new Headers();
  headers.append("set-cookie", cookie(csrfCookie, token, 60 * 30));
  return json({ token }, 200, headers);
}

async function readBody(request: Request) {
  return (await request.json()) as Record<string, unknown>;
}

function fail(error: unknown) {
  if (error instanceof RateLimitError) {
    return json({ message: "U hebt te vaak geprobeerd. Wacht 15 minuten en probeer opnieuw.", error: "te veel pogingen" }, 429);
  }
  if (error instanceof AuthConfigError) {
    return json({ message: "Deze functie is tijdelijk niet beschikbaar. Probeer het later opnieuw.", error: "auth-niet-beschikbaar" }, 503);
  }
  if (error instanceof AccountFieldError) return json({ message: error.message, fields: error.fields }, 400);
  if (error instanceof AccountInputError) return json({ message: error.message }, 400);
  throw error;
}

export async function handleRegister(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    if (body.role || body.dealerId || body.marketingOptIn) {
      return json({ message: "Die keuze hoort niet bij registratie." }, 400);
    }
    const result = await registerAccount(
      {
        kind: String(body.kind ?? ""),
        displayName: String(body.displayName ?? ""),
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
        passwordConfirm: String(body.passwordConfirm ?? ""),
        acceptTerms: body.acceptTerms === true || body.acceptTerms === "on",
        locale: String(body.locale ?? "nl"),
        tradeName: String(body.tradeName ?? ""),
        kboNumber: String(body.kboNumber ?? ""),
        vatNumber: String(body.vatNumber ?? ""),
        postalCode: String(body.postalCode ?? ""),
        city: String(body.city ?? ""),
      },
      clientKey(request),
    );
    return json(result);
  } catch (error) {
    return fail(error);
  }
}

export async function handleVerify(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    const ok = await verifyEmailToken(String(body.token ?? ""));
    if (!ok) return json({ message: "Deze bevestigingslink is ongeldig of al gebruikt." }, 400);
    return json({ message: "Uw e-mailadres is bevestigd. U kunt zich nu aanmelden." });
  } catch (error) {
    return fail(error);
  }
}

export async function handleLogin(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    const result = await loginAccount(String(body.email ?? ""), String(body.password ?? ""), clientKey(request));
    const headers = new Headers();
    if (result.token) headers.append("set-cookie", cookie(sessionCookie, result.token, 60 * 60 * 8));
    const actor = result.token ? await resolveActor(result.token) : null;
    const profile = actor ? await readOwnProfile(actor).catch(() => null) : null;
    const garage = profile?.garage;
    const next = garage?.trade_name && garage.city ? "/account/voorraad" : "/account/garage?welkom=1";
    return json({ ok: true, next }, 200, headers);
  } catch (error) {
    return fail(error);
  }
}

export async function handleLogout(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    await logoutAccount(readAnySessionToken(request));
    const headers = new Headers();
    headers.append("set-cookie", cookie(sessionCookie, "", 0));
    return json({ ok: true }, 200, headers);
  } catch (error) {
    return fail(error);
  }
}

export function readAnySessionToken(request: Request) {
  const bearer = readBearerToken(request);
  if (bearer) return bearer;
  const header = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)ikken_session=([^;]+)/.exec(header);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function handleResend(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    const result = await resendVerification(String(body.email ?? ""), clientKey(request));
    return json(result);
  } catch (error) {
    return fail(error);
  }
}

export async function handleRecovery(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    const result = await requestPasswordReset(String(body.email ?? ""), clientKey(request));
    return json(result);
  } catch (error) {
    return fail(error);
  }
}

export async function handleRecoveryConfirm(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    await confirmPasswordReset(String(body.token ?? ""), String(body.password ?? ""), String(body.passwordConfirm ?? ""));
    return json({ message: "Uw wachtwoord is bijgewerkt. Meld u opnieuw aan." });
  } catch (error) {
    return fail(error);
  }
}

export async function handleSession(request: Request) {
  try {
    const actor = await resolveActor(readAnySessionToken(request));
    if (!actor) return json({ account: null });
    return json({
      account: { role: actor.role, emailVerified: true },
    });
  } catch (error) {
    if (error instanceof AuthConfigError) return json({ error: "auth-niet-beschikbaar" }, 503);
    throw error;
  }
}

export async function handleClaim(request: Request) {
  try {
    assertOrigin(request);
    const body = await readBody(request);
    assertCsrf(request, String(body.csrf ?? ""));
    const actor = await resolveActor(readAnySessionToken(request));
    if (!actor) return json({ error: "unauthorized" }, 401);
    await createGarageClaim(actor, String(body.kboNumber ?? ""), String(body.evidence ?? ""));
    return json({ message: "Aanvraag ontvangen. Er is geen garage overgedragen." });
  } catch (error) {
    return fail(error);
  }
}

