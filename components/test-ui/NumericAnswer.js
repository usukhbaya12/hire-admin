"use client";

// NUMBER (90) / TIME (100) асуултын хариулах талбар (web/components/exam/NumericAnswer.js-ийн хуулбар —
// admin-ы асуултын карт, Preview-д). Логик: utils/numericAnswer.js.
// Зөв утга → onChange({ answer, point, value }); хоосон / буруу → onChange(undefined)
// (хариулаагүйд тооцогдоно, илгээгдэхгүй).

import React, { useEffect, useRef, useState } from "react";
import { Input } from "antd";
import {
  NUMBER,
  TIME,
  timeParts,
  secondsToParts,
  partsToSeconds,
  formatDuration,
  secondsToPoint,
  pointToSeconds,
  parseNumberInput,
  numberError,
  timeError,
  rangeHint,
} from "@/utils/numericAnswer";

const PART_LABEL = { h: "цаг", m: "минут", s: "секунд" };

const Hint = ({ error, hint }) =>
  error ? (
    <div className="text-red-500 text-sm mt-1.5">{error}</div>
  ) : hint ? (
    <div className="text-gray-400 text-sm mt-1.5">{hint}</div>
  ) : null;

export const NumberAnswer = ({ question, value, onChange, disabled }) => {
  const q = question.question;
  const answerId = question.answers?.[0]?.id ?? null;
  const [text, setText] = useState(
    value?.value ?? (value?.point != null ? String(value.point) : ""),
  );
  const [error, setError] = useState(null);
  const decimal = !!q?.settings?.decimal;
  // Гаднаас (серверээс сэргээх / ноорог) ирсэн утгыг талбарт тусгана — өөрийн оруулсныг биш.
  const emitted = useRef(value?.value);
  useEffect(() => {
    if (value?.value != null && value.value !== emitted.current) {
      emitted.current = value.value;
      setText(value.value);
      setError(null);
    }
  }, [value?.value]);

  const handle = (raw) => {
    setText(raw);
    const v = parseNumberInput(raw);
    const err = numberError(v, q);
    setError(err);
    if (v === null || err) {
      emitted.current = undefined;
      onChange(undefined);
      return;
    }
    emitted.current = String(v);
    onChange({ answer: answerId, point: v, value: String(v) });
  };

  const range = rangeHint(q, NUMBER);
  return (
    <div className="pl-3.5 mb-1">
      <Input
        value={text}
        disabled={disabled}
        inputMode={decimal ? "decimal" : "numeric"}
        placeholder="Тоо оруулна уу"
        status={error ? "error" : undefined}
        suffix={
          q?.settings?.unit ? (
            <span className="text-gray-400">{q.settings.unit}</span>
          ) : undefined
        }
        onChange={(e) => handle(e.target.value)}
        className="max-w-[240px]"
      />
      <Hint error={error} hint={range && `Хүрээ: ${range}`} />
    </div>
  );
};

const initialParts = (value, parts, settings) => {
  if (value?.value && typeof value.value === "string") {
    const bits = value.value.split(":");
    if (bits.length === parts.length) {
      return Object.fromEntries(parts.map((p, i) => [p, String(Number(bits[i]))]));
    }
  }
  if (value?.point != null) {
    const v = secondsToParts(pointToSeconds(value.point, settings), parts);
    return Object.fromEntries(parts.map((p) => [p, String(v[p])]));
  }
  return Object.fromEntries(parts.map((p) => [p, ""]));
};

