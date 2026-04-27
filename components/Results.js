"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  FolderFavouriteBookmarkBoldDuotone,
  MagniferLineDuotone,
  SortFromTopToBottomLineDuotone,
  CalendarLineDuotone,
  Buildings2LineDuotone,
  DownloadSquareLineDuotone,
  EyeBoldDuotone,
  EyeClosedLineDuotone,
  NotesBoldDuotone,
  CheckCircleBoldDuotone,
  FilterLineDuotone,
  LaptopLineDuotone,
  UserIdLineDuotone,
  DocumentAddLineDuotone,
  CursorSquareLineDuotone,
  CheckCircleLineDuotone,
} from "solar-icons";

import { getAssessmentExamsNew } from "@/app/api/constant";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "./ui/select";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const EXAM_STATUS = {
  STARTED: 10,
  FINISHED: 20,
  NOT_STARTED: 30,
};

const DEFAULT_LIMIT = 20;
const DEFAULT_SORT = "createdAt_DESC";

const examStatusOptions = [
  { value: "", label: "Бүх төлөв" },
  { value: String(EXAM_STATUS.STARTED), label: "Эхэлсэн" },
  { value: String(EXAM_STATUS.FINISHED), label: "Дууссан" },
  { value: String(EXAM_STATUS.NOT_STARTED), label: "Өгөөгүй" },
];

const sortOptions = [
  { value: "createdAt_DESC", label: "Сүүлд үүссэн" },
  { value: "createdAt_ASC", label: "Эхэнд үүссэн" },
  { value: "userStartDate_DESC", label: "Сүүлд өгсөн" },
  { value: "userStartDate_ASC", label: "Эхэнд өгсөн" },
  { value: "userEndDate_DESC", label: "Сүүлд дууссан" },
  { value: "userEndDate_ASC", label: "Эхэнд дууссан" },
  { value: "assessmentName_ASC", label: "Тест A-Я" },
  { value: "assessmentName_DESC", label: "Тест Я-А" },
  // { value: "firstname_ASC", label: "Нэр A-Я" },
  // { value: "firstname_DESC", label: "Нэр Я-A" },
  // { value: "buyerOrganizationName_ASC", label: "Байгууллага A-Я" },
  // { value: "buyerOrganizationName_DESC", label: "Байгууллага Я-A" },
  // { value: "examstatus_ASC", label: "Төлөв ↑" },
  // { value: "examstatus_DESC", label: "Төлөв ↓" },
];

