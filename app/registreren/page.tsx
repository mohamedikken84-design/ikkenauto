import { redirect } from "next/navigation";

export default function RegisterGarage(){
 redirect("/portal?registreren=1#account");
}
