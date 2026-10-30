"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Select,
  Table,
  Tag,
  Upload,
  Popconfirm,
  Progress,
  Segmented,
  message,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import {
  ChatRoundDotsBoldDuotone,
  FileTextBoldDuotone,
  UploadMinimalisticBoldDuotone,
  Plain2BoldDuotone,
  ShieldCheckBoldDuotone,
} from "solar-icons";
import { bulkSms } from "@/app/api/constant";

const PHONE_COL = /phone|утас|дугаар/i;
const SMS_MAX = 160;
const SAMPLE = { phone: "99112233" };

/** Excel-ийн хуудас (таб-аар тусгаарласан, эхний мөр баганын нэр). */
const parseSheet = (raw) => {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { columns: ["phone"], rows: [] };
  const columns = lines[0].split("\t").map((c) => c.trim());
  return {
    columns,
    rows: lines.slice(1).map((l) => {
      const cells = l.split("\t");
      return Object.fromEntries(
        columns.map((c, i) => [c, (cells[i] ?? "").trim()]),
      );
    }),
  };
};

const normPhone = (p) =>
  String(p ?? "")
    .replace(/\D/g, "")
    .replace(/^976(?=\d{8}$)/, "");
const isPhone = (p) => /^\d{8}$/.test(p);

const Step = ({ n, title, hint, extra, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg10 text-sm font-extrabold text-main">
          {n}
        </span>
        <div>
          <div className="font-bold leading-tight">{title}</div>
          <div className="text-xs text-slate-500">{hint}</div>
        </div>
      </div>
      {extra}
    </div>
    {children}
  </section>
);

const Stat = ({ label, value, tone = "text-slate-900" }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 min-w-[96px]">
    <div className="text-[11px] text-slate-400">{label}</div>
    <div className={`text-lg font-extrabold leading-tight ${tone}`}>{value}</div>
  </div>
);

export default function BulkSms() {
  const [messageApi, contextHolder] = message.useMessage();
  const [mode, setMode] = useState("paste");
  const [numbers, setNumbers] = useState(""); // "Буулгах": мөр бүрт нэг дугаар
  const [sheet, setSheet] = useState(""); // Excel → TSV
  const [fileName, setFileName] = useState("");
  const [phoneCol, setPhoneCol] = useState();
  const [text, setText] = useState("");
  // recipients-тэй ижил дараалал: { text, error, sent }
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [preview, setPreview] = useState(null);
  const [filter, setFilter] = useState("all");
  const textRef = useRef(null);

  const { columns, rows } = useMemo(
    () =>
      mode === "excel"
        ? parseSheet(sheet)
        : {
            columns: ["phone"],
            rows: numbers.split("\n").filter(Boolean).map((phone) => ({ phone })),
          },
    [mode, numbers, sheet],
  );
  const col = columns.includes(phoneCol)
    ? phoneCol
    : (columns.find((c) => PHONE_COL.test(c)) ?? columns[0]);
  // Зөвхөн 8 оронтой дугаар, нэг дугаарт нэг л удаа.
  const { recipients, invalid, dupes } = useMemo(() => {
    const seen = new Set();
    const out = { recipients: [], invalid: [], dupes: 0 };
    for (const r of rows) {
      const phone = normPhone(r[col]);
      if (!isPhone(phone)) out.invalid.push(String(r[col] ?? "").trim() || "(хоосон)");
      else if (seen.has(phone)) out.dupes++;
      else {
        seen.add(phone);
        out.recipients.push({ ...r, phone });
      }
    }
    return out;
  }, [rows, col]);

  // Жагсаалт / текст өөрчлөгдвөл өмнөх шалгалт хүчингүй.
  useEffect(() => setResults([]), [recipients, text]);

  const idx = Math.min(previewIdx, Math.max(recipients.length - 1, 0));
  const sample = recipients[idx] ?? SAMPLE;

  // Утасны дэлгэц: тухайн хүлээн авагчид яг явах текстийг серверээр (dryRun) гаргана.
  useEffect(() => {
    if (!text.trim()) return setPreview(null);
    const t = setTimeout(async () => {
      const res = await bulkSms({ text, dryRun: true, recipients: [sample] });
      setPreview(res?.success ? res.data.results[0] : { error: res?.message });
    }, 400);
    return () => clearTimeout(t);
  }, [text, sample]);

  const ready = results.filter((r) => r && !r.error && !r.sent).length;
  const sent = results.filter((r) => r?.sent).length;
  const failed = results.filter((r) => r?.error).length;

  const onExcel = async (file) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      setSheet(XLSX.utils.sheet_to_csv(ws, { FS: "\t", blankrows: false }));
      setFileName(file.name);
      setPhoneCol(undefined);
    } catch {
      messageApi.error("Excel файлыг уншиж чадсангүй.");
    }
    return false;
  };

  // Хуулж буулгахад "+976 9911-2233, 88112233" → мөр бүрт цэвэр дугаар.
  const onPasteNumbers = (e) => {
    e.preventDefault();
    const el = e.target;
    const clean = e.clipboardData
      .getData("text")
      .split(/[\r\n,;\t]+/)
      .map(normPhone)
      .filter(Boolean)
      .join("\n");
    setNumbers(
      numbers.slice(0, el.selectionStart) + clean + numbers.slice(el.selectionEnd),
    );
  };

  const insertVar = (v) => {
    const el = textRef.current?.resizableTextArea?.textArea;
    const pos = el?.selectionStart ?? text.length;
    setText(text.slice(0, pos) + `{${v}}` + text.slice(pos));
  };

  /** dryRun: бүгдийг шалгана; эс бөгөөс шалгалтад тэнцсэн, илгээгээгүйг илгээнэ. */
  const run = async (dryRun) => {
    const todo = recipients
      .map((_, i) => i)
      .filter((i) => dryRun || (results[i] && !results[i].error && !results[i].sent));
    const size = dryRun ? 50 : 20;
    const next = dryRun ? [] : [...results];
    setBusy(true);
    setProgress(0);
    try {
      for (let i = 0; i < todo.length; i += size) {
        const part = todo.slice(i, i + size);
        const res = await bulkSms({
          text,
          dryRun,
          recipients: part.map((j) => recipients[j]),
        });
        if (!res?.success) throw new Error(res?.message);
        part.forEach((j, k) => {
          const r = res.data.results[k];
          next[j] = { ...r, sent: !dryRun && !r.error };
        });
        setResults([...next]);
        setProgress(Math.round(((i + part.length) / todo.length) * 100));
      }
      if (!dryRun)
        messageApi.success(`${next.filter((r) => r?.sent).length} дугаарт илгээлээ.`);
    } catch (err) {
      messageApi.error(err?.message || "Алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  };

  const vars = [...new Set(["phone", ...columns.filter((c) => c !== col)])];
  const len = preview?.text?.length ?? 0;
  const lenTone =
    len > SMS_MAX ? "#ef4444" : len > SMS_MAX - 20 ? "#f59e0b" : "#22c55e";

  const statusOf = (r) =>
    r?.error ? "failed" : r?.sent ? "sent" : r?.text != null ? "ready" : "none";
  const tableData = recipients
    .map((r, i) => ({ key: i, phone: r.phone, ...results[i] }))
    .filter((r) => filter === "all" || statusOf(r) === filter);

  return (
    <div className="px-5 py-6 space-y-4">
      {contextHolder}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg10 text-main">
            <ChatRoundDotsBoldDuotone width={24} height={24} />
          </span>
          <div>
            <div className="text-xl font-extrabold leading-tight">Масс SMS</div>
            <div className="text-xs text-slate-500">
              Skytel WebSMS · латин үсгээр, нэг SMS {SMS_MAX} тэмдэгт
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Stat label="Дугаар" value={recipients.length} />
          <Stat label="Бэлэн" value={ready} tone="text-blue-600" />
          <Stat label="Илгээсэн" value={sent} tone="text-green-600" />
          <Stat label="Алдаатай" value={failed} tone="text-red-500" />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px] gap-4 items-start">
        <Step
          n={1}
          title="Хүлээн авагчид"
          hint="Давхардсан дугаарыг нэг удаа тооцно"
          extra={
            <Segmented
              size="small"
              value={mode}
              onChange={setMode}
              options={[
                { value: "paste", label: "Буулгах" },
                { value: "excel", label: "Excel" },
              ]}
            />
          }
        >
          {mode === "excel" ? (
            <Upload.Dragger
              accept=".xlsx,.xls,.csv"
              showUploadList={false}
              beforeUpload={onExcel}
              className="block"
            >
              <div className="py-6 px-4">
                <UploadMinimalisticBoldDuotone
                  width={32}
                  height={32}
                  className="mx-auto text-main"
                />
                <div className="mt-2 font-semibold">
                  {fileName || "Файлаа чирж оруулах эсвэл дарж сонгох"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {fileName
                    ? `${rows.length} мөр · ${columns.length} багана — солих бол дахин дарна`
                    : ".xlsx, .xls, .csv · эхний мөр нь баганын нэр"}
                </div>
              </div>
            </Upload.Dragger>
          ) : (
            <Input.TextArea
              rows={9}
              value={numbers}
              inputMode="numeric"
              // Зөвхөн цифр, мөр шилжүүлэлт.
              onChange={(e) => setNumbers(e.target.value.replace(/[^\d\n]/g, ""))}
              onPaste={onPasteNumbers}
              className="font-mono text-[13px]"
              placeholder={
                "Мөр бүрт 8 оронтой нэг дугаар:\n99112233\n88112233\n\nХүн бүрт өөр утга ({link} г.м.) хэрэгтэй бол Excel горимыг ашиглана."
              }
            />
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">
              <b className="text-slate-900">{recipients.length}</b> дугаар
              {dupes > 0 && ` · ${dupes} давхардсаныг хассан`}
            </span>
            {columns.length > 1 && (
              <span className="flex items-center gap-2">
                <span className="text-slate-500">Утасны багана</span>
                <Select
                  size="small"
                  className="min-w-32"
                  value={col}
                  onChange={setPhoneCol}
                  options={columns.map((c) => ({ value: c, label: c }))}
                />
              </span>
            )}
          </div>
          {invalid.length > 0 && (
            <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {invalid.length} буруу дугаарыг хассан (8 оронтой цифр байх ёстой):{" "}
              <span className="font-mono">
                {invalid.slice(0, 5).join(", ")}
                {invalid.length > 5 && " …"}
              </span>
            </div>
          )}
        </Step>

        <Step n={2} title="Мессеж" hint="Кирилл үсгийг автоматаар латин болгоно">
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="text-xs text-slate-500 mr-1">Хувьсагч:</span>
            {vars.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVar(v)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-main hover:border-main/40 hover:bg-bg10"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
          <Input.TextArea
            ref={textRef}
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sain baina uu! Tany testiin holboos: {link}"
          />
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Илгээх урт (хувьсагч орлуулсны дараа)</span>
              <span style={{ color: lenTone }} className="font-bold">
                {len} / {SMS_MAX}
              </span>
            </div>
            <Progress
              percent={Math.min(100, (len / SMS_MAX) * 100)}
              showInfo={false}
              size="small"
              strokeColor={lenTone}
            />
          </div>
        </Step>

        <div className="space-y-4">
          <div className="mx-auto w-[260px] rounded-[44px] bg-slate-900 p-2.5 shadow-xl shadow-slate-300">
            <div className="flex h-[440px] flex-col rounded-[36px] bg-slate-50 overflow-hidden">
              <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-slate-900" />
              <div className="flex flex-col items-center gap-1 border-b border-slate-200 pb-3 pt-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-main text-sm font-extrabold text-white">
                  H
                </span>
                <span className="text-xs font-semibold">Hire</span>
              </div>
              <div className="flex-1 overflow-auto px-3 py-4">
                <div className="text-center text-[10px] text-slate-400 mb-2">
                  Өнөөдөр
                </div>
                {preview?.text ? (
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[13px] leading-snug text-slate-800 shadow-sm break-words">
                    {preview.text}
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-400 mt-10">
                    Мессеж бичихэд энд харагдана
                  </div>
                )}
                {preview?.error && (
                  <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                    {preview.error}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Button
              size="small"
              type="text"
              icon={<LeftOutlined />}
              disabled={idx <= 0}
              onClick={() => setPreviewIdx(idx - 1)}
            />
            <span className="font-mono">
              {sample.phone}
              {recipients.length > 0 && ` · ${idx + 1}/${recipients.length}`}
            </span>
            <Button
              size="small"
              type="text"
              icon={<RightOutlined />}
              disabled={idx >= recipients.length - 1}
              onClick={() => setPreviewIdx(idx + 1)}
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg10 text-sm font-extrabold text-main">
                3
              </span>
              <div>
                <div className="font-bold leading-tight">Шалгаад илгээх</div>
                <div className="text-xs text-slate-500">
                  Зөвхөн шалгалтад тэнцсэн дугаарт явна
                </div>
              </div>
            </div>
            {busy && <Progress percent={progress} size="small" />}
            <Button
              block
              icon={<ShieldCheckBoldDuotone width={16} height={16} />}
              disabled={busy || !recipients.length || !text.trim()}
              onClick={() => run(true)}
            >
              Бүгдийг шалгах
            </Button>
            <Popconfirm
              title={`${ready} дугаарт SMS илгээх үү?`}
              description="Илгээсний дараа буцаах боломжгүй."
              okText="Илгээх"
              cancelText="Болих"
              onConfirm={() => run(false)}
              disabled={busy || !ready}
            >
              <Button
                block
                className="the-btn"
                icon={<Plain2BoldDuotone width={16} height={16} />}
                disabled={busy || !ready}
              >
                Илгээх ({ready})
              </Button>
            </Popconfirm>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 font-bold">
              <FileTextBoldDuotone width={18} height={18} className="text-main" />
              Үр дүн
            </div>
            <Segmented
              size="small"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Бүгд ${recipients.length}` },
                { value: "ready", label: `Бэлэн ${ready}` },
                { value: "sent", label: `Илгээсэн ${sent}` },
                { value: "failed", label: `Алдаатай ${failed}` },
              ]}
            />
          </div>
          <Table
            size="small"
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            dataSource={tableData}
            columns={[
              { title: "№", render: (_, r) => r.key + 1, width: 50 },
              {
                title: "Утас",
                dataIndex: "phone",
                width: 110,
                render: (p) => <span className="font-mono">{p}</span>,
              },
              {
                title: "Мессеж",
                dataIndex: "text",
                render: (t) => <span className="break-all">{t ?? "—"}</span>,
              },
              {
                title: "Урт",
                dataIndex: "text",
                width: 60,
                render: (t) => t?.length ?? "",
              },
              {
                title: "Төлөв",
                width: 220,
                render: (_, r) =>
                  r.error ? (
                    <Tag color="red" className="whitespace-normal">
                      {r.error}
                    </Tag>
                  ) : r.sent ? (
                    <Tag color="green">Илгээсэн</Tag>
                  ) : r.text != null ? (
                    <Tag color="blue">Бэлэн</Tag>
                  ) : (
                    <Tag>Шалгаагүй</Tag>
                  ),
              },
            ]}
          />
        </section>
      )}
    </div>
  );
}
