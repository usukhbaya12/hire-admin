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
  message,
} from "antd";
import * as XLSX from "xlsx";
import { ChatRoundDotsBoldDuotone } from "solar-icons";
import { bulkSms } from "@/app/api/constant";

const PHONE_COL = /phone|утас|дугаар/i;

/** Мөр бүрт нэг дугаар, эсвэл Excel-ээс хуулсан хүснэгт (таб-аар тусгаарласан, эхний мөр гарчиг). */
const parse = (raw) => {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines[0]?.includes("\t"))
    return {
      columns: ["phone"],
      rows: raw
        .split(/[\n,;]+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((phone) => ({ phone })),
    };
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

export default function BulkSms() {
  const [messageApi, contextHolder] = message.useMessage();
  const [raw, setRaw] = useState("");
  const [phoneCol, setPhoneCol] = useState();
  const [text, setText] = useState("");
  // recipients-тэй ижил дараалал: { text, error, sent }
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const textRef = useRef(null);

  const { columns, rows } = useMemo(() => parse(raw), [raw]);
  const col = columns.includes(phoneCol)
    ? phoneCol
    : (columns.find((c) => PHONE_COL.test(c)) ?? columns[0]);
  // Нэг дугаарт нэг л удаа.
  const recipients = useMemo(() => {
    const seen = new Set();
    return rows
      .map((r) => ({ ...r, phone: normPhone(r[col]) }))
      .filter((r) => r.phone && !seen.has(r.phone) && seen.add(r.phone));
  }, [rows, col]);

  // Жагсаалт / текст өөрчлөгдвөл өмнөх шалгалт хүчингүй.
  useEffect(() => setResults([]), [recipients, text]);

  const ready = results.filter((r) => r && !r.error && !r.sent).length;
  const sent = results.filter((r) => r?.sent).length;
  const failed = results.filter((r) => r?.error).length;

  const onExcel = async (file) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const sheet = wb.Sheets[wb.SheetNames[0]];
      setRaw(XLSX.utils.sheet_to_csv(sheet, { FS: "\t", blankrows: false }));
      setPhoneCol(undefined);
    } catch {
      messageApi.error("Excel файлыг уншиж чадсангүй.");
    }
    return false;
  };

  const insertVar = (v) => {
    const el = textRef.current?.resizableTextArea?.textArea;
    const pos = el?.selectionStart ?? text.length;
    setText(text.slice(0, pos) + `{${v}}` + text.slice(pos));
  };

  /** dryRun: бүгдийг шалгана; эс бөгөөс шалгалтад тэнцсэн, илгээгээгүйг илгээнэ. */
  const run = async (dryRun) => {
    const idx = recipients
      .map((_, i) => i)
      .filter((i) => dryRun || (results[i] && !results[i].error && !results[i].sent));
    const size = dryRun ? 50 : 20;
    const next = dryRun ? [] : [...results];
    setBusy(true);
    setProgress(0);
    try {
      for (let i = 0; i < idx.length; i += size) {
        const part = idx.slice(i, i + size);
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
        setProgress(Math.round(((i + part.length) / idx.length) * 100));
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

  return (
    <div className="px-5 py-6">
      {contextHolder}
      <div className="text-base font-bold flex items-center gap-2 mb-4">
        <ChatRoundDotsBoldDuotone className="text-main" />
        Масс SMS
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="border border-neutral rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="font-semibold">Хүлээн авагчид</div>
            <Upload
              accept=".xlsx,.xls,.csv"
              showUploadList={false}
              beforeUpload={onExcel}
            >
              <Button size="small">Excel оруулах</Button>
            </Upload>
          </div>
          <Input.TextArea
            rows={10}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={
              "Мөр бүрт нэг дугаар:\n99112233\n88112233\n\nЭсвэл Excel-ээс гарчигтай нь хуулж буулгана — багана бүр {хувьсагч} болно (жишээ нь хүн бүрийн өөр {link})."
            }
          />
          {columns.length > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Утасны багана:</span>
              <Select
                size="small"
                className="min-w-40"
                value={col}
                onChange={setPhoneCol}
                options={columns.map((c) => ({ value: c, label: c }))}
              />
            </div>
          )}
          <div className="text-sm text-gray-500">
            {recipients.length} дугаар (давхардлыг хассан)
          </div>
        </div>

        <div className="border border-neutral rounded-2xl p-4 space-y-3">
          <div className="font-semibold">Мессеж</div>
          <div className="flex flex-wrap gap-1">
            {vars.map((v) => (
              <Tag
                key={v}
                className="cursor-pointer m-0"
                onClick={() => insertVar(v)}
              >
                {`{${v}}`}
              </Tag>
            ))}
          </div>
          <Input.TextArea
            ref={textRef}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sain baina uu {phone} ..."
          />
          <div className="text-xs text-gray-400">
            Кирилл үсгийг латин болгож илгээнэ. Хувьсагч орлуулсны дараа 160
            тэмдэгтээс хэтрэхгүй.
          </div>
          {busy && <Progress percent={progress} size="small" />}
          <div className="flex justify-end gap-2">
            <Button
              disabled={busy || !recipients.length || !text.trim()}
              onClick={() => run(true)}
            >
              Шалгах
            </Button>
            <Popconfirm
              title={`${ready} дугаарт SMS илгээх үү?`}
              description="Илгээсний дараа буцаах боломжгүй."
              okText="Илгээх"
              cancelText="Болих"
              onConfirm={() => run(false)}
              disabled={busy || !ready}
            >
              <Button className="the-btn" disabled={busy || !ready}>
                Илгээх ({ready})
              </Button>
            </Popconfirm>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">
            Бэлэн: {ready} · Илгээсэн: {sent} · Алдаатай: {failed}
          </div>
          <Table
            size="small"
            pagination={{ pageSize: 20 }}
            dataSource={recipients.map((r, i) => ({
              key: i,
              phone: r.phone,
              ...results[i],
            }))}
            columns={[
              { title: "№", render: (_, r) => r.key + 1, width: 50 },
              { title: "Утас", dataIndex: "phone", width: 110 },
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
        </div>
      )}
    </div>
  );
}
