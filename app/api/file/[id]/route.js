import { NextResponse } from "next/server";
import { apiInternal } from "@/utils/routes";

// Browser-т харагдах файлыг (зураг, PDF) core-оос татаж дамжуулна — `utils/fileUrl.js`-ийн
// тайлбарыг үз. Core-ийн `GET file/:file` нь @Public тул token хэрэггүй.

// fileId core-ийн `file/<нэр>`-д шууд залгагдана: нэг сегментээс өөрийг зөвшөөрөхгүй
// (`../` нь fetch-ийн URL normalize-оор core-ийн ӨӨР path руу гаргана). Юникод / зай
// зөвшөөрнө (upload нь `${Date.now()}_${originalname}` нэр ашигладаг).
const isSafeFileId = (id) =>
  typeof id === "string" &&
  id.length > 0 &&
  id.length <= 255 &&
  id !== "." &&
  id !== ".." &&
  !/[\0/\\]/.test(id);

export async function GET(_request, context) {
  const { id } = await context.params;
  if (!isSafeFileId(id)) {
    return new NextResponse("Invalid file ID", { status: 400 });
  }

  let response;
  try {
    response = await fetch(`${apiInternal}file/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("FILE PROXY ERROR:", id, error?.message);
    return new NextResponse("File fetch failed", { status: 502 });
  }

  if (!response.ok) {
    const notFound = response.status === 404;
    return new NextResponse(notFound ? "File not found" : "File fetch failed", {
      status: notFound ? 404 : 502,
    });
  }

  // Файлын нэр `${Date.now()}_…` тул агуулга өөрчлөгддөггүй → immutable.
  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
