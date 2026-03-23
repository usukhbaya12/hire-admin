"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import {
  Input,
  Button,
  Table,
  Dropdown,
  message,
  Select,
  Spin,
  ConfigProvider,
  Progress,
  Modal,
  Form,
  InputNumber,
} from "antd";
import { PlusIcon, MoreIcon, DropdownIcon } from "./Icons";
import { useRouter } from "next/navigation";
import NewAssessment from "./modals/New";
import {
  createAssessment,
  getAssessmentCategory,
  getAssessmentsNew,
  deleteAssessmentById,
  updateAssessmentById,
} from "@/app/api/assessment";
import mnMN from "antd/lib/locale/mn_MN";
import { customLocale } from "@/utils/values";
import {
  ChartSquareLineDuotone,
  CheckCircleBoldDuotone,
  CopyBoldDuotone,
  EyeBoldDuotone,
  ListCheckLineDuotone,
  MagniferLineDuotone,
  TrashBin2BoldDuotone,
} from "solar-icons";
import { LoadingOutlined } from "@ant-design/icons";

const TYPE = { TEST: 10, SURVEY: 20 };
const STATUS = { OPEN: 10, ARCHIVED: 20, FEATURED: 30 };

const STATUS_OPTIONS = [
  { text: "Нээлттэй", value: STATUS.OPEN },
  { text: "Архив", value: STATUS.ARCHIVED },
  { text: "Онцлох", value: STATUS.FEATURED },
];

const TYPE_OPTIONS = [
  { label: "Үнэлгээ", value: TYPE.SURVEY },
  { label: "Зөв хариулттай тест", value: TYPE.TEST },
];

const renderStatus = (status) => {
  switch (status) {
    case STATUS.OPEN:
      return (
        <div className="text-center border border-main p-1 px-3 rounded-full text-main bg-bg20 font-semibold text-sm shadow shadow-slate-200">
          Нээлттэй
        </div>
      );
    case STATUS.ARCHIVED:
      return (
        <div className="text-center border border-gray-600 p-1 px-3 rounded-full text-gray-600 bg-gray-100 font-semibold text-sm shadow shadow-slate-200">
          Архив
        </div>
      );
    case STATUS.FEATURED:
      return (
        <div className="text-center border border-yellow-500 p-1 px-3 rounded-full text-yellow-700 bg-yellow-200 font-semibold text-sm shadow shadow-slate-200">
          Онцлох
        </div>
      );
    default:
      return null;
  }
};

const shortName = (name) => {
  if (!name) return "-";
  const [first, ...rest] = name.trim().split(" ");
  return rest.length ? `${first}.${rest[0][0]}` : first;
};

