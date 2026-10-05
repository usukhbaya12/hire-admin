// `node test/stale-action.test.mjs` — utils/staleAction.js
import assert from "node:assert/strict";
import {
  isServerActionRequest,
  isStaleActionResponse,
} from "../utils/staleAction.js";

let failed = 0;
const t = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`❌ ${name}\n   ${e.message}`);
  }
};
const res = (status, ct) => ({ status, headers: new Headers(ct ? { "content-type": ct } : {}) });
const action = { method: "POST", headers: { Accept: "text/x-component", "Next-Action": "abc123" } };

t("Next-Action header (object / Headers / array) → action хүсэлт", () => {
  assert.equal(isServerActionRequest(action), true);
  assert.equal(isServerActionRequest({ headers: new Headers({ "next-action": "x" }) }), true);
  assert.equal(isServerActionRequest({ headers: [["Next-Action", "x"]] }), true);
  assert.equal(isServerActionRequest({ headers: { Authorization: "Bearer x" } }), false);
  assert.equal(isServerActionRequest(undefined), false);
});
t("хуучин ID (шинэ deploy) → 404 HTML → stale", () => {
  assert.equal(isStaleActionResponse(action, res(404, "text/html; charset=utf-8")), true);
});
t("action-ийн хэвийн / алдааны RSC хариу → stale биш", () => {
  assert.equal(isStaleActionResponse(action, res(200, "text/x-component")), false);
  assert.equal(isStaleActionResponse(action, res(404, "text/x-component")), false);
  assert.equal(isStaleActionResponse(action, res(500, "text/html")), false);
});
t("action биш fetch-ийн 404 → stale биш", () => {
  assert.equal(isStaleActionResponse({ headers: {} }, res(404, "text/html")), false);
});

if (failed) {
  console.log(`\n❌ ${failed} тест унасан`);
  process.exit(1);
}
console.log("\n✅ БҮГД АМЖИЛТТАЙ");
