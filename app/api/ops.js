"use server";

// №14 — тайлангийн ops (core `/ops/*`, зөвхөн super admin). Бүх дуудлага сервер
// талаас (токен браузерт гарахгүй).
import { apiInternal as api } from "@/utils/routes";
import { getAuthToken } from "@/utils/auth";

const call = async (method, path, { json, form } = {}) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${api}${path}`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
        ...(json ? { "Content-Type": "application/json" } : {}),
      },
      body: json ? JSON.stringify(json) : form,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.succeed === false) {
      return {
        success: false,
        status: res.status,
        message: body?.message || `Алдаа гарлаа (${res.status})`,
      };
    }
    return { success: true, data: body?.payload ?? body };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Сервертэй холбогдоход алдаа гарлаа." };
  }
};

export const opsReportStatus = async (code) =>
  call("GET", `ops/report/${encodeURIComponent(code)}`);

// mode: "regenerate" | "recalculate" | "retry"
export const opsReportAction = async (code, mode, notify = false) =>
  call("POST", `ops/report/${encodeURIComponent(code)}/${mode}`, {
    json: mode === "retry" ? undefined : { notify: !!notify },
  });

export const opsReportUpload = async (code, formData) =>
  call("PUT", `ops/report/${encodeURIComponent(code)}/pdf`, {
    form: formData,
  });

export const opsLog = async (code) =>
  call("GET", `ops/log${code ? `?code=${encodeURIComponent(code)}` : ""}`);
