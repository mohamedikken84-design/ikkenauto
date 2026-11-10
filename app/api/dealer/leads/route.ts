import { handleListLeads } from "@/lib/dealer/leads-http";

export async function GET(request: Request) {
  return handleListLeads(request);
}
