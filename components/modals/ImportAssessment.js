"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { UploadMinimalisticLineDuotone } from "solar-icons";

const fmtBytes = (n) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

// "JSON-оос оруулах" — сонгосон файлын товчоог харуулж баталгаажуулна.
// preview: { name, sourceId, exportedAt, size, counts: {...}, fileCount, missingFiles }
const ImportAssessmentModal = ({ open, preview, loading, onOk, onCancel }) => {
  const c = preview?.counts ?? {};
  const rows = [
    ["Асуултын бүлэг", c.questionCategories],
    ["Асуулт", c.questions],
    ["Хариулт", c.answers],
    ["Хариултын ангилал", c.answerCategories],
    ["Тайлангийн томьёо", c.formulas],
    ["Skip-дүрэм", c.rules],
    ["Studio загвар", c.pdfTemplates],
    ["Хувьсагч", c.variables],
    ["Зураг / файл", preview?.fileCount],
  ].filter(([, v]) => v > 0);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-main/10 text-main">
            <UploadMinimalisticLineDuotone />
          </AlertDialogMedia>
          <AlertDialogTitle>JSON-оос тест оруулах</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold text-slate-800">
              {preview?.name || "—"}
            </span>
            {preview?.sourceId ? ` (эх ID ${preview.sourceId}` : ""}
            {preview?.exportedAt
              ? `, ${String(preview.exportedAt).slice(0, 10)}-нд татсан)`
              : preview?.sourceId
                ? ")"
                : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {rows.map(([label, v]) => (
              <li key={label} className="flex justify-between gap-2">
                <span>{label}</span>
                <span className="font-semibold">{v}</span>
              </li>
            ))}
          </ul>
          {preview?.size ? (
            <div className="mt-2 text-xs text-slate-500">
              Файлын хэмжээ: {fmtBytes(preview.size)}
            </div>
          ) : null}
          {preview?.missingFiles > 0 ? (
            <div className="mt-2 text-xs text-amber-600">
              Эх орчинд олдоогүй {preview.missingFiles} зураг энд ч харагдахгүй.
            </div>
          ) : null}
        </div>

        <p className="text-xs text-slate-500">
          Шинэ тест <b>&quot;Архив&quot;</b> төлөвтэй үүснэ — шалгаад төлөвийг нь өөрөө
          нээнэ үү. Ижил нэртэй тест байвал нэрийн ард &quot;(import)&quot; нэмэгдэнэ.
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" onClick={onCancel} disabled={loading}>
            Буцах
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onOk();
            }}
            disabled={loading}
          >
            {loading ? "Оруулж байна…" : "Оруулах"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ImportAssessmentModal;
