// Server Action "хуучирсан" эсэхийг таних (React / DOM-гүй, test/stale-action.test.mjs).
//
// Next 15 нь Server Action-ийн ID-г build бүрд санамсаргүй давс (encryption key)-аар hash хийдэг.
// Тиймээс admin шинээр deploy хийгдэхэд НЭЭЛТТЭЙ байсан tab-ын хуучин JS хуучин ID илгээж, сервер
// 404 HTML буцаадаг → client "An unexpected response was received from the server." гэж шиддэг
// (зураг оруулах, хадгалах гээд БҮХ app/api/* дуудлага). Хуудсаа дахин ачаалахад л засагдана.
// Байнгын засвар: Dockerfile-д NEXT_SERVER_ACTIONS_ENCRYPTION_KEY (CI secret) → ID тогтвортой.

const headerNames = (h) => {
  if (!h) return [];
  if (typeof h.keys === "function" && typeof h.get === "function")
    return [...h.keys()];
  if (Array.isArray(h)) return h.map(([k]) => k);
  return Object.keys(h);
};

/** fetch-ийн init нь Server Action хүсэлт мөн эсэх (`Next-Action` header). */
export function isServerActionRequest(init) {
  return headerNames(init?.headers).some(
    (k) => String(k).toLowerCase() === "next-action",
  );
}

/** Server Action-ийн ID серверт олдсонгүй (шинэ deploy) — 404 + RSC биш хариу. */
export function isStaleActionResponse(init, res) {
  if (!res || res.status !== 404 || !isServerActionRequest(init)) return false;
  const ct = (res.headers?.get?.("content-type") || "").toLowerCase();
  return !ct.startsWith("text/x-component");
}
