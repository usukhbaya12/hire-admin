// NUMBER (90) / TIME (100) асуултын цэвэр (React-гүй) логик. Тест: web/test/numeric-answer.test.mjs.
// ⚠️ web/app/utils/numericAnswer.js-тэй ИЖИЛ байх ёстой (хоёр тусдаа repo).
//
// Хариулт (answers[qid]) нь `{ answer, point, value }`:
//   answer — асуултын ганц questionAnswer-ийн id (хариултын ангилал түүгээр тодорхойлогдоно)
//   point  — NUMBER: оруулсан тоо; TIME: хугацаа `settings.pointUnit` нэгжээр (анхдагч минут)
//   value  — харуулах текст: NUMBER "2.5", TIME "01:30" / "01:30:20"
// min/max (question.minValue / maxValue) нь point-той ИЖИЛ нэгжээр.

export const NUMBER = 90;
export const TIME = 100;

export const isNumericType = (type) =>
  Number(type) === NUMBER || Number(type) === TIME;

export const TIME_UNIT_SECONDS = { second: 1, minute: 60, hour: 3600 };
export const TIME_UNIT_LABELS = { second: "секунд", minute: "минут", hour: "цаг" };

export const DEFAULT_NUMBER_SETTINGS = { decimal: false, decimalPlaces: 2, unit: "" };
export const DEFAULT_TIME_SETTINGS = {
  hours: true,
  minutes: true,
  seconds: false,
  pointUnit: "minute",
};

const PART_SECONDS = { h: 3600, m: 60, s: 1 };

const finiteOrNull = (v) =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v))
    ? null
    : Number(v);

export const unitSeconds = (settings) =>
  TIME_UNIT_SECONDS[settings?.pointUnit] ?? TIME_UNIT_SECONDS.minute;

/**
 * Харуулах хэсгүүд (дараалал: цаг → минут → секунд). Цаг+секундтэй бол минутыг заавал
 * оруулна (завсаргүй). Юу ч сонгоогүй бол цаг+минут.
 */
export const timeParts = (settings) => {
  const s = { ...DEFAULT_TIME_SETTINGS, ...(settings || {}) };
  let h = !!s.hours;
  let m = !!s.minutes;
  const sec = !!s.seconds;
  if (h && sec) m = true;
  if (!h && !m && !sec) {
    h = true;
    m = true;
  }
  return [h && "h", m && "m", sec && "s"].filter(Boolean);
};

/** Нийт секунд → { h, m, s } (эхний хэсэг хязгааргүй, бусад нь 0–59). */
export const secondsToParts = (total, parts) => {
  let rest = Math.max(0, Math.round(Number(total) || 0));
  const out = {};
  parts.forEach((p) => {
    const size = PART_SECONDS[p];
    out[p] = Math.floor(rest / size);
    rest -= out[p] * size;
  });
  // Хамгийн жижиг хэсгээс доош үлдэгдлийг (жишээ нь зөвхөн цаг харуулахад минут) тоймлоно.
  const last = parts[parts.length - 1];
  if (rest > 0 && last) out[last] += Math.round(rest / PART_SECONDS[last]);
  return out;
};

/** { h, m, s } (string | number) → нийт секунд; бүх хэсэг хоосон бол null. */
export const partsToSeconds = (values, parts) => {
  const filled = parts.filter(
    (p) => values?.[p] !== undefined && values?.[p] !== null && values?.[p] !== "",
  );
  if (!filled.length) return null;
  let total = 0;
  for (const p of parts) {
    const raw = values?.[p];
    const n = raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return NaN;
    total += n * PART_SECONDS[p];
  }
  return total;
};

const pad = (n) => String(n).padStart(2, "0");

/** Нийт секунд → "01:30" / "01:30:20" / "45:10" (харуулах хэсгүүдээр). */
export const formatDuration = (total, parts) => {
  const v = secondsToParts(total, parts);
  return parts.map((p) => pad(v[p])).join(":");
};

/** Хугацааны point (нэгжээр) ↔ секунд. point-ыг 4 орон хүртэл тоймлоно. */
export const secondsToPoint = (sec, settings) =>
  Math.round((sec / unitSeconds(settings)) * 10000) / 10000;
