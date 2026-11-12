import { redirect } from "next/navigation";

/** Shareable short link for dealer outreach. */
export default function RegisterDealer() {
  redirect("/portal?registreren=1#account");
}
