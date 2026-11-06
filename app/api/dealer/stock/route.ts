import { handleCreateStock, handleListStock } from "@/lib/dealer/stock-http";

export function GET(request: Request) {
  return handleListStock(request);
}

export function POST(request: Request) {
  return handleCreateStock(request);
}
