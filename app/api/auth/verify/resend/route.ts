import { handleResend } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleResend(request);
}
