"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChartSquareLineDuotone,
  CheckCircleBoldDuotone,
  EyeBoldDuotone,
  ListCheckLineDuotone,
  MagniferLineDuotone,
  SortFromTopToBottomLineDuotone,
  FilterLineDuotone,
  DocumentTextLineDuotone,
  NotesBoldDuotone,
  TestTubeMinimalisticLineDuotone,
  TrashBin2BoldDuotone,
  CalendarLineDuotone,
  DocumentAddLineDuotone,
  UserLineDuotone,
  SmileCircleBoldDuotone,
  ChatRoundLineBoldDuotone,
  ChatRoundLineDuotone,
  Dialog2LineDuotone,
} from "solar-icons";
import {
  getAssessmentsNew,
  createAssessment,
  updateAssessmentById,
  deleteAssessmentById,
  getAssessmentCategory,
} from "@/app/api/assessment";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreIcon } from "./Icons";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

import NewAssessment from "./modals/New";
import InfoModal from "./modals/Info";
import OkModal from "./modals/Ok";
import { CommentOutlined } from "@ant-design/icons";
import { MessageCircleMore } from "lucide-react";

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
  { value: "", label: "Бүх төрөл" },
  { value: String(ASSESSMENT_TYPE.SURVEY), label: "Үнэлгээ" },
  { value: String(ASSESSMENT_TYPE.TEST), label: "Зөв хариулттай тест" },
];

const statusOptions = [
  { value: "", label: "Бүх төлөв" },
  { value: String(STATUS.OPEN), label: "Нээлттэй" },
  { value: String(STATUS.ARCHIVED), label: "Архив" },
  { value: String(STATUS.FEATURED), label: "Онцлох" },
];

