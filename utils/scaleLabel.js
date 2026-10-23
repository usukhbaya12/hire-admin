// SLIDER / SLIDERSINGLE-ийн шошго (question.slider-ийн "," -ээр тусгаарласан хэсэг) задлах.
// Тест: `node test/scale-label.test.mjs`.
// web/app/utils/scaleLabel.js ↔ admin/utils/scaleLabel.js — ЯГ АДИЛ.
//
// "1-Аливаа…" → { num: "1", text: "Аливаа…" }, "3" → { num: "3", text: "" },
// "24 цаг" / "Ховор" → { num: null, text } (дугаарыг утгаар нь харуулна).
export const parseScaleLabel = (s) => {
  const raw = String(s ?? "").trim();
  const m = raw.match(/^(\d+)\s*(?:[-–.·]\s*([\s\S]*))?$/);
  return m ? { num: m[1], text: (m[2] || "").trim() } : { num: null, text: raw };
};
