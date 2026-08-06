"use client";

import React, { useState, useEffect } from "react";
import { Table, Spin, message, Empty, ConfigProvider, Modal, Tag } from "antd";
import { getErrorLogs } from "@/app/api/constant";
import mnMN from "antd/lib/locale/mn_MN";
import { customLocale } from "@/utils/values";
import { LoadingOutlined } from "@ant-design/icons";
import { ClipboardTextBoldDuotone } from "solar-icons";

const statusColor = (status) => {
  if (!status) return "default";
  if (status >= 500) return "red";
  if (status >= 400) return "orange";
  return "green";
};

const ErrorLogs = () => {
  const [loading, setLoading] = useState(true);
  const [errorData, setErrorData] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Stack trace modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  const fetchErrorData = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const response = await getErrorLogs(page, size);
      if (response.success) {
        const data = response.data.data || [];
        setErrorData(data);
        setTotalCount(response.data.count || 0);
        setCurrentPage(page);
      } else {
        messageApi.error(response.message || "Алдаа гарлаа.");
      }
    } catch (error) {
      console.error("Error fetching error logs:", error);
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (pagination) => {
    const newPage = pagination.current;
    const newPageSize = pagination.pageSize;

    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }

    fetchErrorData(newPage, newPageSize);
  };

  const columns = [
    {
      title: "№",
      key: "no",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      align: "center",
      width: 60,
    },
    {
      title: "Огноо",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (date) => {
        if (!date) return "-";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      },
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 90,
      align: "center",
      render: (status) => <Tag color={statusColor(status)}>{status ?? "-"}</Tag>,
      filters: [
        { text: "5xx", value: "5" },
        { text: "4xx", value: "4" },
      ],
      onFilter: (value, record) =>
        String(record.status || "").startsWith(value),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 90,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url) => (
        <span className="break-all text-xs">{url || "-"}</span>
      ),
    },
    {
      title: "Мессеж",
      dataIndex: "message",
      key: "message",
      render: (text, record) => (
        <div
          className="max-w-xs truncate text-blue-600 cursor-pointer hover:underline"
          onClick={() => {
            setSelectedError(record);
            setIsModalVisible(true);
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "IP",
      dataIndex: "ip",
      key: "ip",
      width: 120,
    },
  ];

  if (loading && errorData.length === 0) {
    return (
      <ConfigProvider locale={mnMN}>
        <div className="flex justify-center items-center h-64">
          <Spin
            size="large"
            indicator={
              <LoadingOutlined
                style={{ color: "#f26522", fontSize: 32 }}
                spin
              />
            }
          />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={mnMN}>
      {contextHolder}
      <div className="px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold flex items-center gap-2">
            <ClipboardTextBoldDuotone className="text-main" />
            Алдааны лог
          </div>
        </div>

        {errorData.length === 0 ? (
          <Empty
            description="Алдаа бүртгэгдээгүй байна"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-12"
          />
        ) : (
          <>
            <Table
              dataSource={errorData}
              columns={columns}
              rowKey="id"
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
              locale={customLocale}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                size: "small",
                pageSizeOptions: ["10", "20", "50", totalCount],
                showTotal: (total, range) =>
                  `${range[0]}-ээс ${range[1]} / Нийт ${total}`,
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                  fetchErrorData(current, size);
                },
              }}
              onChange={handleTableChange}
            />

            {/* Modal for stack trace */}
            <Modal
              open={isModalVisible}
              onCancel={() => setIsModalVisible(false)}
              onOk={() => setIsModalVisible(false)}
              title={selectedError?.name || "Алдааны дэлгэрэнгүй"}
              footer={null}
              width={720}
            >
              <p className="mb-2 font-semibold">{selectedError?.message}</p>
              <p className="mb-2 text-xs text-gray-500">
                {selectedError?.method} {selectedError?.url}
              </p>
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-lg max-h-96 overflow-auto">
                {selectedError?.stack || "Stack trace алга"}
              </pre>
            </Modal>
          </>
        )}
      </div>
    </ConfigProvider>
  );
};

export default ErrorLogs;
