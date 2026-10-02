// `node test/api-boundary.test.mjs` — №15-P1 (admin): server-side дуудлага дотоод URL (API_URL_INTERNAL)-аар,
// browser-т очих файлын URL public хэвээр (ажилтны IP / `api-public` GET /file exception). Next / DOM-гүй.
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

if (failed) {
  console.log(`\n❌ ${failed} шалгалт унасан`);
  process.exit(1);
}
console.log("\n✅ БҮГД АМЖИЛТТАЙ");
