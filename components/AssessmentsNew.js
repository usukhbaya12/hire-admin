// components/tests/TestsPageClient.jsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChartSquareLineDuotone,
  CheckCircleBoldDuotone,
  EyeBoldDuotone,
  ListCheckLineDuotone,
  MagniferLineDuotone,
  AddCircleBoldDuotone,
  SortFromTopToBottomLineDuotone,
  FilterLineDuotone,
  ArchiveMinimalisticBoldDuotone,
  StarBoldDuotone,
  UserRoundedLineDuotone,
  CalendarLineDuotone,
  DocumentTextLineDuotone,
} from "solar-icons";
import { getAssessmentsNew } from "@/app/api/assessment";

const ASSESSMENT_TYPE = {
  TEST: 10,
  SURVEY: 20,
};

const STATUS = {
  OPEN: 10,
  ARCHIVED: 20,
  FEATURED: 30,
};

const typeOptions = [
  { value: "", label: "Бүгд" },
  { value: String(ASSESSMENT_TYPE.SURVEY), label: "Үнэлгээ" },
  { value: String(ASSESSMENT_TYPE.TEST), label: "Зөв хариулттай тест" },
];

const statusOptions = [
  { value: "", label: "Бүгд" },
  { value: String(STATUS.OPEN), label: "Нээлттэй" },
  { value: String(STATUS.ARCHIVED), label: "Архив" },
  { value: String(STATUS.FEATURED), label: "Онцлох" },
];

const sortOptions = [
  { value: "updatedAt_DESC", label: "Сүүлд шинэчилсэн" },
  { value: "updatedAt_ASC", label: "Хуучин шинэчлэлт" },
  { value: "name_ASC", label: "Нэр A-Я" },
  { value: "name_DESC", label: "Нэр Я-A" },
  { value: "price_DESC", label: "Үнэ өндөр" },
  { value: "price_ASC", label: "Үнэ бага" },
  { value: "count_DESC", label: "Ашигласан их" },
  { value: "count_ASC", label: "Ашигласан бага" },
];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getTypeMeta(type) {
  if (type === ASSESSMENT_TYPE.TEST) {
    return {
      label: "Тест",
      icon: <ListCheckLineDuotone width={18} />,
      chipClass: "bg-violet-50 text-violet-700 border-violet-200",
    };
  }

  return {
    label: "Үнэлгээ",
    icon: <ChartSquareLineDuotone width={18} />,
    chipClass: "bg-orange-50 text-orange-700 border-orange-200",
  };
}