export default function AssessmentsNew({
  initialAssessments,
  initialCategories,
  initialPagination,
}) {
  const router = useRouter();
  const [messageApi, ctx] = message.useMessage();

  const [assessments, setAssessments] = useState(initialAssessments || []);
  const [categories] = useState(initialCategories || []);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(initialPagination?.page || 1);
  const [pageSize, setPageSize] = useState(initialPagination?.limit || 10);
  const [total, setTotal] = useState(initialPagination?.total || 0);

  // Filters & sort
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [sort, setSort] = useState({ by: "updatedAt", dir: "DESC" });

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter/sort change
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, columnFilters, sort]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssessmentsNew({
        page,
        limit: pageSize,
        name: debouncedSearch || undefined,
        status: columnFilters.status?.[0] ?? undefined,
        type: columnFilters.type?.[0] ?? undefined,
        sortBy: sort.by,
        sortDir: sort.dir,
      });
      if (res.success !== false) {
        setAssessments(res.data || []);
        setTotal(res.pagination?.total || 0);
      } else {
        messageApi.error(res.message || "Алдаа гарлаа.");
      }
    } catch {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, columnFilters, sort]); // ✅ all deps explicit

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = useCallback(
    async (record, newStatus) => {
      if (newStatus === STATUS.FEATURED) {
        const count = assessments.filter(
          (a) => a.status === STATUS.FEATURED,
        ).length;
        if (count >= 3) {
          messageApi.warning("Аль хэдийн 3 тест онцолсон байна.");
          return;
        }
      }
      try {
        const res = await updateAssessmentById(record.id, {
          status: newStatus,
        });
        if (res.success) {
          messageApi.success("Төлөв өөрчлөгдлөө.");
          fetchData();
        } else messageApi.error(res.message || "Алдаа гарлаа.");
      } catch {
        messageApi.error("Алдаа гарлаа.");
      }
    },
    [assessments, fetchData],
  );

  // Delete
  const handleDelete = useCallback(async () => {
    try {
      const res = await deleteAssessmentById(deleteTarget.id);
      if (res.success) {
        messageApi.success("Тест устгагдлаа.");
        setDeleteTarget(null);
        fetchData();
      } else messageApi.error(res.message || "Алдаа гарлаа.");
    } catch {
      messageApi.error("Алдаа гарлаа.");
    }
  }, [deleteTarget, fetchData]);

  // Row menu
  const getMenu = useCallback(
    (record) => ({
      items: [
        {
          key: "status",
          label: (
            <span className="flex items-center gap-2">
              <CheckCircleBoldDuotone width={16} /> Төлөв өөрчлөх
            </span>
          ),
          expandIcon: <DropdownIcon width={13} rotate={-90} color="#94a3b8" />,
          children: STATUS_OPTIONS.filter((s) => s.value !== record.status).map(
            (s) => ({
              key: `s-${s.value}`,
              label: s.text,
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation();
                handleStatusChange(record, s.value);
              },
            }),
          ),
        },
        {
          key: "preview",
          label: (
            <span className="flex items-center gap-2">
              <EyeBoldDuotone width={16} /> Урьдчилж харах
            </span>
          ),
          onClick: ({ domEvent }) => {
            domEvent.stopPropagation();
            window.open(`/preview/${record.id}`, "_blank");
          },
        },
        {
          key: "copy",
          label: (
            <span className="flex items-center gap-2">
              <CopyBoldDuotone width={16} /> Хувилах
            </span>
          ),
          onClick: ({ domEvent }) => domEvent.stopPropagation(),
        },
        { type: "divider" },
        {
          key: "delete",
          danger: true,
          label: (
            <span className="flex items-center gap-2">
              <TrashBin2BoldDuotone width={16} /> Устгах
            </span>
          ),
          onClick: ({ domEvent }) => {
            domEvent.stopPropagation();
            setDeleteTarget(record);
          },
        },
      ],
    }),
    [handleStatusChange],
  );

  const columns = useMemo(
    () => [
      {
        title: "Төрөл",
        dataIndex: "type",
        key: "type",
        width: "60px",
        align: "center",
        filters: TYPE_OPTIONS.map((t) => ({ text: t.label, value: t.value })),
        filterMultiple: false,
        render: (type) => (
          <span className="text-main text-center justify-center flex">
            {type === TYPE.SURVEY ? (
              <ChartSquareLineDuotone width={18} />
            ) : (
              <ListCheckLineDuotone width={18} />
            )}
          </span>
        ),
      },
      {
        width: "300px",
        title: "Тестийн нэр",
        dataIndex: "name",
        key: "name",
        render: (text, record) => (
          <Link
            href={`/test/${record.id}`}
            className="text-main! font-bold hover:text-secondary! transition-colors hover:underline! underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            {text}
          </Link>
        ),
      },
      {
        title: "Ангилал",
        dataIndex: "category",
        key: "category",
        width: "100px",
        render: (cat) => <span>{cat || "-"}</span>,
      },
      {
        title: "Төлөв",
        dataIndex: "status",
        key: "status",
        width: "60px",
        align: "center",
        filters: STATUS_OPTIONS,
        filterMultiple: false,
        render: renderStatus,
      },
      {
        title: "Үүсгэсэн",
        dataIndex: "createdBy",
        key: "createdBy",
        width: "120px",
        render: (name) => shortName(name),
      },
      {
        title: "Үүсгэсэн огноо",
        dataIndex: "createdAt",
        key: "createdAt",
        width: "100px",
        render: (date) =>
          date ? new Date(date).toISOString().split("T")[0] : "-",
      },
      {
        title: "Шинэчилсэн огноо",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: "100px",
        sorter: true,
        render: (date) =>
          date ? new Date(date).toISOString().split("T")[0] : "-",
      },
      {
        title: "Үнэ",
        dataIndex: "price",
        key: "price",
        width: "90px",
        sorter: true,
        align: "right",
        render: (p) => (p ? `${Number(p).toLocaleString()}₮` : "-"),
      },
      {
        title: "Хэрэглэгч",
        dataIndex: "count",
        key: "count",
        width: "80px",
        sorter: true,
        align: "center",
        render: (c) => c ?? 0,
      },
      {
        title: "Дүүргэлт",
        dataIndex: "completeness",
        key: "completeness",
        width: "130px",
        sorter: true,
        render: (val) => (
          <Progress
            percent={val ?? 0}
            size="small"
            strokeColor={val === 100 ? "#22c55e" : "#f36421"}
          />
        ),
      },
      {
        title: "",
        key: "action",
        width: 50,
        align: "center",
        render: (_, record) => (
          <Dropdown
            menu={getMenu(record)}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              className="hover:opacity-100 hover:rounded-full!"
              icon={<MoreIcon width={16} height={16} />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ),
      },
    ],
    [getMenu],
  );

  return (
    <ConfigProvider locale={mnMN}>
      {ctx}

      {/* Toolbar */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <Input
          placeholder="Нэрээр хайх"
          prefix={
            <MagniferLineDuotone className="text-gray-400 mr-1" width={16} />
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-[220px]"
        />
        <Button
          className="the-btn"
          icon={<PlusIcon width={18} height={18} color="#f36421" />}
          onClick={() => setIsModalOpen(true)}
        >
          Тест үүсгэх
        </Button>
      </div>

      {/* Table */}
      <div className="px-5">
        <Table
          columns={columns}
          dataSource={assessments}
          rowKey="id"
          locale={customLocale}
          size="small"
          loading={{
            spinning: loading,
            indicator: (
              <Spin
                indicator={
                  <LoadingOutlined
                    style={{ color: "#f26522", fontSize: 22 }}
                    spin
                  />
                }
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            size: "small",
            showTotal: (t, [from, to]) => `${from}–${to} / Нийт ${t}`,
          }}
          onChange={(pag, tableFilters, sorter) => {
            setPage(pag.current);
            setPageSize(pag.pageSize);
            setColumnFilters({
              status: tableFilters.status?.length ? tableFilters.status : [],
              type: tableFilters.type?.length ? tableFilters.type : [],
            });
            if (sorter?.field && sorter?.order) {
              setSort({
                by: sorter.field,
                dir: sorter.order === "ascend" ? "ASC" : "DESC",
              });
            }
          }}
          onRow={(record) => ({
            className: "cursor-pointer",
            onClick: () => router.push(`/test/${record.id}`),
          })}
        />
      </div>

      {/* Keep original New Assessment modal as-is */}
      <NewAssessment
        assessmentCategories={categories}
        isModalOpen={isModalOpen}
        handleOk={async (formData) => {
          const res = await createAssessment({
            category: formData.assessmentCategory,
            name: formData.testName,
            description: "",
            usage: "",
            measure: "",
            questionCount: 0,
            price: 0,
            duration: 0,
            type: formData.type,
            answerCategories: (formData.categories || []).map((name) => ({
              name,
              description: "",
            })),
            status: STATUS.ARCHIVED,
          });
          if (res.success && res.data?.id) {
            messageApi.success("Тест амжилттай үүссэн.");
            setIsModalOpen(false);
            router.push(`/test/${res.data.id}`);
          } else {
            messageApi.error(res.message || "Тест үүсгэхэд алдаа гарлаа.");
          }
        }}
        handleCancel={() => setIsModalOpen(false)}
      />

      {/* Delete confirm */}
      <Modal
        title="Тест устгах"
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onOk={handleDelete}
        okText="Устгах"
        cancelText="Болих"
        okButtonProps={{ danger: true }}
      >
        <p>
          <b>{deleteTarget?.name}</b>-ийг устгах гэж байна. Энэ үйлдлийг сэргээх
          боломжгүй. Итгэлтэй байна уу?
        </p>
      </Modal>
    </ConfigProvider>
  );
}
