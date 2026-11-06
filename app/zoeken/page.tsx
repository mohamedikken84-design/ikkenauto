import { redirect } from "next/navigation";
import { Suspense } from "react";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Zoeken",
  description: "Doorverwijzing naar de zoekresultaten van IKKENAUTO.be.",
  path: "/zoeken",
  index: false,
});

export default function ZoekenPage(props: PageProps<"/zoeken">) {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-lg">Zoekresultaten openen…</p>}>
      <ForwardSearch searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ForwardSearch({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  const take = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim();
  };
  const make = take("merk");
  const model = take("model");
  const price = take("prijsTot") ?? take("prijs");
  if (make) next.set("merk", make);
  if (model) next.set("model", model);
  if (price) next.set("prijsTot", price);
  const query = next.toString();
  redirect(query ? `/nl/autos?${query}` : "/nl/autos");
  return null;
}
