"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Modal, Button, Popconfirm, Tag, message } from "antd";
import {
  opsReportStatus,
  opsReportAction,
  opsReportUpload,
  opsLog,
} from "@/app/api/ops";

const STATUS_COLOR = {
  COMPLETED: "green",
  SENT: "green",
  FAILED: "red",
  STARTED: "blue",
  WRITING: "blue",
  CALCULATING: "blue",
  UPLOADING: "blue",
};

const fmtSize = (n) =>
  n == null ? "-" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

// Super admin-д зориулсан тайлангийн ops цонх: төлөв харах, дахин зурах /
// дахин бодох / дахин оролдох, PDF гараар солих. Үйлдэл бүр core-д аудитлагдана.
export default function ReportOpsModal({ code, open, onClose }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [notify, setNotify] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    const [s, h] = await Promise.all([opsReportStatus(code), opsLog(code)]);
    if (s.success) setState(s.data);
    else messageApi.error(s.message);
    if (h.success && Array.isArray(h.data)) setHistory(h.data.slice(0, 8));
    setLoading(false);
  }, [code, messageApi]);

  useEffect(() => {
    if (open) load();
    else {
      setState(null);
      setHistory([]);
    }
  }, [open, load]);

  const run = async (mode) => {
    setBusy(mode);
    const res = await opsReportAction(code, mode, notify);
    setBusy("");
    if (res.success) {
      messageApi.success("Дараалалд орлоо — төлөв хэдэн секундын дараа шинэчлэгдэнэ.");
      setTimeout(load, 1500);
    } else {
      messageApi.error(res.message);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      messageApi.error("PDF 20MB-с их байна.");
      return;
    }
    setBusy("upload");
    const fd = new FormData();
    fd.append("file", file);
    const res = await opsReportUpload(code, fd);
    setBusy("");
    if (res.success) {
      messageApi.success("PDF солигдлоо (өмнөх хувь .bak-д хадгалагдсан).");
      load();
    } else {
      messageApi.error(res.message);
    }
  };

  const log = state?.log;
  const failed = log?.status === "FAILED";

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={560} title={`Тайлангийн ops · ${code}`} destroyOnClose>
      {contextHolder}
      {loading && !state ? (
        <div className="py-6 text-center text-gray-500">Ачаалж байна…</div>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3">
            <div>Төлөв: {log ? <Tag color={STATUS_COLOR[log.status] || "default"}>{log.status}</Tag> : <Tag>мөр байхгүй</Tag>}</div>
            <div>Явц: {log?.progress ?? "-"}%</div>
            <div>PDF: {state?.file?.exists ? `байна (${fmtSize(state.file.size)})` : state?.file?.exists === false ? "байхгүй" : "шалгагдсангүй"}</div>
            <div>Result мөр: {state?.resultRows ?? "-"}</div>
            {log?.error && <div className="col-span-2 text-red-600 break-words">Алдаа: {log.error}</div>}
          </div>

          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Дууссаны дараа хэрэглэгч рүү мэйл дахин илгээх (анхдагчаар илгээхгүй)
          </label>

          <div className="flex flex-wrap gap-2">
            <Popconfirm title="PDF-г дахин зурах уу? (үр дүн өөрчлөгдөхгүй)" okText="Тийм" cancelText="Үгүй" onConfirm={() => run("regenerate")}>
              <Button loading={busy === "regenerate"} disabled={!!busy}>Дахин зурах</Button>
            </Popconfirm>
            <Popconfirm title="Үр дүнг устгаад дахин бодох уу? Оноо өөрчлөгдөж болно." okText="Тийм, бодно" cancelText="Үгүй" onConfirm={() => run("recalculate")}>
              <Button danger loading={busy === "recalculate"} disabled={!!busy}>Дахин бодох</Button>
            </Popconfirm>
            <Button disabled={!failed || !!busy} loading={busy === "retry"} onClick={() => run("retry")}>
              Дахин оролдох (FAILED)
            </Button>
            <Button onClick={load} disabled={loading}>Шинэчлэх</Button>
          </div>

          <div>
            <div className="mb-1 font-medium">PDF гараар солих</div>
            <input type="file" accept="application/pdf" disabled={!!busy} onChange={upload} />
            <div className="mt-1 text-xs text-gray-500">≤ 20MB, зөвхөн бүрэн PDF (%PDF- … %%EOF). Өмнөх файл .bak болж үлдэнэ.</div>
          </div>

          {history.length > 0 && (
            <div>
              <div className="mb-1 font-medium">Сүүлийн үйлдлүүд</div>
              <ul className="max-h-32 overflow-auto text-xs text-gray-600">
                {history.map((h) => (
                  <li key={h.id}>
                    {new Date(h.createdAt).toLocaleString("mn-MN")} · {h.action} · {h.status} · {h.actorEmail || h.actorId}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
