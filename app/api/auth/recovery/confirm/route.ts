import { handleRecoveryConfirm } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleRecoveryConfirm(request);
}