const EMPTY_META = {
  assessments: [],
  buyers: [],
  counts: {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
  },
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: DEFAULT_LIMIT,
  total: 0,
  totalPages: 0,
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getDefaultDateRange() {
  const start = new Date();
  start.setMonth(start.getMonth() - 1);

  const end = new Date();
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function formatDateForApi(date) {
  if (!date) return null;

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(value, withTime = false) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  if (!withTime) return `${yyyy}-${mm}-${dd}`;

  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function getExamStatusMeta(status) {
  switch (Number(status)) {
    case EXAM_STATUS.FINISHED:
      return {
        label: "Дууссан",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case EXAM_STATUS.STARTED:
      return {
        label: "Эхэлсэн",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case EXAM_STATUS.NOT_STARTED:
    default:
      return {
        label: "Өгөөгүй",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
  }
}

function SearchInput({ value, onChange, placeholder = "И-мэйлээр хайх" }) {
  return (
    <div className="group relative">
      <label className="bg-background text-foreground absolute top-0 left-2 z-10 block -translate-y-1/2 px-1 text-xs font-medium group-has-disabled:opacity-50">
        Шалгуулагч
      </label>
      <InputGroup>
        <InputGroupAddon>
          <MagniferLineDuotone />
        </InputGroupAddon>
        <InputGroupInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </InputGroup>
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
  icon,
  placeholder = "Сонгох",
}) {
  return (
    <div className="group relative">
      <label className="bg-background text-foreground absolute top-0 left-2 z-10 block -translate-y-1/2 px-1 text-xs font-medium group-has-disabled:opacity-50">
        {placeholder}
      </label>

      <Select
        value={value || "all"}
        onValueChange={(val) => onChange(val === "all" ? "" : val)}
      >
        <SelectTrigger>
          {icon}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel>{placeholder}</SelectLabel>
            {options.map((item, index) => (
              <SelectItem
                key={`${item.value ?? "all"}-${index}`}
                value={item.value || "all"}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  icon,
  placeholder = "Сонгох",
  label,
}) {
  const normalizedOptions = options.map((item) => ({
    value: item.value ?? "all",
    label: item.label,
  }));

  const selected =
    normalizedOptions.find((item) => item.value === (value || "all"))?.label ||
    "";

  return (
    <div className="w-50">
      <div className="group relative">
        <label className="bg-background text-foreground absolute top-0 left-2 z-10 block -translate-y-1/2 px-1 text-xs font-medium group-has-disabled:opacity-50">
          {label}
        </label>

        <Combobox
          autoHighlight
          items={normalizedOptions}
          value={selected}
          onValueChange={(selectedLabel) => {
            const selectedItem = normalizedOptions.find(
              (item) => item.label === selectedLabel,
            );
            onChange(selectedItem?.value === "all" ? "" : selectedItem?.value);
          }}
        >
          <ComboboxInput
            placeholder={placeholder}
            className="h-9.5"
            showClear={!!value}
          >
            <InputGroupAddon>{icon}</InputGroupAddon>
          </ComboboxInput>

          <ComboboxContent className="w-50">
            <ComboboxEmpty>Өгөгдөл олдсонгүй</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item.label}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid animate-pulse grid-cols-25 gap-4 border-t border-slate-100 px-5 py-4">
      <div className="col-span-7 h-4 rounded bg-slate-200" />
      <div className="col-span-5 h-4 rounded bg-slate-200" />
      <div className="col-span-4 h-4 rounded bg-slate-200" />
      <div className="col-span-3 h-4 rounded bg-slate-200" />
      <div className="col-span-4 h-4 rounded bg-slate-200" />
      <div className="col-span-2 h-4 rounded bg-slate-200" />
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <FolderFavouriteBookmarkBoldDuotone width={24} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        Илэрц олдсонгүй
      </h3>
      <p className="mt-1 text-slate-600">
        Хайлтын нөхцөл эсвэл шүүлтүүрээ өөрчлөөд дахин оролдоно уу.
      </p>
      <Button onClick={onReset} variant="secondary" className="mt-5">
        <FilterLineDuotone width={18} />
        Цэвэрлэх
      </Button>
    </div>
  );
}

function getPaginationItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total];
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

function getGrowthMeta(current = 0, previous = 0) {
  if (!previous && !current) {
    return { text: "0%", positive: true, diff: 0 };
  }

  if (!previous && current > 0) {
    return { text: "+100%", positive: true, diff: current };
  }

  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);

  return {
    text: `${pct > 0 ? "+" : ""}${pct}%`,
    positive: diff >= 0,
    diff,
  };
}

function SingleDatePicker({ value, onChange, minDate, maxDate, placeholder }) {
  return (
    <div className="group relative">
      <label className="bg-background text-foreground absolute top-0 left-2 z-10 block -translate-y-1/2 px-1 text-xs font-medium group-has-disabled:opacity-50">
        {placeholder}
      </label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left"
            data-icon="inline-end"
          >
            <CalendarLineDuotone className="text-black/50 -ml-1" />
            <span className="ml-0.5">
              {value ? formatDateForApi(value) : placeholder || "Огноо сонгох"}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={onChange}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            defaultMonth={value || new Date()}
            initialFocus
            className="[--cell-size:--spacing(7.5)] text-[13px]"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function renderResult(item) {
  if (Number(item.examstatus) !== EXAM_STATUS.FINISHED) return "-";

  const { result, value, point, assessmentType, totalPoint } = item;

  if (assessmentType === 10) {
    const percent =
      totalPoint && totalPoint > 0 ? Math.round((point / totalPoint) * 100) : 0;

    return (
      <div className="w-full max-w-[180px]">
        <div className="flex items-center justify-between text-[13px] font-semibold text-slate-900">
          <span className="text-slate-500">{percent}%</span>

          <span>
            {point}/{totalPoint}
          </span>
        </div>

        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-main transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        {(result || value) && (
          <div className="mt-1 text-[12px] text-slate-600">
            {[result, value].filter(Boolean).join(" / ")}
          </div>
        )}
      </div>
    );
  } else if (assessmentType === 20) {
    return (
      <div className="font-semibold text-slate-900">
        {[result, value].filter(Boolean).join(" / ")}
      </div>
    );
  } else {
    return "-";
  }
}

export default function ResultsPageClient({ initialData = null }) {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);

  const [rows, setRows] = useState(initialData?.data || []);
  const [pagination, setPagination] = useState(
    initialData?.pagination || EMPTY_PAGINATION,
  );
  const [meta, setMeta] = useState(initialData?.meta || EMPTY_META);
  const [tableLoading, setTableLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [assessment, setAssessment] = useState("");
  const [buyer, setBuyer] = useState("");
  const [examstatus, setExamstatus] = useState("");
  const [sortValue, setSortValue] = useState(DEFAULT_SORT);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchData = useCallback(
    async ({
      page = 1,
      limit = pagination.limit,
      nextAssessment = assessment,
      nextBuyer = buyer,
      nextSearch = debouncedSearch,
      nextExamstatus = examstatus,
      nextStartDate = startDate,
      nextEndDate = endDate,
      nextSort = sortValue,
    } = {}) => {
      try {
        setTableLoading(true);

        const [sortBy, sortDir] = nextSort.split("_");

        const res = await getAssessmentExamsNew(
          nextAssessment ? Number(nextAssessment) : 0,
          nextBuyer ? Number(nextBuyer) : null,
          nextSearch || "",
          nextExamstatus ? Number(nextExamstatus) : null,
          formatDateForApi(nextStartDate),
          formatDateForApi(nextEndDate),
          sortBy,
          sortDir,
          limit,
          page,
        );

        if (!res?.success) {
          throw new Error(res?.message || "Мэдээлэл дуудах үед алдаа гарлаа.");
        }

        setRows(res.data || []);
        setPagination(
          res.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        );
        setMeta(res.meta || EMPTY_META);
      } catch (error) {
        console.error(error);
        toast.error(error?.message || "Мэдээлэл дуудах үед алдаа гарлаа.");
      } finally {
        setTableLoading(false);
      }
    },
    [
      assessment,
      buyer,
      debouncedSearch,
      examstatus,
      startDate,
      endDate,
      sortValue,
      pagination.limit,
    ],
  );

  useEffect(() => {
    fetchData({ page: 1, limit: pagination.limit });
  }, [
    debouncedSearch,
    assessment,
    buyer,
    examstatus,
    startDate,
    endDate,
    sortValue,
    pagination.limit,
    fetchData,
  ]);

  const handlePageChange = (nextPage) => {
    fetchData({ page: nextPage, limit: pagination.limit });
  };

  const handleLimitChange = (value) => {
    fetchData({
      page: 1,
      limit: Number(value),
    });
  };

  const resetFilters = () => {
    const nextRange = getDefaultDateRange();

    setSearchText("");
    setDebouncedSearch("");
    setAssessment("");
    setBuyer("");
    setExamstatus("");
    setSortValue(DEFAULT_SORT);
    setStartDate(nextRange.start);
    setEndDate(nextRange.end);

    fetchData({
      page: 1,
      limit: DEFAULT_LIMIT,
      nextAssessment: "",
      nextBuyer: "",
      nextSearch: "",
      nextExamstatus: "",
      nextStartDate: nextRange.start,
      nextEndDate: nextRange.end,
      nextSort: DEFAULT_SORT,
    });
  };

  const exportToExcel = () => {
    if (!rows.length) {
      toast.warning("Экспортлох өгөгдөл олдсонгүй.");
      return;
    }

    try {
      const exportData = rows.map((record, index) => ({
        "№": (pagination.page - 1) * pagination.limit + index + 1,
        "Шалгуулагчийн нэр":
          `${record.firstname || ""} ${record.lastname || ""}`.trim() || "-",
        "И-мэйл": record.email || "-",
        Байгууллага: record.buyerOrganizationName || "-",
        Тест: record.assessmentName || "-",
        Төлөв: getExamStatusMeta(record.examstatus).label,
        "Эхэлсэн огноо": formatDate(record.userStartDate, true),
        "Дууссан огноо": formatDate(record.userEndDate, true),
        "Үр дүн":
          [record.result, record.value].filter(Boolean).join(" / ") || "-",
        Segment: record.segment || "-",
        Code: record.code || "-",
        "Үүссэн огноо": formatDate(record.createdAt, true),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 26 },
        { wch: 28 },
        { wch: 24 },
        { wch: 26 },
        { wch: 14 },
        { wch: 20 },
        { wch: 20 },
        { wch: 24 },
        { wch: 16 },
        { wch: 20 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Үр дүн");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Тест_үр_дүн_${date}.xlsx`);
      toast.success("Excel файл амжилттай татагдлаа.");
    } catch (error) {
      console.error(error);
      toast.error("Excel файл үүсгэхэд алдаа гарлаа.");
    }
  };

  const from =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  const paginationItems = useMemo(
    () => getPaginationItems(pagination.page, pagination.totalPages || 1),
    [pagination.page, pagination.totalPages],
  );

  const assessmentOptions = useMemo(
    () => [
      ...(meta?.assessments || []).map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ],
    [meta?.assessments],
  );

  const buyerOptions = useMemo(
    () => [
      ...(meta?.buyers || []).map((item) => ({
        value: String(item.userId),
        label: item.organizationName,
      })),
    ],
    [meta?.buyers],
  );

  const todayCount = meta?.counts?.today ?? 0;
  const yesterdayCount = meta?.counts?.yesterday ?? 0;
  const thisWeekCount = meta?.counts?.thisWeek ?? 0;
  const lastWeekCount = meta?.counts?.lastWeek ?? 0;
  const thisMonthCount = meta?.counts?.thisMonth ?? 0;
  const lastMonthCount = meta?.counts?.lastMonth ?? 0;

  return (
    <div className="px-5 py-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_110%_50%,rgba(243,100,33,0.22)_0%,transparent_60%),radial-gradient(ellipse_at_85%_-20%,rgba(250,199,117,0.25)_0%,transparent_50%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:gap-12">
                <div className="shrink-0">
                  <FolderFavouriteBookmarkBoldDuotone
                    className="text-main"
                    width={32}
                    height={32}
                  />
                  <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-700 sm:text-3xl">
                    Үр дүн
                  </h1>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    {
                      title: "Өнөөдөр",
                      current: todayCount,
                      previous: yesterdayCount,
                      label: "Өчигдөр",
                      date: formatDate(new Date()),
                    },
                    {
                      title: "Энэ 7 хоногт",
                      current: thisWeekCount,
                      previous: lastWeekCount,
                      label: "Өмнөх",
                      date: (() => {
                        const now = new Date();
                        const day = now.getDay();
                        const diffToMonday = day === 0 ? -6 : 1 - day;
                        const diffToSunday = day === 0 ? 0 : 7 - day;

                        const weekStart = new Date(now);
                        weekStart.setDate(now.getDate() + diffToMonday);

                        const weekEnd = new Date(now);
                        weekEnd.setDate(now.getDate() + diffToSunday);

                        return `${formatDate(weekStart).slice(5)}-с ${formatDate(weekEnd).slice(5)}`;
                      })(),
                    },
                    {
                      title: "Энэ сард",
                      current: thisMonthCount,
                      previous: lastMonthCount,
                      label: `${String(
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() - 1,
                          1,
                        ).getMonth() + 1,
                      ).padStart(2, "0")} сард`,
                      date:
                        `${new Date().getFullYear()}-` +
                        `${String(new Date().getMonth() + 1).padStart(2, "0")} САР`,
                    },
                  ].map((stat) => {
                    const growth = getGrowthMeta(stat.current, stat.previous);

                    return (
                      <div
                        key={stat.title}
                        className="rounded-xl border border-slate-200/70 bg-white/75 px-4 py-2.5 backdrop-blur-sm"
                      >
                        <div className="flex items-top justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                              {stat.title}
                            </span>
                            <span className="text-[10px] font-medium tracking-wide text-slate-500 -mt-1">
                              {stat.date}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-semibold whitespace-nowrap",
                              growth.positive
                                ? "text-emerald-600"
                                : "text-rose-600",
                            )}
                          >
                            {growth.positive ? "↗" : "↘"} {growth.text}
                          </span>
                        </div>

                        <div className="mt-0.5 flex items-end gap-1">
                          <span className="text-2xl font-extrabold leading-none text-slate-900 pr-1">
                            {stat.current.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            <LaptopLineDuotone width={12} height={17} />
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {stat.label}{" "}
                            <span className="font-semibold text-slate-500">
                              {stat.previous.toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={exportToExcel}>
                  <DownloadSquareLineDuotone width={18} />
                  Excel татах
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-6 flex flex-nowrap items-center gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex-1">
            <SearchInput
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <FilterSelect
            value={assessment}
            onChange={setAssessment}
            options={assessmentOptions}
            icon={<NotesBoldDuotone width={18} />}
            placeholder="Бүх тест"
            label="Тест сонгох"
          />

          <FilterSelect
            value={buyer}
            onChange={setBuyer}
            options={buyerOptions}
            icon={<Buildings2LineDuotone width={18} />}
            placeholder="Бүх байгууллага"
            label="Байгууллага сонгох"
          />

          <SelectFilter
            value={examstatus}
            onChange={setExamstatus}
            options={examStatusOptions}
            icon={<CheckCircleBoldDuotone width={18} />}
            placeholder="Төлөв сонгох"
          />

          <SingleDatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Эхлэх огноо"
          />

          <SingleDatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="Дуусах огноо"
            minDate={startDate || undefined}
          />

          <SelectFilter
            value={sortValue}
            onChange={setSortValue}
            options={sortOptions}
            icon={<SortFromTopToBottomLineDuotone width={18} />}
            placeholder="Эрэмбэлэх"
          />
        </section>

        {rows.length === 0 && !tableLoading ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="grid grid-cols-25 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800">
                <div className="col-span-7">Шалгуулагч</div>
                <div className="col-span-5">Тест</div>
                <div className="col-span-4">Огноо</div>
                <div className="col-span-3 text-center">Төлөв</div>
                <div className="col-span-4">Үр дүн</div>
                <div className="col-span-2 text-center">Тайлан</div>
              </div>

              {tableLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                rows.map((item) => {
                  const statusMeta = getExamStatusMeta(item.examstatus);
                  const fullName =
                    `${item.firstname || ""} ${item.lastname || ""}`.trim() ||
                    "-";
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-25 gap-4 border-t border-slate-100 px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="col-span-7 flex min-w-0 items-center">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className="rounded-xl bg-slate-100 px-2 py-1 text-main">
                              <UserIdLineDuotone width={18} />
                            </div>

                            {item.isInvited && (
                              <div className="rounded-lg px-2 pt-2 text-blue-600">
                                <Buildings2LineDuotone width={16} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate font-bold text-slate-900">
                              {item.email}
                            </div>

                            <div className="mt-0.5 truncate text-[13px] text-slate-600">
                              {fullName}
                            </div>

                            {item.isInvited && (
                              <div className="mt-1 text-[13px] font-semibold text-blue-700 leading-4">
                                {item.buyerOrganizationName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-5 flex min-w-0 pr-5 flex-col justify-center">
                        <div className="font-bold text-main">
                          {item.assessmentName || "-"}
                        </div>

                        <span className="inline-flex items-center gap-1.5">
                          <DocumentAddLineDuotone width={14} />
                          <span className="text-slate-700 text-[13px]">
                            {formatDate(item.createdAt, true)}
                          </span>
                        </span>
                      </div>
                      <div className="col-span-4 flex flex-col justify-center gap- text-[13px] text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <CursorSquareLineDuotone width={14} />
                          <span className="text-slate-700">
                            {item.userStartDate
                              ? formatDate(item.userStartDate, true)
                              : "-"}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircleLineDuotone width={14} />
                          <span className="text-slate-700">
                            {item.userEndDate
                              ? formatDate(item.userEndDate, true)
                              : "-"}
                          </span>
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center justify-center">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[13px] font-medium",
                            statusMeta.className,
                          )}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="col-span-4 flex flex-col justify-center">
                        {renderResult(item)}
                        {!item.visible && (
                          <span
                            className={`${item.assessmentType === 10 && "mt-1"} inline-flex items-center gap-1 text-[13px] text-slate-400`}
                          >
                            <EyeClosedLineDuotone width={14} />
                            Нуусан
                          </span>
                        )}
                      </div>

                      <div className="col-span-2 flex items-center justify-center">
                        {Number(item.examstatus) === EXAM_STATUS.FINISHED ? (
                          <a
                            href={`/api/report/${item.code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 font-semibold text-main hover:text-red-500"
                          >
                            <EyeBoldDuotone width={18} />
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section className="mb-2 mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-slate-600">
                {from}-с {to} / Нийт {pagination.total} үр дүн
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                <Select
                  value={String(pagination.limit)}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent position="popper" side="top" align="end">
                    <SelectGroup>
                      {[10, 20, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} / хуудас
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page > 1 && !tableLoading) {
                            handlePageChange(pagination.page - 1);
                          }
                        }}
                        className={
                          pagination.page <= 1 || tableLoading
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {paginationItems.map((item, idx) =>
                      item === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            isActive={pagination.page === item}
                            onClick={(e) => {
                              e.preventDefault();
                              if (item !== pagination.page && !tableLoading) {
                                handlePageChange(item);
                              }
                            }}
                            className={
                              tableLoading
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            pagination.page < pagination.totalPages &&
                            !tableLoading
                          ) {
                            handlePageChange(pagination.page + 1);
                          }
                        }}
                        className={
                          pagination.page >= pagination.totalPages ||
                          tableLoading
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
