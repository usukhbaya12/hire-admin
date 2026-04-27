import React, { useState } from "react";
import { Modal, Spin, Button, message, Divider, Empty, Tag } from "antd";
import { CalculatorBoldDuotone, QrCodeBoldDuotone } from "solar-icons";
import { LoadingOutlined } from "@ant-design/icons";
import { deleteBarimtById } from "@/app/api/constant";
import InfoModal from "./Info";

const EBarimtModal = ({
  visible,
  onClose,
  loading2,
  data,
  assessment,
  barimtId,
}) => {
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleReturnClick = () => {
    setConfirmModal(true);
  };

  const handleConfirmReturn = async () => {
    setLoading(true);
    try {
      const res = await deleteBarimtById(barimtId);
      if (res && res.success) {
        messageApi.info("Баримт буцаагдсан.");
        setConfirmModal(false);
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        messageApi.error("Баримт буцаахад алдаа гарлаа.");
      }
    } catch (e) {
      messageApi.error("Сервертэй холбогдохад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        loading={loading2}
        title={
          <div className="flex items-center gap-2">
            <QrCodeBoldDuotone className="text-main -mt-0.5" width={20} />
            <span className="text-[15px]">Баримтын мэдээлэл</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={400}
        closeIcon={
          <div className="bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        }
      >
        {data ? (
          <>
            <Divider />
            <div className="flex items-center justify-between pt-1">
              <img
                src="/ebarimt.png"
                width={35}
                className="pt-1"
                alt="E-Barimt"
              ></img>
              <div className="text-center leading-5">
                <div className="font-bold text-[16px]">Баримт #{barimtId}</div>
                {data.date}
              </div>
              <img src="/image.png" width={35} alt="Hire-logo"></img>
            </div>
            <Divider dashed />
            <div className="flex items-center gap-4">
              Төлөв:
              <Tag
                color="blue"
                className="rounded-full! shadow shadow-slate-200 font-semibold px-3 py-0.5"
              >
                {data.lottery ? "Амжилттай хэвлэсэн" : "Буцаасан"}
              </Tag>
            </div>
            <Divider dashed />
            {data.lottery && (
              <>
                <div className="flex justify-between">
                  <div className="w-1/2 text-gray-500">{assessment}</div>
                  <div className="text-gray-500">1</div>
                  <div>{data?.totalAmount?.toLocaleString()}</div>
                </div>
                <Divider dashed />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between font-bold">
                    ДДТД <div className="text-main">{data.ddtd}</div>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    НӨАТ{" "}
                    <div className="text-main">
                      {data?.noat?.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    Нийт дүн{" "}
                    <div className="text-main">
                      {data?.totalAmount?.toLocaleString()}
                    </div>
                  </div>
                </div>
                <Divider dashed />
              </>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <Button
                className="back-btn"
                onClick={() => {
                  onClose();
                }}
              >
                Буцах
              </Button>
              {data.lottery && (
                <Button
                  onClick={handleReturnClick}
                  className="the-btn"
                  loading={loading}
                  htmlType="submit"
                  type="primary"
                >
                  Баримт буцаах
                </Button>
              )}
            </div>
            <InfoModal
              open={confirmModal}
              onOk={handleConfirmReturn}
              onCancel={() => setConfirmModal(false)}
              loading={loading}
              text="Та энэ баримтыг буцаахдаа итгэлтэй байна уу?"
              title="Баримт буцаах"
            />
          </>
        ) : (
          <>
            <Divider />
            <Empty description="Баримт олдсонгүй" />
            <Divider dashed />
            <div className="text-center pb-2">Холбоо барих</div>
            <div className="flex items-center justify-between font-bold">
              Утасны дугаар <div className="text-main">9909-9371</div>
            </div>
            <div className="flex items-center justify-between font-bold">
              И-мэйл хаяг <div className="text-main">info@hire.mn</div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default EBarimtModal;
