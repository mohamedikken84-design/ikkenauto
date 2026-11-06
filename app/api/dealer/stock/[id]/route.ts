import { handleUpdateStock } from "@/lib/dealer/stock-http";

export async function PATCH(request: Request, context: RouteContext<"/api/dealer/stock/[id]">) {
  const { id } = await context.params;
  return handleUpdateStock(request, id);
}
