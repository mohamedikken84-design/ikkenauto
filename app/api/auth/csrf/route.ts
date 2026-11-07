import { handleCsrf } from "@/lib/dealer/auth-http";

export function GET() {
  return handleCsrf();
}
