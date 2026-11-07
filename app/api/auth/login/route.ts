import { handleLogin } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleLogin(request);
}
