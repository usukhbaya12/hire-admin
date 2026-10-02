import { NextResponse } from "next/server";
import { apiInternal as api } from "@/utils/routes";
import { getAuthToken } from "@/utils/auth";

// "JSON-оос оруулах": өөр орчноос татсан тестийн JSON файлыг core руу дамжуулж
// ШИНЭ тест ("Архив" төлөвтэй) үүсгэнэ. Server action-ий bodySizeLimit (20mb)-д
// баригдахгүйн тулд route handler-аар биеийг шууд дамжуулна.
export async function POST(req) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Дахин нэвтэрнэ үү." }, { status: 401 });
  }
  let body;
  try {
    body = await req.text();
    JSON.parse(body);
  } catch {
    return NextResponse.json({ success: false, message: "JSON файл уншигдсангүй." }, { status: 400 });
  }
  try {
    const res = await fetch(`${api}assessment-transfer/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!json?.succeed) {
      return NextResponse.json(
        { success: false, message: json?.message || json?.payload?.message || "Тест оруулахад алдаа гарлаа." },
        { status: res.ok ? 400 : res.status },
      );
    }
    return NextResponse.json({ success: true, data: json.payload });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Сервертэй холбогдоход алдаа гарлаа." }, { status: 502 });
  }
}
