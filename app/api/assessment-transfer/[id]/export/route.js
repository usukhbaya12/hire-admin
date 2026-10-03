import { NextResponse } from "next/server";
import { apiInternal as api } from "@/utils/routes";
import { getAuthToken } from "@/utils/auth";

// Тестийг (assessment) бүх агуулга, зурагтай нь НЭГ JSON файл болгож татна.
// Өөр орчны (жиш: test → prod) admin-ийн "JSON-оос оруулах"-аар оруулна.
// Route handler (server action биш): файл хэдэн MB байж болох тул browser руу
// шууд attachment болгон урсгана.
export async function GET(_req, context) {
  const { id } = await context.params;
  if (!/^\d+$/.test(String(id))) {
    return NextResponse.json({ message: "Тестийн ID буруу байна." }, { status: 400 });
  }
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ message: "Дахин нэвтэрнэ үү." }, { status: 401 });
  }
  try {
    const res = await fetch(`${api}assessment-transfer/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.succeed) {
      return NextResponse.json(
        { message: json?.message || json?.payload?.message || "Тест татахад алдаа гарлаа." },
        { status: res.ok ? 400 : res.status },
      );
    }
    const bundle = json.payload;
    const date = new Date().toISOString().slice(0, 10);
    const slug =
      String(bundle?.source?.name ?? "")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "test";
    const filename = `hire-test-${id}-${slug}-${date}.json`;
    return new NextResponse(JSON.stringify(bundle), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="hire-test-${id}-${date}.json"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Сервертэй холбогдоход алдаа гарлаа." }, { status: 502 });
  }
}
