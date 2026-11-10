import { handleLocale } from "@/lib/dealer/auth-http";

export async function POST(request: Request) {
  return handleLocale(request);
}
