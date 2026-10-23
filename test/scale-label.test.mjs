// `node test/scale-label.test.mjs` — utils/scaleLabel.js
import assert from "node:assert/strict";
import { parseScaleLabel as p } from "../utils/scaleLabel.js";

let failed = 0;
const t = (name, fn) => {
  try { fn(); console.log(`✅ ${name}`); } catch (e) { failed++; console.log(`❌ ${name}\n   ${e.message}`); }
};

t("дугаар + тайлбар (1-…, 0 - …, 10-…)", () => {
  assert.deepEqual(p("1-Аливаа зүйлсийг"), { num: "1", text: "Аливаа зүйлсийг" });
  assert.deepEqual(p(" 0 - Огт үгүй "), { num: "0", text: "Огт үгүй" });
  assert.deepEqual(p("10-Маш сайн"), { num: "10", text: "Маш сайн" });
});
t("зөвхөн дугаар", () => assert.deepEqual(p("3"), { num: "3", text: "" }));
t("дугаар биш эхлэлтэй — бүхэлдээ тайлбар", () => {
  assert.deepEqual(p("24 цаг"), { num: null, text: "24 цаг" });
  assert.deepEqual(p("Ховор"), { num: null, text: "Ховор" });
  assert.deepEqual(p(undefined), { num: null, text: "" });
});

if (failed) { console.log(`\n❌ ${failed} тест унасан`); process.exit(1); }
console.log("\n✅ БҮГД АМЖИЛТТАЙ");
