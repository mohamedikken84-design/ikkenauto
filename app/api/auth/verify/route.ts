import { handleVerify } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleVerify(request);
}
