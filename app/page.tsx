import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";

export default async function RootPage() {
  redirect(`/${await getLocale()}`);
}
