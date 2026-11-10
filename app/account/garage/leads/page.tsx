import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveActor } from "@/lib/dealer/auth";
import { listGarageLeads } from "@/lib/dealer/leads";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Aanvragen",
  description: "Aanvragen over de auto's van uw garage.",
  path: "/account/garage/leads",
});

const labels: Record<string, string> = {
  new: "Nieuw",
  in_progress: "In behandeling",
  won: "Gewonnen",
  lost: "Verloren",
  spam: "Spam",
};

export default function LeadsPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">Aanvragen laden…</p>}>
      <LeadsScreen />
    </Suspense>
  );
}

async function LeadsScreen() {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor?.dealerId) redirect("/account/login");
  const leads = await listGarageLeads(actor);
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">Aanvragen</h1>
      <p className="mt-3 text-muted">Berichten van geïnteresseerden over uw auto&apos;s. Er gaat geen e-mail de deur uit.</p>
      {leads.length === 0 ? (
        <p className="mt-8">Nog geen aanvragen.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {leads.map((lead) => (
            <li key={lead.id} className="border border-line bg-surface p-4">
              <Link className="font-semibold underline decoration-gold decoration-2 underline-offset-4" href={`/account/garage/leads/${lead.id}`}>
                {lead.name}
              </Link>
              <p className="mt-1 text-sm text-muted">{labels[lead.status] ?? lead.status} · {lead.email}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
