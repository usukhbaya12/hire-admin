"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Spin,
  ConfigProvider,
  DatePicker,
  Button,
  Input,
  message,
  Tag,
} from "antd";
import mnMN from "antd/lib/locale/mn_MN";
import { LoadingOutlined } from "@ant-design/icons";
import { LetterBoldDuotone, MagniferBoldDuotone } from "solar-icons";
import dayjs from "dayjs";
import { getEmails, sendEmail } from "@/app/api/constant";
import { customLocale } from "@/utils/values";

const typeMap = {
  10: "Ибаримт",
  20: "Баталгаажуулах",
  30: "Нууц үг мартсан",
  40: "Тестийн урилга",
  50: "Тайлан",
};

const statusMap = {
  10: "Амжилттай",
  20: "Хүлээгдэж буй",
  30: "Амжилтгүй",
};

// Status color mapping
const statusColors = {
  10: "green",
  20: "orange",
  30: "red",
};

const Email = () => {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "month"));
  const [endDate, setEndDate] = useState(dayjs().add(1, "day"));
  const [emailInput, setEmailInput] = useState("");
  const [userFilter, setUserFilter] = useState(null);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
  const [resendLoading, setResendLoading] = useState({});

  const debounceTimeout = React.useRef(null);

  const debouncedSetUserFilter = useCallback((value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setUserFilter(value || null);
      setCurrentPage(1);
    }, 500);
  }, []);

  const fetchEmails = async (
    page = currentPage,
    limit = pageSize,
    filters = filteredInfo
  ) => {
    setLoading(true);
    try {
      const typeFilter =
        filters.type && filters.type.length > 0 ? filters.type[0] : null;
      const statusFilter =
        filters.status && filters.status.length > 0 ? filters.status[0] : null;

      const res = await getEmails({
        page,
        limit,
        email: userFilter,
        type: typeFilter,
        status: statusFilter,
        startDate: startDate ? dayjs(startDate).format("YYYY-MM-DD") : null,
        endDate: endDate ? dayjs(endDate).format("YYYY-MM-DD") : null,
      });

      if (res.success) {
        setEmails(res.data.data || []);
        setTotalCount(res.data.count || 0);
        setCurrentPage(page);
      } else {
        messageApi.error(res.message || "Алдаа гарлаа");
      }
    } catch (error) {
      console.error(error);
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails(1, pageSize, filteredInfo);
  }, [startDate, endDate, userFilter]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handleEmailInputChange = (e) => {
    const value = e.target.value;
    setEmailInput(value);
    debouncedSetUserFilter(value);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchEmails(pagination.current, pagination.pageSize, filters);
  };

  const handleManualSearch = () => {
    fetchEmails(1, pageSize, filteredInfo);
  };

  const typeFilters = useMemo(
    () =>
      Object.entries(typeMap).map(([key, label]) => ({
        text: label,
        value: key,
      })),
    []
  );

  const statusFilters = useMemo(
    () =>
      Object.entries(statusMap).map(([key, label]) => ({
        text: label,
        value: key,
      })),
    []
  );

  const columns = [
    {
      title: "№",
      key: "index",
      width: 60,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Илгээсэн огноо",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Гарчиг",
      dataIndex: "type",
      key: "type",
      // width: 200,
      render: (_, record) => {
        const typeLabel = typeMap[record.type] || record.type;
        return (
          <>
            <div className="font-bold text-gray-800 max-w-xs truncate">
              {record.subject}
            </div>
          </>
        );
      },
      filters: typeFilters,
      filteredValue: filteredInfo.type || null,
      // align: "center",
    },
    {
      title: "И-мэйл хаяг",
      dataIndex: "toEmail",
      key: "toEmail",
      render: (email) => (
        <span className="text-blue-600 font-bold">{email}</span>
      ),
    },
    {
      title: "Тестийн нэр",
      dataIndex: "assessmentName",
      key: "assessmentName",
      render: (assessmentName) => (
        <span className="text-blue-600 font-bold">{assessmentName}</span>
      ),
    },

    {
      title: "Төлөв",
      dataIndex: "status",
      key: "status",
      width: 200,
      render: (_, record) => {
        const statusLabel = statusMap[record.status] || record.status;
        const color = statusColors[record.status] || "default";
        return (
          <Tag
            color={color}
            className="rounded-full! font-semibold px-2.5! shadow"
          >
            {statusLabel}
          </Tag>
        );
      },
      filters: statusFilters,
      filteredValue: filteredInfo.status || null,
      align: "center",
    },
    {
      title: "Үйлдэл",
      dataIndex: "action",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Button
          className="the-btn !px-3 !py-1"
          loading={resendLoading[record.id] || false}
          onClick={async () => {
            setResendLoading((prev) => ({ ...prev, [record.id]: true }));
            try {
              const res = await sendEmail(record.type, record.id);
              if (res.success) {
                messageApi.success(res.message || "Амжилттай илгээсэн.");
                // Refetch table data to reflect updated status
                fetchEmails(currentPage, pageSize, filteredInfo);
              } else {
                messageApi.error(res.message || "Алдаа гарлаа.");
              }
            } catch (error) {
              console.error(error);
              messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
            } finally {
              setResendLoading((prev) => ({ ...prev, [record.id]: false }));
            }
          }}
        >
          Дахин илгээх
        </Button>
      ),
    },
  ];

  return (
    <ConfigProvider locale={mnMN}>
      {contextHolder}
      <div className="px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold flex items-center gap-2">
            <LetterBoldDuotone className="text-main" />
            И-мэйл лог бүртгэл
          </div>
          <div className="flex gap-2 items-center">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              format="YYYY-MM-DD"
              placeholder="Эхлэх огноо"
              className="min-w-[140px]"
            />
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              format="YYYY-MM-DD"
              placeholder="Дуусах огноо"
              className="min-w-[140px]"
              disabledDate={(current) =>
                startDate && current && current < startDate
              }
            />
            <Input
              placeholder="И-мэйл хаяг"
              allowClear
              value={emailInput}
              onChange={handleEmailInputChange}
              className="min-w-[200px]"
            />
            <Button className="the-btn" onClick={handleManualSearch}>
              <MagniferBoldDuotone width={16} />
              Хайх
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={emails}
          rowKey="id"
          loading={{
            spinning: loading,
            indicator: (
              <Spin
                size="large"
                indicator={
                  <LoadingOutlined
                    style={{ color: "#f26522", fontSize: 32 }}
                    spin
                  />
                }
              />
            ),
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", totalCount],
            size: "small",
            showTotal: (total, range) =>
              `${range[0]}-ээс ${range[1]} / Нийт ${total}`,
          }}
          onChange={handleTableChange}
          locale={customLocale}
          scroll={{ x: 1000 }}
          className="ant-table-striped"
          rowClassName={(record, index) =>
            index % 2 === 0 ? "table-row-light" : "table-row-dark"
          }
        />
      </div>
    </ConfigProvider>
  );
};

export default Email;
