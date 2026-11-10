import { handleKeepAlive } from "@/lib/dealer/keep-alive";

export async function GET(request: Request) {
  return handleKeepAlive(request);
}
