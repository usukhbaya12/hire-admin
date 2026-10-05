"use client";

import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Checkbox, DatePicker, Input, Radio, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { opsCleanupPreview, opsCleanupApply } from "@/app/api/ops";

// core ops-cleanup.service.ts-ийн алгасах шалтгаан
export const CLEANUP_SKIP_REASON = {
  "in-progress-report": "Тайлан одоо боловсруулагдаж байна (дуусахыг хүлээнэ)",
  "exam-in-progress": "Шалгалтыг одоо өгч байна",
  "paid-report": "Тайланг QPay-аар төлж авсан",
  "paid-service": "Үйлчилгээг QPay-аар төлж авсан",
};

const COUNT_LABEL = [
  ["exams", "Шалгалт"],
  ["orphanFiles", "Зөвхөн PDF (DB-д байхгүй)"],
  ["userAnswers", "Хариулт"],
  ["results", "Үр дүн"],
  ["reportLogs", "Тайлангийн бүртгэл"],
  ["reportAccess", "Тайлангийн эрх"],
  ["emailLogs", "И-мэйлийн бүртгэл"],
  ["snapshots", "Snapshot"],
  ["media", "Бичлэг (R2)"],
  ["services", "Үйлчилгээ"],
  ["transactions", "Гүйлгээ (үйлчилгээний)"],
  ["skipped", "Алгассан"],
];

// apply-ийн `deleted` түлхүүрүүд (core ops-cleanup.service.ts)
const DELETED_LABEL = {
  ...Object.fromEntries(COUNT_LABEL),
  resultDetails: "Үр дүнгийн дэлгэрэнгүй",
  examDetails: "Шалгалтын асуулт",
  users: "Loadtest хэрэглэгч",
};

export function CleanupCounts({ plan }) {
  const c = plan?.counts || {};
  const rows = COUNT_LABEL.filter(([k]) => c[k]);
  if (!rows.length) return <div className="text-sm text-gray-500">Устгах зүйл олдсонгүй.</div>;
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {rows.map(([k, label]) => (
        <Tag key={k} color={k === "skipped" ? "orange" : k === "exams" ? "red" : "default"}>
          {label}: <b>{c[k]}</b>
        </Tag>
      ))}
      <Tag color="blue">PDF: сервер + Cloudflare R2</Tag>
    </div>
  );
}

const MODES = [
  { value: "email", label: "Тестийн акаунт (k6)" },
  { value: "loadtest", label: "Loadtest (loadtest_ marker)" },
  { value: "preview", label: "Урьдчилан харах шалгалт" },
  { value: "codes", label: "Code-оор" },
];

