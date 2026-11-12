import { redirect } from "next/navigation";

/** Direct access for returning garage owners. */
export default function LoginDealer() {
  redirect("/portal?aanmelden=1#account");
}
