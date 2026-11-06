import { handleImportStock } from "@/lib/dealer/stock-http";

export function POST(request: Request) {
  return handleImportStock(request);
}