// Super admin: тест хийсний дараа үүссэн шалгалт / тайланг (PDF — сервер + R2, DB) устгах.
// Эхлээд "Шалгах" (preview, юу ч устахгүй) → "Устгах" (баталгаажуулалттай). core нь
// боловсруулагдаж буй, одоо өгч буй, QPay-аар төлсөн өгөгдлийг (force-гүй бол) алгасна.
export default function Cleanup() {
  const [messageApi, contextHolder] = message.useMessage();
  const [mode, setMode] = useState("email");
  const [email, setEmail] = useState("");
  const [range, setRange] = useState([dayjs().subtract(3, "hour"), null]);
  const [codesText, setCodesText] = useState("");
  const [force, setForce] = useState(false);
  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const selector = useMemo(() => {
    const [since, until] = range || [];
    const time = {
      ...(since ? { since: since.toISOString() } : {}),
      ...(until ? { until: until.toISOString() } : {}),
    };
    const base =
      mode === "email"
        ? { email: email.trim(), ...time }
        : mode === "loadtest"
          ? { loadtest: true, ...time }
          : mode === "preview"
            ? { preview: true, ...time }
            : { codes: codesText.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean) };
    return force ? { ...base, force: true } : base;
  }, [mode, email, range, codesText, force]);

  const reset = () => {
    setPlan(null);
    setResult(null);
    setConfirmText("");
  };

  const preview = async () => {
    reset();
    setBusy("preview");
    const res = await opsCleanupPreview(selector);
    setBusy("");
    if (res.success) setPlan(res.data);
    else messageApi.error(res.message);
  };

  const confirmWord = plan ? String(plan.counts?.exams + (plan.counts?.orphanFiles || 0)) : "";
  const apply = async () => {
    setBusy("apply");
    const res = await opsCleanupApply(selector, plan?.token);
    setBusy("");
    if (!res.success) {
      messageApi.error(res.message);
      return;
    }
    setResult(res.data);
    setPlan(null);
    setConfirmText("");
    if (res.data?.failed?.length) messageApi.warning(`${res.data.failed.length} code устгагдсангүй — доорх жагсаалтыг харна уу.`);
    else messageApi.success("Устгагдлаа.");
  };

  const needsSince = mode === "email" || mode === "preview";

  return (
    <div className="p-6 flex flex-col gap-4 max-w-5xl">
      {contextHolder}
      <div>
        <div className="text-xl font-extrabold">Тест өгөгдөл цэвэрлэх</div>
        <div className="text-sm text-gray-500">
          Тест (k6, loadtest, урьдчилан харах) хийсний дараа үүссэн шалгалт, хариулт, үр дүн, тайлангийн PDF
          (сервер + Cloudflare R2)-ийг устгана. Үйлдэл бүр ops бүртгэлд хадгалагдана.
        </div>
      </div>

      <Card size="small">
        <div className="flex flex-col gap-3">
          <Radio.Group
            optionType="button"
            options={MODES}
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              reset();
            }}
          />
          {mode === "email" && (
            <Input
              placeholder="Тестийн акаунтын и-мэйл (k6 TEST_EMAIL)"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                reset();
              }}
            />
          )}
          {mode !== "codes" && (
            <div className="flex items-center gap-2 text-sm">
              <span>Хугацаа{needsSince ? " (эхлэх заавал — тест эхлэхээс өмнөх цаг)" : ""}:</span>
              <DatePicker.RangePicker
                showTime
                allowEmpty={[!needsSince, true]}
                value={range}
                onChange={(v) => {
                  setRange(v || [null, null]);
                  reset();
                }}
              />
            </div>
          )}
          {mode === "codes" && (
            <Input.TextArea
              rows={3}
              placeholder="Code-ууд (таслал, зай эсвэл мөрөөр тусгаарлана; ≤ 100)"
              value={codesText}
              onChange={(e) => {
                setCodesText(e.target.value);
                reset();
              }}
            />
          )}
          <Checkbox
            checked={force}
            onChange={(e) => {
              setForce(e.target.checked);
              reset();
            }}
          >
            QPay-аар төлсөн / одоо өгч буй шалгалтыг ч устгах (prod-д болгоомжтой)
          </Checkbox>
          <div>
            <Button type="primary" loading={busy === "preview"} disabled={!!busy} onClick={preview}>
              Шалгах (юу ч устахгүй)
            </Button>
          </div>
        </div>
      </Card>

      {plan && (
        <Card size="small" title="Устгах гэж буй зүйл">
          <div className="flex flex-col gap-3">
            <CleanupCounts plan={plan} />
            {plan.overLimit && (
              <Alert type="warning" showIcon message={`Хэт олон (${plan.total} > ${plan.max}) — хугацааг нарийсгана уу.`} />
            )}
            {plan.skipped?.length > 0 && (
              <Table
                size="small"
                rowKey="code"
                pagination={{ pageSize: 5 }}
                dataSource={plan.skipped}
                columns={[
                  { title: "Алгассан code", dataIndex: "code" },
                  { title: "Шалтгаан", dataIndex: "reason", render: (r) => CLEANUP_SKIP_REASON[r] || r },
                ]}
              />
            )}
            {plan.codes?.length > 0 && (
              <div className="text-xs text-gray-500 break-words">
                Code ({plan.counts?.exams}): {plan.codes.slice(0, 40).join(", ")}
                {plan.counts?.exams > 40 ? " …" : ""}
              </div>
            )}
            {plan.token ? (
              <div className="flex items-center gap-2">
                <Input
                  className="max-w-xs"
                  placeholder={`Баталгаажуулах: ${confirmWord} гэж бичнэ үү`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.trim())}
                />
                <Button danger type="primary" loading={busy === "apply"} disabled={confirmText !== confirmWord || !!busy} onClick={apply}>
                  {confirmWord}-ийг бүрмөсөн устгах
                </Button>
                <span className="text-xs text-gray-400">token {Math.round((plan.expiresInSec || 600) / 60)} мин хүчинтэй</span>
              </div>
            ) : (
              !plan.overLimit && <div className="text-sm text-gray-500">Устгах зүйл алга.</div>
            )}
          </div>
        </Card>
      )}

      {result && (
        <Card size="small" title="Үр дүн">
          <div className="flex flex-col gap-2 text-sm">
            <div>
              Устсан шалгалт: <b>{result.codes}</b>
              {result.orphanFiles ? ` · зөвхөн PDF: ${result.orphanFiles}` : ""} · R2:{" "}
              {result.remote?.enabled ? <Tag color="green">идэвхтэй ({result.remote.prefix})</Tag> : <Tag>тохируулаагүй</Tag>}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.deleted || {}).filter(([, v]) => v).map(([k, v]) => (
                <Tag key={k}>{DELETED_LABEL[k] || k}: {v}</Tag>
              ))}
            </div>
            {result.failed?.length > 0 && (
              <Table
                size="small"
                rowKey="code"
                pagination={{ pageSize: 5 }}
                dataSource={result.failed}
                columns={[
                  { title: "Устгаж чадаагүй code (DB мөр хэвээр — дахин оролдож болно)", dataIndex: "code" },
                  { title: "Алдаа", dataIndex: "error" },
                ]}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
