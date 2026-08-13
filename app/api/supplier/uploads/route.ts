import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireActiveSupplierApi } from "@/lib/supplier-access";

export async function POST(request: Request) {
  const supplierContext = await requireActiveSupplierApi();
  if ("response" in supplierContext) return supplierContext.response;

  try {
    const body = await request.json() as HandleUploadBody;
    const userId = supplierContext.access.session.user.id;
    const prefix = `suppliers/${userId}/`;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(prefix)) throw new Error("Destino de imagem inválido.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
    });
    return Response.json(response);
  } catch (error) {
    console.error("[supplier/uploads]", error);
    return Response.json({ error: "Não foi possível autorizar o envio da foto." }, { status: 400 });
  }
}
