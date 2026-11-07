import { handleRecovery } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleRecovery(request);
}