export const pointToSeconds = (point, settings) =>
  Math.round(Number(point) * unitSeconds(settings));

/** "2,5" / " 3 " → 2.5 / 3; хоосон → null; тоо биш → NaN. */
export const parseNumberInput = (text) => {
  const t = String(text ?? "").trim().replace(",", ".");
  if (t === "") return null;
  if (!/^-?\d*\.?\d*$/.test(t) || t === "-" || t === "." || t === "-.") return NaN;
  return Number(t);
};

const fmtNum = (n) => String(Number(n));

/** NUMBER: алдааны мессеж эсвэл null. */
export const numberError = (v, question) => {
  if (v === null || v === undefined) return null;
  if (!Number.isFinite(v)) return "Зөвхөн тоо оруулна уу";
  const s = { ...DEFAULT_NUMBER_SETTINGS, ...(question?.settings || {}) };
  if (!s.decimal && !Number.isInteger(v)) return "Бүхэл тоо оруулна уу";
  if (s.decimal) {
    const places = (String(v).split(".")[1] || "").length;
    const max = Number(s.decimalPlaces) || 2;
    if (places > max) return `Таслалаас хойш ${max} хүртэлх орон оруулна уу`;
  }
  const min = finiteOrNull(question?.minValue);
  const max = finiteOrNull(question?.maxValue);
  if (min !== null && v < min) return `${fmtNum(min)}-с бага байж болохгүй`;
  if (max !== null && v > max) return `${fmtNum(max)}-с их байж болохгүй`;
  return null;
};

/** TIME: секундээр шалгана (min/max нь point нэгжээр). */
export const timeError = (sec, question) => {
  if (sec === null || sec === undefined) return null;
  if (!Number.isFinite(sec) || sec < 0) return "Зөв хугацаа оруулна уу";
  const parts = timeParts(question?.settings);
  const min = finiteOrNull(question?.minValue);
  const max = finiteOrNull(question?.maxValue);
  const minSec = min === null ? null : pointToSeconds(min, question?.settings);
  const maxSec = max === null ? null : pointToSeconds(max, question?.settings);
  if (minSec !== null && sec < minSec)
    return `${formatDuration(minSec, parts)}-с бага байж болохгүй`;
  if (maxSec !== null && sec > maxSec)
    return `${formatDuration(maxSec, parts)}-с их байж болохгүй`;
  return null;
};

/** Хүрээний тайлбар: "0 – 7 өдөр" / "00:00 – 16:00". */
export const rangeHint = (question, type) => {
  const min = finiteOrNull(question?.minValue);
  const max = finiteOrNull(question?.maxValue);
  if (min === null && max === null) return "";
  if (Number(type) === TIME) {
    const parts = timeParts(question?.settings);
    const f = (v) => formatDuration(pointToSeconds(v, question?.settings), parts);
    return `${min === null ? "" : f(min)} – ${max === null ? "" : f(max)}`;
  }
  const unit = question?.settings?.unit ? ` ${question.settings.unit}` : "";
  return `${min === null ? "" : fmtNum(min)} – ${max === null ? "" : fmtNum(max)}${unit}`;
};

/**
 * Серверийн хадгалсан мөрөөс (`findOne`: { value, point }) хариултыг сэргээнэ.
 * TIME-д `value` ("01:30")-г түрүүлж, байхгүй бол point-оос.
 */
export const restoreNumericAnswer = (answerId, row, type, settings) => {
  const answer = answerId == null || Number.isNaN(Number(answerId)) ? null : Number(answerId);
  const point = finiteOrNull(row?.point);
  if (point === null) return undefined;
  if (Number(type) === TIME) {
    const parts = timeParts(settings);
    return {
      answer,
      point,
      value: row?.value || formatDuration(pointToSeconds(point, settings), parts),
    };
  }
  return { answer, point, value: row?.value ?? fmtNum(point) };
};

/** `answers[qid]` нь тоон хариулт мөн эсэх ({ point } агуулсан object). */
export const isNumericAnswerValue = (v) =>
  !!v && typeof v === "object" && !Array.isArray(v) && "point" in v;
