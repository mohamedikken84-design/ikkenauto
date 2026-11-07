import { handleSession } from "@/lib/dealer/auth-http";

export function GET(request: Request) {
  return handleSession(request);
}