function getStatusMeta(status) {
  switch (status) {
    case STATUS.OPEN:
      return {
        label: "Нээлттэй",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case STATUS.ARCHIVED:
      return {
        label: "Архив",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    case STATUS.FEATURED:
      return {
        label: "Онцлох",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        label: "Тодорхойгүй",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatCard({ title, value, icon, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options, icon, className = "" }) {
  return (
    <div
      className={cn(
        "relative flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm",
        className,
      )}
    >
      <div className="mr-2 text-slate-400">{icon}</div>
      <select
        value={value}
        onChange={onChange}
        className="h-full w-full appearance-none bg-transparent pr-7 text-sm text-slate-700 outline-none"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-slate-400">
        ⌄
      </span>
    </div>
  );
}

function SearchInput({ value, onChange }) {
  return (
    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
      <MagniferLineDuotone width={18} className="mr-2 text-slate-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder="Тестийн нэрээр хайх"
        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid animate-pulse grid-cols-12 gap-4 border-t border-slate-100 px-5 py-4">
      <div className="col-span-4 h-4 rounded bg-slate-200" />
      <div className="col-span-2 h-4 rounded bg-slate-200" />
      <div className="col-span-2 h-4 rounded bg-slate-200" />
      <div className="col-span-2 h-4 rounded bg-slate-200" />
      <div className="col-span-2 h-4 rounded bg-slate-200" />
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <DocumentTextLineDuotone width={24} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        Илэрц олдсонгүй
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Хайлтын үг эсвэл шүүлтүүрээ өөрчлөөд дахин оролдоно уу.
      </p>
      <button
        onClick={onReset}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Шүүлтүүр цэвэрлэх
      </button>
    </div>
  );
}

function MobileCard({ item }) {
  const typeMeta = getTypeMeta(item.type);
  const statusMeta = getStatusMeta(item.status);

  return (
    <Link
      href={`/test/${item.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
            typeMeta.chipClass,
          )}
        >
          {typeMeta.icon}
          {typeMeta.label}
        </div>

        <div
          className={cn(
            "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
            statusMeta.className,
          )}
        >
          {statusMeta.label}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-900">
        {item.name}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-400">Ангилал</p>
          <p className="mt-1 font-medium text-slate-700">
            {item.category || "-"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-400">Үнэ</p>
          <p className="mt-1 font-medium text-slate-700">{item.price ?? 0}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-400">Үүсгэсэн</p>
          <p className="mt-1 font-medium text-slate-700">
            {item.createdBy || "-"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-400">Шинэчилсэн</p>
          <p className="mt-1 font-medium text-slate-700">
            {formatDate(item.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span>Оролт: {item.count ?? 0}</span>
        <span>Гүйцэтгэл: {item.completeness ?? 0}%</span>
      </div>
    </Link>
  );
}

export default function TestsPageClient({
  initialData,
  initialCategories = [],
}) {
  const router = useRouter();
  const abortRef = useRef(null);

  const [rows, setRows] = useState(initialData?.data || []);
  const [pagination, setPagination] = useState(
    initialData?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  );
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sortValue, setSortValue] = useState("updatedAt_DESC");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  const categoryOptions = useMemo(() => {
    const flat = [{ value: "", label: "Бүх ангилал" }];

    const walk = (items = []) => {
      items.forEach((item) => {
        flat.push({
          value: String(item.id),
          label: item.name,
        });

        if (item.subcategories?.length) {
          walk(item.subcategories);
        }
      });
    };

    walk(initialCategories);
    return flat;
  }, [initialCategories]);

  const stats = useMemo(() => {
    const total = pagination.total || 0;
    const featured = rows.filter((x) => x.status === STATUS.FEATURED).length;
    const archived = rows.filter((x) => x.status === STATUS.ARCHIVED).length;
    const open = rows.filter((x) => x.status === STATUS.OPEN).length;

    return { total, featured, archived, open };
  }, [rows, pagination.total]);

  const fetchData = useCallback(
    async ({
      page = pagination.page,
      limit = pagination.limit,
      search = debouncedSearch,
      nextType = type,
      nextStatus = status,
      nextCategory = category,
      nextSort = sortValue,
    } = {}) => {
      try {
        setLoading(true);

        if (abortRef.current) {
          abortRef.current.abort();
        }

        const controller = new AbortController();
        abortRef.current = controller;

        const [sortBy, sortDir] = nextSort.split("_");

        const res = await getAssessmentsNew({
          page,
          limit,
          name: search || undefined,
          type: nextType || undefined,
          status: nextStatus || undefined,
          category: nextCategory || undefined,
          sortBy,
          sortDir,
        });

        if (!res?.success) {
          throw new Error(res?.message || "Алдаа гарлаа");
        }

        setRows(res.data?.data || []);
        setPagination(
          res.data?.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      debouncedSearch,
      type,
      status,
      category,
      sortValue,
    ],
  );

  useEffect(() => {
    fetchData({
      page: 1,
      limit: pagination.limit,
    });
  }, [debouncedSearch, type, status, category, sortValue]);

  const handlePageChange = (nextPage) => {
    fetchData({
      page: nextPage,
      limit: pagination.limit,
    });
  };

  const handleLimitChange = (e) => {
    const nextLimit = Number(e.target.value);
    fetchData({
      page: 1,
      limit: nextLimit,
    });
  };

  const resetFilters = () => {
    setSearchText("");
    setDebouncedSearch("");
    setType("");
    setStatus("");
    setCategory("");
    setSortValue("updatedAt_DESC");
    fetchData({
      page: 1,
      limit: 10,
      search: "",
      nextType: "",
      nextStatus: "",
      nextCategory: "",
      nextSort: "updatedAt_DESC",
    });
  };

  const from =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.05),_transparent_35%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Assessment hub
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Тестүүд
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Тест, үнэлгээ, ангилал болон шинэчлэлтийг нэг дороос цэвэрхэн
                  удирдах хуудас.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/test/new")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <AddCircleBoldDuotone width={18} />
                  Тест үүсгэх
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Нийт тест"
            value={stats.total}
            icon={<DocumentTextLineDuotone width={20} />}
          />
          <StatCard
            title="Нээлттэй"
            value={stats.open}
            icon={<CheckCircleBoldDuotone width={20} />}
          />
          <StatCard
            title="Онцлох"
            value={stats.featured}
            icon={<StarBoldDuotone width={20} />}
          />
          <StatCard
            title="Архив"
            value={stats.archived}
            icon={<ArchiveMinimalisticBoldDuotone width={20} />}
          />
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SearchInput
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <FilterSelect
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={typeOptions}
                icon={<FilterLineDuotone width={18} />}
              />
            </div>

            <div className="lg:col-span-2">
              <FilterSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
                icon={<CheckCircleBoldDuotone width={18} />}
              />
            </div>

            <div className="lg:col-span-2">
              <FilterSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
                icon={<DocumentTextLineDuotone width={18} />}
              />
            </div>

            <div className="lg:col-span-2">
              <FilterSelect
                value={sortValue}
                onChange={(e) => setSortValue(e.target.value)}
                options={sortOptions}
                icon={<SortFromTopToBottomLineDuotone width={18} />}
              />
            </div>
          </div>
        </section>

        {rows.length === 0 && !loading ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <>
            <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div className="col-span-4">Нэр</div>
                <div className="col-span-2">Ангилал</div>
                <div className="col-span-1">Төрөл</div>
                <div className="col-span-1">Төлөв</div>
                <div className="col-span-1">Үнэ</div>
                <div className="col-span-1">Оролт</div>
                <div className="col-span-2">Шинэчилсэн</div>
              </div>

              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                rows.map((item) => {
                  const typeMeta = getTypeMeta(item.type);
                  const statusMeta = getStatusMeta(item.status);

                  return (
                    <Link
                      href={`/test/${item.id}`}
                      key={item.id}
                      className="grid grid-cols-12 gap-4 border-t border-slate-100 px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="col-span-4 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-700">
                            {typeMeta.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <UserRoundedLineDuotone width={14} />
                                {item.createdBy || "-"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <EyeBoldDuotone width={14} />
                                {item.completeness ?? 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center text-sm text-slate-600">
                        {item.category || "-"}
                      </div>

                      <div className="col-span-1 flex items-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                            typeMeta.chipClass,
                          )}
                        >
                          {typeMeta.label}
                        </span>
                      </div>

                      <div className="col-span-1 flex items-center">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                            statusMeta.className,
                          )}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="col-span-1 flex items-center text-sm font-medium text-slate-700">
                        {item.price ?? 0}
                      </div>

                      <div className="col-span-1 flex items-center text-sm text-slate-600">
                        {item.count ?? 0}
                      </div>

                      <div className="col-span-2 flex items-center text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarLineDuotone width={14} />
                          {formatDate(item.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </section>

            <section className="space-y-4 lg:hidden">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="h-4 w-24 rounded bg-slate-200" />
                      <div className="mt-3 h-5 w-4/5 rounded bg-slate-200" />
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="h-20 rounded-xl bg-slate-100" />
                        <div className="h-20 rounded-xl bg-slate-100" />
                        <div className="h-20 rounded-xl bg-slate-100" />
                        <div className="h-20 rounded-xl bg-slate-100" />
                      </div>
                    </div>
                  ))
                : rows.map((item) => <MobileCard key={item.id} item={item} />)}
            </section>

            <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {from}-{to} / Нийт {pagination.total} тест
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Хуудас бүрт</span>
                  <select
                    value={pagination.limit}
                    onChange={handleLimitChange}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                  >
                    {[10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Өмнөх
                  </button>

                  <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
                    {pagination.page}
                  </div>

                  <button
                    disabled={
                      pagination.page >= pagination.totalPages || loading
                    }
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Дараах
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
