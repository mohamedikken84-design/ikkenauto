import { handleCreateLead } from "@/lib/dealer/leads-http";

export async function POST(request: Request) {
  return handleCreateLead(request);
}
