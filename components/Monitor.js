"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, Progress, Segmented, Statistic, Table, Tag, Button, message } from "antd";
import { getMonitorAll } from "@/app/api/monitor";

const REFRESH_MS = 60_000;
const RANGE_OPTIONS = [
  { label: "1 цаг", value: "1h" },
  { label: "24 цаг", value: "24h" },
  { label: "7 хоног", value: "7d" },
  { label: "30 хоног", value: "30d" },
];

const fmtAge = (s) => {
  if (s == null) return "-";
  if (s < 90) return `${s} сек`;
  if (s < 5400) return `${Math.round(s / 60)} мин`;
  if (s < 172800) return `${Math.round(s / 3600)} цаг`;
  return `${Math.round(s / 86400)} өдөр`;
};
const fmtTime = (t) => (t ? new Date(t).toLocaleString("mn-MN") : "-");
const STATUS_COLOR = { COMPLETED: "green", SENT: "green", FAILED: "red", STARTED: "blue", WRITING: "blue", CALCULATING: "blue", UPLOADING: "blue" };

const FUNNEL_STEPS = [
  ["registered", "Бүртгэгдсэн"],
  ["started", "Эхэлсэн"],
  ["finished", "Дуусгасан"],
  ["reportReady", "Тайлан бэлэн"],
  ["viewed", "Үр дүн үзсэн"],
  ["paid", "Төлсөн"],
];

