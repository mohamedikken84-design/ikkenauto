import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VehicleEditor } from "@/components/vehicle-editor";
import { resolveActor } from "@/lib/dealer/auth";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Auto toevoegen",
  description: "Zet een auto als concept in de eigen voorraad.",
  path: "/account/voorraad/nieuw",
});

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<p className="px-4 py-16">Formulier laden…</p>}>
      <NewVehicleScreen />
    </Suspense>
  );
}

async function NewVehicleScreen() {
  const token = (await cookies()).get("ikken_session")?.value ?? "";
  const actor = token ? await resolveActor(token).catch(() => null) : null;
  if (!actor?.dealerId) redirect("/account/login");
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">Auto toevoegen</h1>
      <VehicleEditor vehicle={null} />
    </article>
  );
}
