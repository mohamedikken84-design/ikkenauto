import { handleUpdateLead } from "@/lib/dealer/leads-http";

export async function PATCH(request: Request, context: RouteContext<"/api/dealer/leads/[id]">) {
  const { id } = await context.params;
  return handleUpdateLead(request, id);
}
