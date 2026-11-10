import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { VehicleEditor } from "@/components/vehicle-editor";
import { resolveActor } from "@/lib/dealer/auth";
import { getOwnVehicle } from "@/lib/dealer/stock";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Auto bewerken",
  description: "Bewerk een auto uit de eigen voorraad.",
  path: "/account/voorraad",
});

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-16">Auto laden…</p>}>
      <EditVehicleScreen params={params} />
    </Suspense>
  );
}

async function EditVehicleScreen({ params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor?.dealerId) redirect("/account/login");
  const vehicle = await getOwnVehicle(actor, (await params).id);
  if (!vehicle) notFound();
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">Auto bewerken</h1>
      <VehicleEditor vehicle={vehicle} />
    </article>
  );
}
