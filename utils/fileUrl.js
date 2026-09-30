// Browser-т очих файлын (зураг, PDF) URL-г admin-ийн өөрийн `/api/file/<id>` proxy
// (app/api/file/[id]/route.js) руу заана.
//
// Яагаад: `NEXT_PUBLIC_API_URL` нь build үед шингэдэг, CI-д build-arg байхгүй тул
// test (admin.hire-test.cloud) image-ийн browser bundle-д `https://api.hire.mn/api/v1/`
// (prod) шингэдэг. Upload нь server action-аар test core руу явдаг ч `<img src>` нь prod
// core-оос хайгдаж 404 → зураг харагдахгүй байсан. Харьцангуй зам орчноос хамаарахгүй:
// admin дээр → admin proxy; web дээр (DB-д хадгалагдсан HTML / answer.file) → web-ийн
// ижил `/api/file/<id>` proxy. Хоёулаа server талд runtime `API_URL_INTERNAL`-аар core-г
// дуудна (№15-P1: browser core-г шууд дуудахгүй).

export const FILE_PROXY_PREFIX = "/api/file/";

/** Core-ийн файлын нэр (`${Date.now()}_original.ext`) → `/api/file/<encoded>` */
export function getFileUrl(fileId) {
  if (!fileId) return null;
  return `${FILE_PROXY_PREFIX}${encodeURIComponent(fileId)}`;
}

// Хуучин өгөгдөл: DB-д бүтэн core URL хадгалагдсан (`https://api.hire.mn/api/v1/file/<id>`,
// `https://api.hire-test.cloud/api/v1/file/<id>`, `http://localhost:5050/api/v1/file/<id>`).
const LEGACY_FILE_URL = /https?:\/\/[^/"'\s<>]+\/api\/v1\/file\//g;

/**
 * Нэг src эсвэл HTML доторх хуучин бүтэн core файлын URL-уудыг proxy руу хөрвүүлнэ.
 * Зөвхөн prefix-ийг солино (файлын нэрийн хэсэг хэвээр) → аль орчинд ч тухайн орчны core-оос татна.
 */
export function normalizeFileUrls(value) {
  if (!value || typeof value !== "string") return value;
  return value.replace(LEGACY_FILE_URL, FILE_PROXY_PREFIX);
}
