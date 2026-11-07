import { handleClaim } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleClaim(request);
}