const sortOptions = [
  { value: "createdAt_DESC", label: "Сүүлд нэмсэн" },
  { value: "createdAt_ASC", label: "Эхэнд нэмсэн" },
  { value: "updatedAt_DESC", label: "Сүүлд шинэчилсэн" },
  { value: "updatedAt_ASC", label: "Эхэнд шинэчилсэн" },
  { value: "name_ASC", label: "Нэр A-Я" },
  { value: "name_DESC", label: "Нэр Я-A" },
  { value: "price_DESC", label: "Өндөр үнэтэй" },
  { value: "price_ASC", label: "Хямд үнэтэй" },
  { value: "count_DESC", label: "Их өгсөн" },
  { value: "count_ASC", label: "Бага өгсөн" },
];

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
        className: "bg-slate-100 text-slate-800 border-slate-200",
      };
    case STATUS.FEATURED:
      return {
        label: "Онцлох",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    default:
      return {
        label: "Тодорхойгүй",
        className: "bg-slate-100 text-slate-800 border-slate-200",
      };
  }
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function FilterSelect({
  value,
  onChange,
  options,
  icon,
  placeholder = "Дараалал",
  subOptions = [],
}) {
  return (
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
              key={item.value + index || "all"}
              value={item.value || "all"}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        {subOptions.length > 0 && (
          <SelectGroup>
            <SelectLabel>Дэд ангилал</SelectLabel>

            {subOptions.map((item, index) => (
              <SelectItem key={`sub-${item.value}-${index}`} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

function SearchInput({ value, onChange }) {
  return (
    <InputGroup>
      <InputGroupAddon>
        <MagniferLineDuotone />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={onChange}
        placeholder="Тестийн нэрээр хайх"
      />
    </InputGroup>
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
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <DocumentTextLineDuotone width={24} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        Илэрц олдсонгүй
      </h3>
      <p className="mt-1 text-slate-600">
        Хайлтын үг эсвэл шүүлтүүрээ өөрчлөөд дахин оролдоно уу.
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
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);

  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, record: null });
  const [featuredLimitModal, setFeaturedLimitModal] = useState({ open: false });
  const [featuredCount, setFeaturedCount] = useState(
    initialData?.meta?.featured ?? 0,
  );

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sortValue, setSortValue] = useState("createdAt_DESC");
  const [createdUserOptions, setCreatedUserOptions] = useState(
    initialData?.meta?.createdUsers || [],
  );
  const [createdUser, setCreatedUser] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  const mainCategoryOptions = useMemo(
    () => [
      { value: "", label: "Бүх ангилал" },
      ...categories
        .filter((item) => !item.parent)
        .map((item) => ({
          value: String(item.id),
          label: item.name,
        })),
    ],
    [categories],
  );

  const subCategoryOptions = useMemo(
    () =>
      categories
        .filter((item) => !item.parent)
        .flatMap((item) =>
          (item.subcategories || []).map((sub) => ({
            value: String(sub.id),
            label: sub.name,
          })),
        ),
    [categories],
  );

  const fetchData = useCallback(
    async ({
      page = pagination.page,
      limit = pagination.limit,
      search = debouncedSearch,
      nextType = type,
      nextCreatedUser = createdUser,
      nextStatus = status,
      nextCategory = category,
      nextSort = sortValue,
    } = {}) => {
      try {
        setTableLoading(true);

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
          createdUser: nextCreatedUser || undefined,
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
        setFeaturedCount(res.data?.meta?.featured ?? 0);
        setCreatedUserOptions(res.data?.meta?.createdUsers || []);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error(error);

          toast.error(error?.message || "Мэдээлэл дуудах үед алдаа гарлаа.");
        }
      } finally {
        setTableLoading(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      debouncedSearch,
      type,
      createdUser,
      status,
      category,
      sortValue,
      toast,
    ],
  );

  useEffect(() => {
    fetchData({
      page: 1,
      limit: pagination.limit,
    });
  }, [debouncedSearch, type, createdUser, status, category, sortValue]);

  const refreshCategories = useCallback(async () => {
    try {
      const categoriesRes = await getAssessmentCategory();
      if (categoriesRes?.success) {
        setCategories(categoriesRes.data || []);
      } else {
        toast.error(error?.message || "Мэдээлэл дуудах үед алдаа гарлаа.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Мэдээлэл дуудах үед алдаа гарлаа.");
    }
  }, [toast]);

  const handleCreateAssessment = useCallback(
    async (formData) => {
      try {
        setActionLoading(true);

        const answerCategories = (formData.categories || []).map(
          (categoryName) => ({
            name: categoryName,
            description: "",
          }),
        );

        const response = await createAssessment({
          category: formData.assessmentCategory,
          name: formData.testName,
          description: "",
          usage: "",
          measure: "",
          questionCount: 0,
          price: 0,
          duration: 0,
          type: formData.type,
          answerCategories,
          status: STATUS.ARCHIVED,
        });

        if (response?.success && response?.data?.id) {
          toast.success("Тест амжилттай үүссэн.");
          setIsModalOpen(false);
          await refreshCategories();
          router.push(`/test/${response.data.id}`);
        } else {
          toast.error(response?.message || "Тест үүсгэхэд алдаа гарлаа.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Сервертэй холбогдоход алдаа гарлаа.");
      } finally {
        setActionLoading(false);
      }
    },
    [toast, refreshCategories, router],
  );

  const handleStatusChange = useCallback(
    async (item, newStatus) => {
      if (!item?.id || item.status === newStatus) return;

      if (
        newStatus === STATUS.FEATURED &&
        item.status !== STATUS.FEATURED &&
        featuredCount >= 3
      ) {
        setFeaturedLimitModal({ open: true });
        return;
      }

      const prevRows = rows;
      const prevFeaturedCount = featuredCount;
      const activeStatusFilter = status;

      try {
        setActionLoading(true);
        setActiveRowId(item.id);

        setRows((current) =>
          current.map((row) =>
            row.id === item.id ? { ...row, status: newStatus } : row,
          ),
        );

        if (newStatus === STATUS.FEATURED && item.status !== STATUS.FEATURED) {
          setFeaturedCount((prev) => prev + 1);
        } else if (
          item.status === STATUS.FEATURED &&
          newStatus !== STATUS.FEATURED
        ) {
          setFeaturedCount((prev) => Math.max(0, prev - 1));
        }

        const response = await updateAssessmentById(item.id, {
          status: newStatus,
        });

        if (!response?.success) {
          setRows(prevRows);
          setFeaturedCount(prevFeaturedCount);
          toast.error(response?.message || "Төлөв өөрчлөхөд алдаа гарлаа.");
          return;
        }

        if (
          activeStatusFilter &&
          String(newStatus) !== String(activeStatusFilter)
        ) {
          setRows((current) => current.filter((row) => row.id !== item.id));
          setPagination((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
          }));
        }

        toast.success("Төлөв амжилттай өөрчлөгдлөө.");
      } catch (error) {
        console.error(error);
        setRows(prevRows);
        setFeaturedCount(prevFeaturedCount);
        toast.error("Сервертэй холбогдоход алдаа гарлаа.");
      } finally {
        setActionLoading(false);
        setActiveRowId(null);
      }
    },
    [rows, featuredCount, status, toast],
  );

  const handlePreview = useCallback((item) => {
    window.open(`/preview/${item.id}`, "_blank", "noopener,noreferrer");
  }, []);

  const handleDeleteClick = useCallback((item) => {
    setDeleteModal({ open: true, record: item });
  }, []);

  const handleDelete = useCallback(async () => {
    const item = deleteModal.record;
    if (!item?.id) return;

    try {
      setActionLoading(true);

      const response = await deleteAssessmentById(item.id);

      if (response?.success) {
        toast.success("Тест устсан.");
        setDeleteModal({ open: false, record: null });
        await fetchData({
          page:
            rows.length === 1 && pagination.page > 1
              ? pagination.page - 1
              : pagination.page,
        });
      } else {
        toast.error(response?.message || "Тест устгахад алдаа гарлаа.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setActionLoading(false);
    }
  }, [deleteModal.record, fetchData, rows.length, pagination.page, toast]);

  const handlePageChange = (nextPage) => {
    fetchData({
      page: nextPage,
      limit: pagination.limit,
    });
  };

  const handleLimitChange = (value) => {
    const nextLimit = Number(value);
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
    setCreatedUser("");
    setSortValue("createdAt_DESC");
    fetchData({
      page: 1,
      limit: 10,
      search: "",
      nextType: "",
      nextCreatedUser: "",
      nextStatus: "",
      nextCategory: "",
      nextSort: "createdAt_DESC",
    });
  };

  const from =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  const paginationItems = useMemo(
    () => getPaginationItems(pagination.page, pagination.totalPages || 1),
    [pagination.page, pagination.totalPages],
  );

  return (
    <>
      <InfoModal
        open={deleteModal.open}
        onOk={handleDelete}
        onCancel={() => setDeleteModal({ open: false, record: null })}
        text={`${
          deleteModal.record?.name || "Сонгосон тест"
        }-ийг устгах гэж байна. Итгэлтэй байна уу? Энэ үйлдлийг сэргээх боломжгүй.`}
        title="Тест устгах"
      />

      <OkModal
        open={featuredLimitModal.open}
        onOk={() => setFeaturedLimitModal({ open: false })}
        onCancel={() => setFeaturedLimitModal({ open: false })}
        text="Аль хэдийн 3 тест онцолсон байна. Нэмж тест онцлох боломжгүй."
      />

      <NewAssessment
        assessmentCategories={categories}
        isModalOpen={isModalOpen}
        handleOk={handleCreateAssessment}
        handleCancel={() => setIsModalOpen(false)}
        onCategoryCreate={refreshCategories}
      />

      <div className="px-5 py-6">
        <div className="mx-auto max-w-7xl">
          <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="relative p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(243,100,33,0.15),_transparent_35%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <NotesBoldDuotone
                    className="text-main"
                    width={32}
                    height={32}
                  />
                  <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-700 sm:text-3xl">
                    Тестийн сан
                  </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setIsModalOpen(true)}>
                    <DocumentAddLineDuotone width={24} height={24} />
                    Тест үүсгэх
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 flex gap-2 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <SearchInput
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <FilterSelect
              value={createdUser}
              onChange={setCreatedUser}
              options={[
                { value: "", label: "Бүх админ" },
                ...createdUserOptions.map((user) => ({
                  value: String(user.id),
                  label: user.name,
                })),
              ]}
              icon={<UserLineDuotone width={18} />}
              placeholder="Үүсгэсэн админ сонгох"
            />
            <FilterSelect
              value={type}
              onChange={setType}
              options={typeOptions}
              icon={<DocumentTextLineDuotone width={18} />}
              placeholder="Төрөл сонгох"
            />

            <FilterSelect
              value={status}
              onChange={setStatus}
              options={statusOptions}
              icon={<CheckCircleBoldDuotone width={18} />}
              placeholder="Төлөв сонгох"
            />

            <FilterSelect
              value={category}
              onChange={setCategory}
              options={mainCategoryOptions}
              icon={<TestTubeMinimalisticLineDuotone width={18} />}
              placeholder="Ангилал сонгох"
              subOptions={subCategoryOptions}
            />

            <FilterSelect
              value={sortValue}
              onChange={setSortValue}
              options={sortOptions}
              icon={<SortFromTopToBottomLineDuotone width={18} />}
            />
          </section>

          {rows.length === 0 && !tableLoading ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <>
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <div className="grid grid-cols-25 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800">
                  <div className="col-span-9">Тестийн нэр</div>
                  <div className="col-span-4">Үүсгэсэн</div>
                  <div className="col-span-2 text-center">Төлөв</div>
                  <div className="col-span-2 text-center">Үнэ</div>
                  <div className="col-span-3 text-center">Өгсөн тоо</div>
                  <div className="col-span-4 text-center">Шинэчилсэн</div>
                  <div className="col-span-1 text-center"></div>
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
                    const typeMeta = getTypeMeta(item.type);
                    const statusMeta = getStatusMeta(item.status);

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-25 gap-4 border-t border-slate-100 px-5 py-4 transition hover:bg-slate-50"
                      >
                        <Link
                          href={`/test/${item.id}`}
                          className="col-span-9 min-w-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl bg-slate-100 px-2 py-1 text-main">
                              {typeMeta.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-main! text-[15px] font-bold text-slate-900">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-3 text-[13px] text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                  <TestTubeMinimalisticLineDuotone width={14} />
                                  {item.category || "-"}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <EyeBoldDuotone width={14} />
                                  {item.completeness ?? 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>

                        <div className="col-span-4 flex flex-col justify-center text-slate-800">
                          <div className="flex gap-1">
                            {item.createdBy || "-"}
                          </div>
                          <div className="flex items-center gap-3 text-[13px] text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <CalendarLineDuotone width={14} />
                              <span className="mt-1">
                                {
                                  new Date(item.createdAt)
                                    .toISOString()
                                    .split("T")[0]
                                }
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-center">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-1 text-[13px] font-medium",
                              statusMeta.className,
                            )}
                          >
                            {statusMeta.label}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center justify-center font-medium text-slate-800">
                          {item.price > 0
                            ? item.price.toLocaleString() + "₮"
                            : "Үнэгүй"}
                        </div>
                        <div className="col-span-3 flex items-center justify-center text-slate-800">
                          <div className="flex flex-col items-center">
                            {item.count}

                            <div className="flex items-center gap-3 text-[13px]">
                              <span className="text-main flex items-center gap-1">
                                <SmileCircleBoldDuotone width={14} />
                                <span className="mt-0.5">
                                  {item.percentage}%
                                </span>
                              </span>

                              <span className="flex items-center gap-1 text-emerald-700">
                                <Dialog2LineDuotone width={14} />
                                <span className="mt-0.5">{item.comments}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-span-4 flex items-center justify-center text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <CalendarLineDuotone width={18} />

                            <span className="mt-1">
                              {
                                new Date(item.updatedAt)
                                  .toISOString()
                                  .split("T")[0]
                              }
                            </span>
                          </span>
                        </div>

                        <div className="col-span-1 flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost">
                                <MoreIcon />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <CheckCircleBoldDuotone width={18} />
                                  Төлөв өөрчлөх
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuGroup>
                                      <DropdownMenuItem
                                        disabled={
                                          item.status === STATUS.FEATURED
                                        }
                                        onClick={() =>
                                          handleStatusChange(
                                            item,
                                            STATUS.FEATURED,
                                          )
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                          <span className="font-medium">
                                            Онцлох
                                          </span>
                                        </div>
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        disabled={item.status === STATUS.OPEN}
                                        onClick={() =>
                                          handleStatusChange(item, STATUS.OPEN)
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-main" />
                                          <span className="font-medium">
                                            Нээлттэй
                                          </span>
                                        </div>
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        disabled={
                                          item.status === STATUS.ARCHIVED
                                        }
                                        onClick={() =>
                                          handleStatusChange(
                                            item,
                                            STATUS.ARCHIVED,
                                          )
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-gray-600" />
                                          <span className="font-medium">
                                            Архив
                                          </span>
                                        </div>
                                      </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>

                              <DropdownMenuItem
                                onClick={() => handlePreview(item)}
                              >
                                <EyeBoldDuotone width={18} />
                                Урьдчилж харах
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(item)}
                                variant="destructive"
                              >
                                <TrashBin2BoldDuotone width={18} />
                                Устгах
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between mb-2">
                <div className="text-slate-600">
                  {from}-с {to} / Нийт {pagination.total} тест
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
                        {[10, 20, 50].map((size) => (
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
    </>
  );
}
