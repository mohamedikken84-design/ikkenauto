import { handleDeleteStock, handleGetStock, handleUpdateStock } from "@/lib/dealer/stock-http";

export async function GET(request: Request, context: RouteContext<"/api/dealer/stock/[id]">) {
  const { id } = await context.params;
  return handleGetStock(request, id);
}

export async function PATCH(request: Request, context: RouteContext<"/api/dealer/stock/[id]">) {
  const { id } = await context.params;
  return handleUpdateStock(request, id);
}

export async function DELETE(request: Request, context: RouteContext<"/api/dealer/stock/[id]">) {
  const { id } = await context.params;
  return handleDeleteStock(request, id);
}
