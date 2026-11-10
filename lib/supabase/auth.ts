import type { RegistrationInput } from "@/lib/dealer/account";
import { AccountInputError } from "@/lib/dealer/errors";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function registerWithSupabase(input: RegistrationInput) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: { display_name: input.displayName.trim() },
      emailRedirectTo: `${process.env.APP_ORIGIN?.replace(/\/$/, "") ?? ""}/account/verifieer`,
    },
  });
  if (error) throw new AccountInputError("Registratie is nu niet gelukt. Probeer het later opnieuw.");
  return {
    message: "Als dit e-mailadres nog vrij is, sturen wij een bevestigingsbericht. Dat kan enkele minuten duren.",
  };
}

export async function loginWithSupabase(email: string, password: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new AccountInputError("Onjuiste gegevens, of het adres is nog niet bevestigd.");
  return { token: "" };
}