// №11-P1: гол flow-ын хяналт (super admin). Шинэ хүснэгтгүй, унших-л; core 45с
// cache-тэй тул 60с auto-refresh DB-г ачаалахгүй. PII харуулахгүй (код, огноо).
export default function Monitor() {
  const [messageApi, contextHolder] = message.useMessage();
  const [range, setRange] = useState("24h");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    const res = await getMonitorAll(range);
    if (id !== reqId.current) return; // хуучин хүсэлтийн хариу
    setLoading(false);
    if (res.success) {
      setData(res.data);
      setUpdatedAt(new Date());
    } else {
      messageApi.error(res.message);
    }
  }, [range, messageApi]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const o = data?.overview;
  const totals = o?.funnel?.totals;
  const top = totals?.registered || 0;

  const codeCol = { title: "Код", dataIndex: "code", key: "code", width: 120 };
  const ageCol = { title: "Нас", dataIndex: "ageSec", key: "age", width: 90, render: fmtAge };

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      {contextHolder}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Хяналт</div>
          <div className="text-xs text-gray-500">
            Шинэчлэгдсэн: {updatedAt ? updatedAt.toLocaleTimeString("mn-MN") : "-"} · 60 секунд тутам автоматаар · сервер 45с cache
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} />
          <Button onClick={load} loading={loading}>Шинэчлэх</Button>
        </div>
      </div>

      {!data ? (
        <div className="py-10 text-center text-gray-500">{loading ? "Ачаалж байна…" : "Өгөгдөл алга"}</div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Card size="small"><Statistic title="Гацсан (лог байхгүй)" value={o.reports.stuckNoLog} valueStyle={{ color: o.reports.stuckNoLog ? "#cf1322" : undefined }} /></Card>
            <Card size="small"><Statistic title="Гацсан (явцтай)" value={o.reports.stuckInProgress} valueStyle={{ color: o.reports.stuckInProgress ? "#cf1322" : undefined }} /></Card>
            <Card size="small"><Statistic title="FAILED тайлан" value={o.reports.failed} valueStyle={{ color: o.reports.failed ? "#cf1322" : undefined }} /></Card>
            <Card size="small"><Statistic title="Төлбөр 15+ мин pending" value={o.payments.pendingOver15min} valueStyle={{ color: o.payments.pendingOver15min ? "#d46b08" : undefined }} /></Card>
            <Card size="small"><Statistic title="5xx алдаа" value={o.errors.serverErrors} valueStyle={{ color: o.errors.serverErrors ? "#cf1322" : undefined }} suffix={`/ ${o.errors.total}`} /></Card>
            <Card size="small">
              <Statistic
                title="Report VPS"
                value={o.health.reportVps?.ok ? "OK" : "АЛДАА"}
                valueStyle={{ color: o.health.reportVps?.ok ? "#389e0d" : "#cf1322" }}
                suffix={o.health.reportVps?.ms != null ? `${o.health.reportVps.ms}ms` : ""}
              />
            </Card>
          </div>

          {/* Funnel */}
          <Card size="small" title="Шалгалтын funnel">
            <div className="flex flex-col gap-2">
              {FUNNEL_STEPS.map(([k, label]) => (
                <div key={k} className="flex items-center gap-3">
                  <div className="w-32 text-sm">{label}</div>
                  <Progress percent={top ? Math.round(((totals[k] || 0) / top) * 100) : 0} format={() => totals[k] ?? 0} className="flex-1" />
                </div>
              ))}
              <div className="text-xs text-gray-500">
                Эхэлсэн {o.funnel.conversion.startedOfRegistered ?? "-"}% · Дуусгасан {o.funnel.conversion.finishedOfStarted ?? "-"}% · Тайлан бэлэн {o.funnel.conversion.reportReadyOfFinished ?? "-"}% · Үзсэн {o.funnel.conversion.viewedOfReportReady ?? "-"}% · Төлсөн {o.funnel.conversion.paidOfViewed ?? "-"}%
              </div>
            </div>
          </Card>

          {/* Reports */}
          <Card size="small" title="Тайлангийн pipeline" extra={<span className="text-xs text-gray-500">Сүүлд дууссан: {fmtTime(o.reports.lastCompletedAt)} · p50 {o.reports.durationSec?.p50 != null ? `${Math.round(o.reports.durationSec.p50)}с` : "-"} / p95 {o.reports.durationSec?.p95 != null ? `${Math.round(o.reports.durationSec.p95)}с` : "-"} (ойролцоо)</span>}>
            <div className="mb-3 flex flex-wrap gap-2">
              {Object.entries(o.reports.counts || {}).map(([s, n]) => (
                <Tag key={s} color={STATUS_COLOR[s] || "default"}>{s}: {n}</Tag>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <div className="mb-1 text-sm font-medium">Лог байхгүй ({data.reports.stuckNoLog.total})</div>
                <Table size="small" rowKey="code" pagination={false} dataSource={data.reports.stuckNoLog.items.slice(0, 10)} columns={[codeCol, { title: "Тест", dataIndex: "assessment", key: "a", ellipsis: true }, ageCol]} />
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">Явц дундаа зогссон ({data.reports.stuckInProgress.total})</div>
                <Table size="small" rowKey="code" pagination={false} dataSource={data.reports.stuckInProgress.items.slice(0, 10)} columns={[codeCol, { title: "Төлөв", dataIndex: "status", key: "s", render: (s) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> }, ageCol]} />
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">FAILED ({data.reports.failed.total})</div>
                <Table size="small" rowKey="code" pagination={false} dataSource={data.reports.failed.items.slice(0, 10)} columns={[codeCol, { title: "Алдаа", dataIndex: "error", key: "e", ellipsis: true }]} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">Дахин боловсруулах: Үр дүн хуудас → тухайн мөрийн "ops" (recalculate / regenerate / retry).</div>
          </Card>

          {/* Payments + services */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card size="small" title="Төлбөр (15+ мин pending)">
              <Table size="small" rowKey="id" pagination={false} dataSource={data.payments.reportAccess.pendingOver15min.items.slice(0, 10)} columns={[{ ...codeCol }, { title: "Дүн", dataIndex: "price", key: "p", width: 90 }, ageCol]} locale={{ emptyText: "Байхгүй" }} />
              <div className="mt-2 text-xs text-gray-500">
                Тайлангийн нээлт: {(data.payments.reportAccess.byStatus || []).map((x) => `${{ 10: "pending", 20: "paid", 30: "failed", 40: "error" }[x.status] || x.status} ${x.n}`).join(" · ") || "-"} · Пакет нэхэмжлэх 15+ мин: {data.payments.userService.pendingInvoiceOver15min.total}
              </div>
            </Card>
            <Card size="small" title="Квот дуусах дөхсөн үйлчилгээ (≤ 5)">
              <Table size="small" rowKey="id" pagination={false} dataSource={data.services.items.slice(0, 10)} columns={[{ title: "Service", dataIndex: "id", key: "id", width: 90 }, { title: "Ашигласан", key: "u", render: (_, r) => `${r.used} / ${r.count}` }, { title: "Үлдсэн", dataIndex: "remaining", key: "r", render: (v) => <Tag color={v <= 0 ? "red" : "orange"}>{v}</Tag> }, { title: "Сүүлд", dataIndex: "lastExamAt", key: "l", render: fmtTime }]} locale={{ emptyText: "Байхгүй" }} />
            </Card>
          </div>

          {/* Errors */}
          <Card size="small" title={`Алдаа (${data.errors.total}; 5xx ${data.errors.serverErrors}, 4xx ${data.errors.clientErrors})`}>
            <Table size="small" rowKey={(r) => `${r.status}|${r.method}|${r.url}|${r.message}`} pagination={false} dataSource={data.errors.top} columns={[{ title: "Тоо", dataIndex: "n", key: "n", width: 70 }, { title: "Статус", dataIndex: "status", key: "s", width: 80 }, { title: "Method", dataIndex: "method", key: "m", width: 80 }, { title: "URL", dataIndex: "url", key: "u", ellipsis: true }, { title: "Мессеж", dataIndex: "message", key: "msg", ellipsis: true }, { title: "Сүүлд", dataIndex: "lastAt", key: "t", width: 170, render: fmtTime }]} locale={{ emptyText: "Алдаа алга" }} />
          </Card>

          <div className="text-xs text-gray-500">
            DB {o.health.dbMs}ms · Хамгийн хуучин хүлээгдэж буй тайлан: {fmtAge(o.health.oldestPendingReportAgeSec)}
          </div>
        </>
      )}
    </div>
  );
}
