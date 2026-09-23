"use server";

// №11-P1 — Monitor (core `/monitor/*`, зөвхөн super admin). Токен сервер талд.
import { apiInternal as api } from "@/utils/routes";
import { getAuthToken } from "@/utils/auth";

const get = async (path) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${api}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: `Bearer ${token ?? ""}` },
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

const RANGES = ["1h", "24h", "7d", "30d"];
const safeRange = (r) => (RANGES.includes(r) ? r : "24h");

// Нэг дуудлагаар Monitor хуудасны бүх өгөгдөл (core 45с cache хийдэг).
export const getMonitorAll = async (range = "24h") => {
  const r = safeRange(range);
  const [overview, reports, payments, errors, services] = await Promise.all([
    get(`monitor/overview?range=${r}`),
    get(`monitor/reports?range=${r}`),
    get(`monitor/payments?range=${r}`),
    get(`monitor/errors?range=${r}`),
    get(`monitor/services?threshold=5`),
  ]);
  const failed = [overview, reports, payments, errors, services].find((x) => !x.success);
  if (failed) return failed;
  return {
    success: true,
    data: {
      overview: overview.data,
      reports: reports.data,
      payments: payments.data,
      errors: errors.data,
      services: services.data,
    },
  };
};
