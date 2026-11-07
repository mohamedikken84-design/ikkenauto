import { handleRegister } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleRegister(request);
}
