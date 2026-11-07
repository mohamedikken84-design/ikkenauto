import { handleLogout } from "@/lib/dealer/auth-http";

export function POST(request: Request) {
  return handleLogout(request);
}
