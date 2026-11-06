import { handleAdminListStock } from "@/lib/dealer/stock-http";

export function GET(request: Request) {
  return handleAdminListStock(request);
}
