"use client";

import React, { useEffect, useState } from "react";
import {
  Input,
  Spin,
  Button,
  Table,
  Dropdown,
  message,
  Select,
  Tag,
  ConfigProvider,
} from "antd";
import mnMN from "antd/lib/locale/mn_MN";
import { PlusIcon, MoreIcon, DropdownIcon } from "./Icons";
import { useRouter } from "next/navigation";
import InfoModal from "./modals/Info";
import { customLocale } from "@/utils/values";
import Image from "next/image";
import { api } from "@/utils/routes";
import { getBlogs, deleteBlogById, updateBlogById } from "@/app/api/constant";
import {
  BookmarkBoldDuotone,
  MagniferLineDuotone,
  Star1BoldDuotone,
  TrashBin2BoldDuotone,
} from "solar-icons";
import { LoadingOutlined } from "@ant-design/icons";
import Link from "next/link";

const BLOG_CATEGORIES = [
  { label: "Бүгд", value: 0 },
  { label: "Блог", value: 1 },
  { label: "Зөвлөмжүүд", value: 2 },
];

const Blogs = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(0);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    record: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    count: 0,
  });
  const [messageApi, contextHolder] = message.useMessage();

  const handleTogglePin = async (recordToToggle) => {
    setLoading(true);
    messageApi.loading({
      content: "Статус шинэчилж байна...",
      key: "pinStatus",
      duration: 0,
    });

    const currentlyPinned = blogs.find(
      (blog) => blog.pinned && blog.id !== recordToToggle.id,
    );
    const isPinning = !recordToToggle.pinned;

    try {
      if (isPinning && currentlyPinned) {
        const unpinResponse = await updateBlogById(currentlyPinned.id, {
          pinned: false,
        });
        if (!unpinResponse.success) {
          throw new Error(unpinResponse.message || "Алдаа гарлаа.");
        }
      }

      const toggleResponse = await updateBlogById(recordToToggle.id, {
        pinned: isPinning,
      });
      if (!toggleResponse.success) {
        throw new Error(
          toggleResponse.message || "Блогийн статусыг шинэчлэхэд алдаа гарлаа.",
        );
      }

      messageApi.success({
        content: "Статус амжилттай шинэчлэгдлээ.",
        key: "pinStatus",
      });

      fetchBlogs(pagination.current, categoryFilter, pagination.pageSize);
    } catch (error) {
      messageApi.error({
        content: error.message || "Сервертэй холбогдоход алдаа гарлаа.",
        key: "pinStatus",
      });
      setLoading(false);
    }
  };

  const getActionMenu = (record) => {
    const isPinned = record.pinned;
    return {
      items: [
        {
          key: "pin",
          label: (
            <div className="flex items-center gap-2">
              <Star1BoldDuotone width={16} />{" "}
              {isPinned ? "Онцлохоо болих" : "Онцлох"}
            </div>
          ),
          onClick: (e) => {
            e.domEvent.stopPropagation();
            handleTogglePin(record);
          },
        },
        {
          key: "3",
          label: (
            <div className="flex items-center gap-2">
              <TrashBin2BoldDuotone width={18} /> Устгах
            </div>
          ),
          danger: true,
          onClick: (e) => {
            e.domEvent.stopPropagation();
            setDeleteModal({ open: true, record });
          },
        },
      ],
    };
  };

  const fetchBlogs = async (
    page = 1,
    type = categoryFilter,
    pageSize = pagination.pageSize,
  ) => {
    try {
      setLoading(true);
      const response = await getBlogs(pageSize, page, type);

      if (response.success) {
        setBlogs(response.data || []);
        setPagination({
          ...pagination,
          current: page,
          pageSize,
          total: response.total || 0,
          count: response.count,
        });
      } else {
        messageApi.error(response.message || "Алдаа гарлаа.");
      }
    } catch (error) {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [categoryFilter]);

  useEffect(() => {
    let filtered = blogs;

    if (searchText) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    setFilteredBlogs(filtered);
  }, [blogs, searchText]);

  const handleTableChange = (pagination) => {
    fetchBlogs(pagination.current);
  };

  const handleDelete = async (record) => {
    if (!record?.id) return;

    setLoading(true);
    await deleteBlogById(record.id)
      .then((d) => {
        if (d.success) {
          setDeleteModal({ open: false, record: null });
          messageApi.info("Блог устсан.", [3]);
          fetchBlogs(pagination.current);
        } else {
          messageApi.error(d.message || "Блог устгахад алдаа гарлаа.");
        }
      })
      .catch(() => {
        messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const columns = [
    {
      title: "Зураг",
      dataIndex: "image",
      render: (image) => (
        <div className="w-12 h-12 relative overflow-hidden rounded-lg">
          {image ? (
            <Image
              src={`${api}file/${image}`}
              alt="Blog thumbnail"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>
      ),
      width: "80px",
    },
    {
      title: "Гарчиг",
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <div className="text-main! font-bold hover:text-secondary! transition-colors hover:underline! underline-offset-2">
            {text}
          </div>
        </div>
      ),
      width: "30%",
    },
    {
      title: "Ангилал",
      dataIndex: "category",
      render: (category, record) => {
        const categoryObj = BLOG_CATEGORIES.find(
          (cat) => cat.value === category,
        );
        return (
          <div className="items-center">
            <Tag
              color="blue"
              className="rounded-full! font-semibold px-2.5! shadow"
            >
              {categoryObj ? categoryObj.label : "Unknown"}
            </Tag>
            {record.pinned && (
              <Tag
                color="red"
                className="rounded-full! font-semibold px-2.5! shadow"
              >
                Онцолсон
              </Tag>
            )}
          </div>
        );
      },
      align: "center",
      // remove filters and onFilter
    },
    {
      title: "Зохиогч",
      dataIndex: ["user", "firstname"],
      key: "user",
      // render: (category) => {
      //   const categoryObj = BLOG_CATEGORIES.find(
      //     (cat) => cat.value === category
      //   );
      //   return (
      //     <Tag
      //       color="blue"
      //       className="mt-2 rounded-full! font-semibold px-2.5! shadow"
      //     >
      //       {categoryObj ? categoryObj.label : "Unknown"}
      //     </Tag>
      //   );
      // },
      align: "center",
      // remove filters and onFilter
    },
    {
      title: "Унших хугацаа",
      dataIndex: "minutes",
      render: (minutes) => `${minutes} мин`,
      sorter: (a, b) => a.minutes - b.minutes,
    },
    {
      title: "Үүсгэсэн огноо",
      dataIndex: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => new Date(date).toISOString().split("T")[0],
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, record) => (
        <Dropdown
          menu={getActionMenu(record)}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            className="hover:opacity-100"
            icon={<MoreIcon width={16} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="p-6">
      <ConfigProvider locale={mnMN}>
        {contextHolder}
        <InfoModal
          open={deleteModal.open}
          onOk={() => {
            if (deleteModal.record) {
              handleDelete(deleteModal.record);
            }
          }}
          onCancel={() => setDeleteModal({ open: false, record: null })}
          text={`"${deleteModal.record?.title}" блогийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг дахин сэргээх боломжгүй.`}
          title="Блог устгах"
        />
        <div className="flex justify-between">
          <div className="flex gap-4">
            <div>
              <Input
                className="home"
                prefix={
                  <MagniferLineDuotone
                    className="text-gray-400 mr-2"
                    width={18}
                    height={18}
                  />
                }
                placeholder="Гарчгаар хайх"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </div>
            <div>
              <Select
                className="w-56"
                placeholder="Ангилалаар хайх"
                suffixIcon={<DropdownIcon width={15} height={15} />}
                defaultValue={0}
                options={BLOG_CATEGORIES}
                onChange={(value) => setCategoryFilter(value)}
                allowClear
                onClear={() => setCategoryFilter(0)}
              />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/blogs/new">
              <Button className="the-btn" asChild>
                <PlusIcon width={18} color={"#f36421"} />
                Блог нэмэх
              </Button>
            </Link>
          </div>
        </div>
        <div className="pt-4">
          <Table
            // bordered
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", pagination.count.toString()],
              size: "small",
              showTotal: (total, range) => {
                const start =
                  (pagination.current - 1) * pagination.pageSize + 1;
                let end = start + filteredBlogs.length - 1;
                if (pagination.count < end) end = pagination.count;

                return `${start}-ээс ${end} / Нийт ${pagination.count}`;
              },
            }}
            onChange={(newPagination, filters, sorter) => {
              setPagination((prev) => ({
                ...prev,
                current: newPagination.current,
                pageSize: newPagination.pageSize,
              }));

              if (sorter.order) {
                const sortedData = [...filteredBlogs].sort((a, b) => {
                  if (sorter.columnKey === "title") {
                    return sorter.order === "ascend"
                      ? a.title.localeCompare(b.title)
                      : b.title.localeCompare(a.title);
                  } else if (sorter.columnKey === "minutes") {
                    return sorter.order === "ascend"
                      ? a.minutes - b.minutes
                      : b.minutes - a.minutes;
                  } else if (sorter.columnKey === "createdAt") {
                    return sorter.order === "ascend"
                      ? new Date(a.createdAt) - new Date(b.createdAt)
                      : new Date(b.createdAt) - new Date(a.createdAt);
                  }
                  return 0;
                });
                setFilteredBlogs(sortedData);
              }
            }}
            columns={columns}
            dataSource={filteredBlogs}
            rowKey={(record) => record.id}
            locale={customLocale}
            onRow={(record) => ({
              onClick: () => router.push(`/blogs/edit/${record.id}`),
            })}
            className="cursor-pointer"
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
          />
        </div>
      </ConfigProvider>
    </div>
  );
};

export default Blogs;
