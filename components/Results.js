import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  message,
  Button,
  Spin,
  Progress,
  DatePicker,
  Tooltip,
  ConfigProvider,
  Select,
} from "antd";
import {
  ClipboardTextBoldDuotone,
  FolderFavouriteBookmarkBoldDuotone,
  DownloadBoldDuotone,
  CalendarBoldDuotone,
  MagniferLineDuotone,
  MagniferBoldDuotone,
} from "solar-icons";
import { getAssessmentExams } from "@/app/api/constant";
import { getAssessments } from "@/app/api/assessment";
import dayjs from "dayjs";
import mnMN from "antd/lib/locale/mn_MN";
import * as XLSX from "xlsx";
import { customLocale } from "@/utils/values";
import { getReport } from "@/app/api/assessment";
import { LoadingOutlined } from "@ant-design/icons";
import { DropdownIcon } from "./Icons";
import Link from "next/link";

const Results = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessmentOptions, setAssessmentOptions] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "month"));
  const [endDate, setEndDate] = useState(dayjs().add(1, "day"));

  const fetchAssessments = async () => {
    try {
      const response = await getAssessments({
        limit: 10,
        page: 1,
      });
      if (response.success) {
        const options = response.data.data.map((assessment) => ({
          label: assessment.data.name,
          value: assessment.data.id,
        }));
        setAssessmentOptions(options);
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
    }
  };

  const fetchResults = async (
    page = 1,
    size = pageSize,
    search = searchTerm,
  ) => {
    try {
      setLoading(true);

      const startDateStr = startDate ? startDate.format("YYYY-MM-DD") : null;
      const adjustedEndDate = endDate ? endDate.add(1, "day") : null;
      const endDateStr = adjustedEndDate
        ? adjustedEndDate.format("YYYY-MM-DD")
        : null;

      const response = await getAssessmentExams(
        selectedAssessment || 0,
        size,
        page,
        search,
        startDateStr,
        endDateStr,
      );

      if (response.success) {
        setExamData(response.data.data || []);
        setTotalCount(response.data.total || 0);
        setCurrentPage(page);
      } else {
        messageApi.error(
          response.message || "Сервертэй холбогдоход алдаа гарлаа.",
        );
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    fetchResults(1, pageSize);
  }, [selectedAssessment, startDate, endDate]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchResults(1, pageSize, value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleAssessmentChange = (value) => {
    setSelectedAssessment(value);
  };

  const applySearch = () => {
    setCurrentPage(1);
    fetchResults(1, pageSize);
  };

  const handleTableChange = (pagination, filters) => {
    setFilteredInfo(filters);

    const paginationChanged =
      pagination.current !== currentPage || pagination.pageSize !== pageSize;

    if (paginationChanged) {
      if (pagination.pageSize !== pageSize) {
        setPageSize(pagination.pageSize);
      }
      setCurrentPage(pagination.current);
      fetchResults(pagination.current, pagination.pageSize);
    }
  };

  const exportToExcel = () => {
    if (examData.length === 0) {
      messageApi.warning("Экспортлох өгөгдөл олдсонгүй");
      return;
    }

    try {
      const exportData = examData.map((record, index) => ({
        "№": index + 1,
        "Шалгуулагчийн нэр": `${record.firstname} ${record.lastname}`,
        "Тестийн нэр": record.assessment.name,
        "Тестийн төрөл": record.assessment?.type
          ? record.assessment.type === 10
            ? "Зөв хариулттай"
            : "Өөрийн үнэлгээ"
          : "-",
        "И-мейл хаяг": record.email ? record.email : "-",
        "Эхэлсэн огноо": new Date(record.userStartDate).toLocaleString(),
        "Дууссан огноо": record.userEndDate
          ? new Date(record.userEndDate).toLocaleString()
          : "-",
        Байгууллага: record.buyer?.organizationName || "-",
        Төлөв: record.userEndDate
          ? "Дууссан"
          : record.userStartDate && !record.userEndDate
            ? "Эхэлсэн"
            : "Өгөөгүй",

        "Үр дүн":
          record.assessment.type === 10 || record.assessment.type === 11
            ? `${((record.result?.point / record.result?.total) * 100).toFixed(
                1,
              )}%`
            : record.result?.result,

        Тайлбар: record.result?.value ? record.result.value : "",
        ...(record.assessment.type === 10 || record.assessment.type === 11
          ? {
              "Авах оноо": record.result?.total || "-",
            }
          : {}),
        ...(record.assessment.type === 10 || record.assessment.type === 11
          ? {
              "Авсан оноо": record.result?.point || "-",
            }
          : {}),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 5 }, // №
        { wch: 25 }, // Шалгуулагчийн нэр
        { wch: 25 }, // Тестийн нэр
        { wch: 25 }, // И-мейл хаяг
        { wch: 20 }, // Эхэлсэн огноо
        { wch: 20 }, // Дууссан огноо
        { wch: 25 }, // Байгууллага
        { wch: 12 }, // Төлөв
        { wch: 12 }, // Үр дүн
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Үр дүн");

      const date = new Date().toISOString().slice(0, 10);
      const fileName = `Тест_үр_дүн_${date}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      messageApi.success("Excel файл амжилттай татагдлаа.");
    } catch (error) {
      console.error("Excel export error:", error);
      messageApi.error("Excel файл үүсгэхэд алдаа гарлаа.");
    }
  };

  const organizationOptions = useMemo(() => {
    const uniqueOrgs = new Map();

    examData.forEach((exam) => {
      if (
        exam.buyer?.organizationName &&
        !uniqueOrgs.has(exam.buyer.organizationName)
      ) {
        uniqueOrgs.set(exam.buyer.organizationName, {
          text: exam.buyer.organizationName,
          value: exam.buyer.organizationName,
        });
      }
    });

    return Array.from(uniqueOrgs.values());
  }, [examData]);

  const columns = [
    {
      title: "№",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      width: 60,
    },
    {
      title: "Шалгуулагчийн нэр",
      key: "name",
      render: (_, record) => {
        const firstName = record.firstname || "";
        const lastName = record.lastname || "";
        const fullName = `${firstName} ${lastName}`;
        const firstChar = firstName ? firstName[0] : "";

        return (
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-main/50 to-secondary/50 rounded-full blur opacity-30 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative min-w-10 min-h-10 bg-gradient-to-br from-main/10 to-secondary/10 rounded-full flex items-center justify-center border border-main/10">
                <div className="text-base font-bold uppercase bg-gradient-to-br from-main to-secondary bg-clip-text text-transparent">
                  {firstChar}
                </div>
              </div>
            </div>
            <div className="leading-4">
              <div className="font-semibold">{fullName}</div>
              <div className="text-gray-700 text-sm">{record.email || "-"}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Тестийн нэр",
      dataIndex: ["assessment", "name"],
      key: "assessmentName",
      render: (_, record) => (
        <div className="font-bold text-main">{record.assessment.name}</div>
      ),
    },
    {
      title: "Эхэлсэн огноо",
      dataIndex: "userStartDate",
      key: "userStartDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-"),
      sorter: (a, b) => new Date(a.userStartDate) - new Date(b.userStartDate),
    },
    {
      title: "Дууссан огноо",
      dataIndex: "userEndDate",
      key: "userEndDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-"),
      sorter: (a, b) => {
        if (!a.userEndDate) return 1;
        if (!b.userEndDate) return -1;
        return new Date(a.userEndDate) - new Date(b.userEndDate);
      },
    },
    {
      title: "Байгууллага",
      dataIndex: ["buyer", "organizationName"],
      key: "organization",
      render: (text, record) => {
        if (!record.buyer?.organizationName) return "-";
        return (
          <div className="font-semibold">{record.buyer?.organizationName}</div>
        );
      },
      filters: organizationOptions,
      filteredValue: filteredInfo.organization || null,
      onFilter: (value, record) =>
        record.buyer && record.buyer.organizationName === value,
    },
    {
      title: "Төлөв",
      key: "status",
      filters: [
        { text: "Дууссан", value: "finished" },
        { text: "Эхэлсэн", value: "unfinished" },
        { text: "Өгөөгүй", value: "notstarted" },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => {
        if (value === "finished") {
          return !!record.userEndDate;
        }
        if (value === "unfinished") {
          return record.userStartDate && !record.userEndDate;
        }
        if (value === "notstarted") {
          return !record.userStartDate && !record.userEndDate;
        }
        return true;
      },
      render: (_, record) => {
        if (record.userEndDate) {
          return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-300 to-green-300 border border-green-500 shadow-sm">
              <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
              <span className="text-sm font-bold text-emerald-700">
                Дууссан
              </span>
            </div>
          );
        } else if (record.userStartDate && !record.userEndDate) {
          return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-200 to-blue-100 border border-blue-300 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-700">
                Эхэлсэн
              </span>
            </div>
          );
        } else {
          return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 shadow-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-amber-700">Өгөөгүй</span>
            </div>
          );
        }
      },
    },
    {
      title: "Үр дүн",
      dataIndex: "result",
      key: "result",
      render: (_, record) => {
        if (!record.userEndDate) return "-";

        if (!record.result) return "-";

        if (record.assessment.report === 10) {
          const score = record.result.point ? record.result.point : 0;
          const totalPoints = record.result.total || 1;
          const percent = ((score / totalPoints) * 100).toFixed(1);

          return (
            <div className="flex items-center gap-1">
              <Progress
                percent={percent}
                strokeColor={{
                  from: "#ED1C45",
                  to: "#F36421",
                }}
              />
              <span className="text-gray-600">
                ({score}/{totalPoints})
              </span>
            </div>
          );
        }

        if (record.assessment.report === 20) {
          if (record.result && typeof record.result === "object") {
            return (
              <div className="flex items-center">
                <div>{record.result.result || "-"}</div>
                <span className="px-1">/</span>
                <div>{record.result.value || "-"}</div>
              </div>
            );
          }

          if (typeof record.result === "string") {
            return <div className="text-main font-bold">{record.result}</div>;
          }

          return "-";
        }

        if (record.assessment.report === 40) {
          if (record.result && typeof record.result === "object") {
            return <div>{record.result.result || "-"}</div>;
          }
        } else {
          return (
            <div>
              {record.result &&
                (record.result.result ? `${record.result.result}` : "") +
                  (record.result.result && record.result.value ? " / " : "") +
                  (record.result.value ? `${record.result.value}` : "")}
            </div>
          );
        }

        return typeof record.result === "string" ? record.result : "-";
      },
      width: "180px",
    },
    {
      title: "Тайлан",
      key: "action",
      render: (_, record) =>
        record.userEndDate && (
          // record.result && (
          <Tooltip title="Тайлан татах">
            <Link
              href={`/api/report/${record.code}`}
              prefetch={false}
              target="_blank"
              passHref
            >
              <button className="cursor-pointer mx-auto text-main hover:text-secondary flex items-center gap-2 font-semibold">
                <ClipboardTextBoldDuotone width={18} />
                Татах
              </button>
            </Link>
          </Tooltip>
        ),
      align: "center",
    },
  ];

  const generatePDF = async (code) => {
    try {
      setLoading(true);
      const res = await getReport(code);

      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `report_${code}.pdf`);
        document.body.appendChild(link);
        link.click();

        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        messageApi.error("Тайлан татахад алдаа гарлаа.");
      }
    } catch (error) {
      console.error("GET / Aлдаа гарлаа.", error);
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider locale={mnMN}>
      <div className="px-5 py-6">
        {contextHolder}
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold flex items-center gap-2">
            <FolderFavouriteBookmarkBoldDuotone className="text-main" />
            Үр дүн
          </div>
          <div className="flex gap-2 items-center">
            <DatePicker
              onChange={handleStartDateChange}
              placeholder="Эхлэх огноо"
              style={{ width: 150 }}
              value={startDate}
            />
            <DatePicker
              onChange={handleEndDateChange}
              placeholder="Дуусах огноо"
              style={{ width: 150 }}
              value={endDate}
              disabledDate={(current) =>
                startDate && current && current < startDate
              }
            />
            <Select
              showSearch
              suffixIcon={
                <DropdownIcon width={15} height={15} color={"#f36421"} />
              }
              placeholder="Тест сонгох"
              style={{ width: 200 }}
              allowClear
              value={selectedAssessment}
              onChange={handleAssessmentChange}
              options={assessmentOptions}
              optionFilterProp="label" // will search inside label field of options
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <Input
              placeholder="И-мэйл хаяг"
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => {
                setSearchTerm("");
                setCurrentPage(1);
                fetchResults(1, pageSize, "");
              }}
              value={searchTerm}
              style={{ width: 200 }}
              onPressEnter={applySearch}
            />
            <Button onClick={applySearch} className="the-btn">
              <MagniferBoldDuotone width={16} />
              Хайх
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-end">
          <Button className="the-btn" onClick={exportToExcel}>
            <DownloadBoldDuotone width={16} />
            Excel татах
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={examData}
          locale={customLocale}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", totalCount],
            onShowSizeChange: (current, size) => {
              setPageSize(size);
              fetchResults(current, size);
            },
            size: "small",
            showTotal: (total, range) =>
              `${range[0]}-ээс ${range[1]} / Нийт ${total}`,
          }}
          loading={{
            spinning: loading,
            indicator: (
              <Spin
                size="default"
                indicator={
                  <LoadingOutlined
                    style={{ color: "#f26522", fontSize: 24 }}
                    spin
                  />
                }
              />
            ),
          }}
          rowKey="id"
          onChange={handleTableChange}
        />
      </div>
    </ConfigProvider>
  );
};

export default Results;