export const TimeAnswer = ({ question, value, onChange, disabled }) => {
  const q = question.question;
  const settings = q?.settings;
  const parts = timeParts(settings);
  const answerId = question.answers?.[0]?.id ?? null;
  const [vals, setVals] = useState(() => initialParts(value, parts, settings));
  const [error, setError] = useState(null);
  const emitted = useRef(value?.value);
  useEffect(() => {
    if (value?.value != null && value.value !== emitted.current) {
      emitted.current = value.value;
      setVals(initialParts(value, parts, settings));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.value]);

  const handle = (part, raw) => {
    const digits = String(raw).replace(/\D/g, "").slice(0, part === parts[0] ? 4 : 2);
    const next = { ...vals, [part]: digits };
    setVals(next);

    // Эхний хэсгээс бусад нь 0–59.
    const overflow = parts
      .slice(1)
      .find((p) => next[p] !== "" && Number(next[p]) > 59);
    const sec = partsToSeconds(next, parts);
    const err = overflow
      ? `${PART_LABEL[overflow][0].toUpperCase()}${PART_LABEL[overflow].slice(1)} 0–59 байна`
      : timeError(sec, q);
    setError(err);
    if (sec === null || err) {
      emitted.current = undefined;
      onChange(undefined);
      return;
    }
    const formatted = formatDuration(sec, parts);
    emitted.current = formatted;
    onChange({
      answer: answerId,
      point: secondsToPoint(sec, settings),
      value: formatted,
    });
  };

  const range = rangeHint(q, TIME);
  return (
    <div className="pl-3.5 mb-1">
      <div className="flex items-end gap-2 flex-wrap">
        {parts.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && <span className="pb-1.5 text-gray-400 font-semibold">:</span>}
            <label className="flex flex-col items-center gap-1">
              <Input
                value={vals[p]}
                disabled={disabled}
                inputMode="numeric"
                placeholder="00"
                maxLength={p === parts[0] ? 4 : 2}
                status={error ? "error" : undefined}
                onChange={(e) => handle(p, e.target.value)}
                className="w-[72px]! text-center"
              />
              <span className="text-xs text-gray-400">{PART_LABEL[p]}</span>
            </label>
          </React.Fragment>
        ))}
      </div>
      <Hint error={error} hint={range && `Хүрээ: ${range}`} />
    </div>
  );
};

const FIELD_LABEL = { h: "ц", m: "мин", s: "сек" };

/**
 * Admin-ы тохиргоонд (min / max) хугацааг хэсгүүдээр оруулах. `seconds`: number | null.
 * Эхний хэсэг хязгааргүй, бусад нь 0–59 (хэтэрвэл 59).
 */
export const DurationField = ({ seconds, settings, onChange, disabled }) => {
  const parts = timeParts(settings);
  const toVals = (sec) => {
    if (sec === null || sec === undefined || !Number.isFinite(Number(sec))) {
      return Object.fromEntries(parts.map((p) => [p, ""]));
    }
    const v = secondsToParts(Number(sec), parts);
    return Object.fromEntries(parts.map((p) => [p, String(v[p])]));
  };
  const [vals, setVals] = useState(() => toVals(seconds));
  const emitted = useRef(seconds);
  const partsKey = parts.join("");
  useEffect(() => {
    if (seconds !== emitted.current) {
      emitted.current = seconds;
      setVals(toVals(seconds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);
  useEffect(() => {
    setVals(toVals(emitted.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partsKey]);

  const handle = (part, raw) => {
    let digits = String(raw).replace(/\D/g, "").slice(0, part === parts[0] ? 4 : 2);
    if (part !== parts[0] && digits !== "" && Number(digits) > 59) digits = "59";
    const next = { ...vals, [part]: digits };
    setVals(next);
    const sec = partsToSeconds(next, parts);
    const out = sec === null || Number.isNaN(sec) ? null : sec;
    emitted.current = out;
    onChange(out);
  };

  return (
    <div className="flex items-center gap-1">
      {parts.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && <span className="text-gray-400">:</span>}
          <Input
            size="small"
            value={vals[p]}
            disabled={disabled}
            inputMode="numeric"
            placeholder="00"
            suffix={<span className="text-gray-400 text-xs">{FIELD_LABEL[p]}</span>}
            onChange={(e) => handle(p, e.target.value)}
            className="w-[70px]!"
          />
        </React.Fragment>
      ))}
    </div>
  );
};
