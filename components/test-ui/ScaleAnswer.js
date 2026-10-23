"use client";

// SLIDER (70) / SLIDERSINGLE (80) асуултын хэмжүүр — Figma "Hire — UI шинэчлэл", Part 07.
// ≤ 7 цэг: дугаартай 32px товч + зам; 8+ цэг (жиш 0–10): тэнцүү нүд (утсанд багтана, олон бол
// дараагийн мөрөнд). Туйлын тайлбар дээр нь, сонгосон хариулт доор нь урсгалдаа — tooltip-гүй тул
// асуулт / тайлбарыг дарахгүй. Утга нь хуучнаараа min..max бүхэл тоо. Хэмжээ px-ээр (admin-д 1rem = 14px).
//
// web/components/exam/ScaleAnswer.js ↔ admin/components/test-ui/ScaleAnswer.js — ЯГ АДИЛ (import-оос бусад).

import React from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { parseScaleLabel } from "@/utils/scaleLabel";

export default function ScaleAnswer({ min, max, labels, value, onChange, emphasize }) {
  const steps = [];
  for (let v = min; v <= max; v++) {
    const l = parseScaleLabel(labels?.[v - min]);
    steps.push({ v, num: l.num ?? String(v), text: l.text });
  }
  const n = steps.length;
  const cells = n > 7;
  const sel = value >= min && value <= max ? steps[value - min] : null;
  const first = steps[0];
  const last = steps[n - 1];
  const poleCls = emphasize
    ? "text-[13px] font-semibold leading-[18px] text-gray-900"
    : "text-[12px] leading-4 text-gray-500";
  const pole = (s) => (cells ? `${s.num} · ${s.text}` : s.text);

  return (
    <div className="flex w-full flex-col gap-3">
      {(first.text || last.text) && (
        <div className="flex justify-between gap-6">
          <div className={`flex-1 ${poleCls}`}>{first.text && pole(first)}</div>
          <div className={`flex-1 text-right ${poleCls}`}>{last.text && pole(last)}</div>
        </div>
      )}

      {cells ? (
        // 20px — 0–10 (11 нүд) 360px утсанд ч нэг мөрөнд багтана.
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(20px, 1fr))" }}>
          {steps.map((s) => (
            <button
              key={s.v}
              type="button"
              aria-pressed={sel === s}
              title={s.text || undefined}
              onClick={() => onChange(s.v)}
              className={`h-[40px] rounded-lg border text-[13px] transition-colors ${
                sel === s
                  ? "border-main bg-main font-bold text-white"
                  : "border-gray-300 bg-white font-semibold text-gray-500 hover:border-main"
              }`}
            >
              {s.num}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative flex items-center justify-between">
          <div className="absolute inset-x-[16px] top-1/2 h-[2px] -translate-y-1/2 rounded bg-gray-200" />
          {sel && n > 1 && (
            <div
              className="absolute left-[16px] top-1/2 h-[3px] -translate-y-1/2 rounded bg-main"
              style={{ width: `calc((100% - 32px) * ${(sel.v - min) / (n - 1)})` }}
            />
          )}
          {steps.map((s) => (
            <button
              key={s.v}
              type="button"
              aria-pressed={sel === s}
              title={s.text || undefined}
              onClick={() => onChange(s.v)}
              className={`relative h-[32px] w-[32px] shrink-0 rounded-full text-[13px] transition-colors ${
                sel === s
                  ? "bg-main font-bold text-white ring-4 ring-[#ffe4d3]"
                  : "border-[1.5px] border-gray-300 bg-white font-semibold text-gray-500 hover:border-main"
              }`}
            >
              {s.num}
            </button>
          ))}
        </div>
      )}

      {sel ? (
        <div className="inline-flex items-center gap-2 self-start rounded-xl bg-[#fff4ec] px-3 py-2.5 text-[13px] font-semibold leading-[18px] text-[#b4410c]">
          <CheckCircleOutlined />
          <span>{sel.text ? `${sel.num} · ${sel.text}` : `Таны хариулт: ${sel.num}`}</span>
        </div>
      ) : (
        <div className="text-[12px] text-gray-400">
          Хариултаа сонгоно уу — тохирох {cells ? "тоогоо" : "цэгээ"} дарна
        </div>
      )}
    </div>
  );
}
