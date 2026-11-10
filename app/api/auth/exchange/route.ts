import { handleExchange } from "@/lib/dealer/auth-http";

export async function GET(request: Request) {
  return handleExchange(request);
}
