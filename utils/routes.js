/** Browser-т харагдах (public) API URL — `<img src>` / `href` (файл) гэх мэтэд. */
export const api =
  process.env.NEXT_PUBLIC_API_URL || "https://api.hire.mn/api/v1/";

/**
 * Next-ийн СЕРВЕР талын (server action, route handler, layout fetch) API дуудлагад:
 * `API_URL_INTERNAL` (жишээ `http://core:5000/api/v1/`) байвал тэрийг ашиглана —
 * core-той нэг docker сүлжээнд байх тул Traefik / IP allowlist / hairpin оролцохгүй
 * (№15-P1). `NEXT_PUBLIC_*` биш тул browser bundle-д шингэхгүй; `window` байвал ямагт
 * public URL. ⚠️ Browser-т очих URL (img src, href) үүсгэхэд ХЭЗЭЭ Ч бүү ашигла.
 */
export const apiInternal =
  typeof window === "undefined" && process.env.API_URL_INTERNAL
    ? process.env.API_URL_INTERNAL.endsWith("/")
      ? process.env.API_URL_INTERNAL
      : `${process.env.API_URL_INTERNAL}/`
    : api;
// export const api = "http://localhost:3000/api/v1/";
// export const api = "http://localhost:5050/api/v1/";
