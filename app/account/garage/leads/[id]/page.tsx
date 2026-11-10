import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { LeadStatusForm } from "@/components/lead-status-form";
import { resolveActor } from "@/lib/dealer/auth";
import { listGarageLeads } from "@/lib/dealer/leads";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Aanvraag",
  description: "Detail van een aanvraag over een auto.",
  path: "/account/garage/leads",
});

export default function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Aanvraag laden…</p>}>
      <LeadScreen params={params} />
    </Suspense>
  );
}

async function LeadScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor?.dealerId) redirect("/account/login");
  const lead = (await listGarageLeads(actor)).find((item) => item.id === id);
  if (!lead) notFound();
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <p>
        <Link className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4" href="/account/garage/leads">
          Alle aanvragen
        </Link>
      </p>
      <h1 className="mt-4 font-display text-4xl">{lead.name}</h1>
      <p className="mt-2 text-muted">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
      <p className="mt-6 leading-relaxed">{lead.message}</p>
      <LeadStatusForm leadId={lead.id} status={lead.status} />
    </article>
  );
}
