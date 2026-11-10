import { handlePreviewImport } from "@/lib/dealer/stock-http";

export function POST(request: Request) {
  return handlePreviewImport(request);
}
