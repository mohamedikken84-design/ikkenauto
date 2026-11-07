import { getPool } from "@/lib/db/client";
import { AuthConfigError } from "@/lib/dealer/auth";

export type MailMessage = {
  recipientEmail: string;
  subject: string;
  body: string;
};

export function assertMailAllowed() {
  const transport = process.env.MAIL_TRANSPORT?.trim() ?? "";
  const production = process.env.NODE_ENV === "production" || process.env.AUTH_MODE === "production";
  if (production) {
    throw new AuthConfigError(
      "Productiemail is niet gekoppeld. De lokale mailsink en ontwikkeltekens zijn in productie uitgeschakeld.",
    );
  }
  if (transport !== "local") {
    throw new AuthConfigError("Zonder productieconfiguratie is alleen MAIL_TRANSPORT=local toegestaan.");
  }
}

export async function sendAuthMail(message: MailMessage) {
  assertMailAllowed();
  await getPool().query(
    `INSERT INTO local_mail_messages (recipient_email, subject, body) VALUES ($1, $2, $3)`,
    [message.recipientEmail, message.subject, message.body],
  );
}
