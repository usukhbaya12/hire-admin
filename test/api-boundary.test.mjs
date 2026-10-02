// `node test/api-boundary.test.mjs` — №15-P1 (admin): server-side дуудлага дотоод URL (API_URL_INTERNAL)-аар,
// browser-т очих файлын URL нь admin-ийн same-origin `/api/file/<id>` proxy (utils/fileUrl.js). Next / DOM-гүй.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const t = async (name, fn) => {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`❌ ${name}\n   ${e.message}`);
  }
};
const env = (vars, fn) => async () => {
  const saved = { ...process.env };
  const hadWindow = "window" in globalThis;
  for (const k of ["NEXT_PUBLIC_API_URL", "API_URL_INTERNAL"]) delete process.env[k];
  Object.assign(process.env, vars.env ?? {});
  if (vars.window) globalThis.window = {};
  try {
    return await fn();
  } finally {
    process.env = saved;
    if (!hadWindow) delete globalThis.window;
  }
};
let n = 0;
const load = (p) => import(`${p}?v=${++n}`);

await t("R1 API_URL_INTERNAL байхгүй → apiInternal === api", env({ env: { NEXT_PUBLIC_API_URL: "https://api.example.mn/api/v1/" } }, async () => {
  const r = await load("../utils/routes.js");
  assert.equal(r.apiInternal, r.api);
}));
await t("R2 сервер талд API_URL_INTERNAL → дотоод (slash нэмнэ); api public", env({ env: { NEXT_PUBLIC_API_URL: "https://api.example.mn/api/v1/", API_URL_INTERNAL: "http://core:5000/api/v1" } }, async () => {
  const r = await load("../utils/routes.js");
  assert.equal(r.apiInternal, "http://core:5000/api/v1/");
  assert.equal(r.api, "https://api.example.mn/api/v1/");
}));
await t("R3 window байвал (browser) дотоод URL хэзээ ч ашиглахгүй", env({ window: true, env: { NEXT_PUBLIC_API_URL: "https://api.example.mn/api/v1/", API_URL_INTERNAL: "http://core:5000/api/v1/" } }, async () => {
  const r = await load("../utils/routes.js");
  assert.equal(r.apiInternal, "https://api.example.mn/api/v1/");
}));

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "_to_delete"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
};
const files = [...walk(path.join(root, "app")), ...walk(path.join(root, "components"))].map((p) => ({ p: path.relative(root, p), s: fs.readFileSync(p, "utf8") }));
// Client component: "use client" директив, эсвэл (директивгүй ч) React hook ашигладаг, "use server" биш файл.
const isClient = (s) => /^\s*["']use client["']/.test(s) || (!/^\s*["']use server["']/.test(s) && /\b(useState|useEffect|useRef|useRouter|useSession|useContext|useCallback|useMemo)\b/.test(s));

await t("S1 'use client' файл apiInternal импортлохгүй", () => {
  assert.deepEqual(files.filter((f) => isClient(f.s) && /apiInternal/.test(f.s)).map((f) => f.p), []);
});
await t("S2 'use client' файл `${api}`-г зөвхөн файл (file/) URL-д ашиглана — core-г fetch / axios-оор шууд дууддаггүй", () => {
  const bad = files
    .filter((f) => isClient(f.s))
    .filter((f) => (f.s.match(/\$\{api\}(?!file\/)/g) ?? []).length > 0 || /(fetch|axios[.(a-z]*)\(\s*`?\$\{?api/.test(f.s))
    .map((f) => f.p);
  assert.deepEqual(bad, []);
});
await t("S3 `${api}…` ашигладаг server-side файл бүр `apiInternal as api` (≥ 6 файл)", () => {
  const server = files.filter((f) => !isClient(f.s) && /\$\{api\}/.test(f.s));
  assert.ok(server.length >= 6, `server-side файл цөөн: ${server.length}`);
  assert.deepEqual(server.filter((f) => !/apiInternal as api/.test(f.s)).map((f) => f.p), []);
});
await t("S4 server-side файл browser рүү файлын URL (`${api}file/`) буцаадаггүй", () => {
  const bad = files.filter((f) => !isClient(f.s) && /\$\{api\}file\//.test(f.s)).map((f) => f.p);
  assert.deepEqual(bad, []);
});

await t("S5 'use client' файл файлын URL-г `${api}file/`-аар бүтээхгүй — getFileUrl() (same-origin /api/file proxy)", () => {
  // `NEXT_PUBLIC_API_URL` build-arg байхгүй тул browser bundle-д prod URL шингэж, test орчинд
  // test core руу upload хийсэн зураг prod-оос хайгдаж харагдахгүй байсан.
  const bad = files.filter((f) => isClient(f.s) && /\$\{api\}file\//.test(f.s)).map((f) => f.p);
  assert.deepEqual(bad, []);
});
await t("F1 getFileUrl: /api/file/<encoded>; хоосон → null", async () => {
  const { getFileUrl } = await load("../utils/fileUrl.js");
  assert.equal(getFileUrl("1727_a b#1.png"), "/api/file/1727_a%20b%231.png");
  assert.equal(getFileUrl("1727_Зураг.png"), `/api/file/${encodeURIComponent("1727_Зураг.png")}`);
  assert.equal(getFileUrl(""), null);
  assert.equal(getFileUrl(null), null);
});
await t("F2 normalizeFileUrls: хуучин бүтэн core URL (аль ч host) → /api/file/, бусад нь хэвээр", async () => {
  const { normalizeFileUrls } = await load("../utils/fileUrl.js");
  const html = '<p>x</p><img src="https://api.hire.mn/api/v1/file/1_a b.png"><img src="http://localhost:5050/api/v1/file/2.png"><a href="https://hire.mn/x">y</a>';
  assert.equal(
    normalizeFileUrls(html),
    '<p>x</p><img src="/api/file/1_a b.png"><img src="/api/file/2.png"><a href="https://hire.mn/x">y</a>',
  );
  assert.equal(normalizeFileUrls("https://api.hire-test.cloud/api/v1/file/3.jpg"), "/api/file/3.jpg");
  assert.equal(normalizeFileUrls("/api/file/4.jpg"), "/api/file/4.jpg");
  assert.equal(normalizeFileUrls(null), null);
});
await t("F3 /api/file proxy route: apiInternal (runtime) ашиглана, fileId-г шалгаж encode хийнэ", () => {
  const s = fs.readFileSync(path.join(root, "app/api/file/[id]/route.js"), "utf8");
  assert.ok(/apiInternal\}file\/\$\{encodeURIComponent\(id\)\}/.test(s));
  assert.ok(/isSafeFileId\(id\)/.test(s));
});

if (failed) {
  console.log(`\n❌ ${failed} шалгалт унасан`);
  process.exit(1);
}
console.log("\n✅ БҮГД АМЖИЛТТАЙ");
