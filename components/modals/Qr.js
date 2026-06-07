import React, { useEffect, useState } from "react";
import { Modal, Spin, Button, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { CopyBoldDuotone, DownloadBoldDuotone } from "solar-icons";
import { getExamQr } from "@/app/api/assessment";

// Тухайн тестийн (code) QR-ийг харуулах modal. Байгууллага QR-ийг хэвлэж/илгээж,
// хэрэглэгч уншаад и-мэйлгүйгээр тест өгнө.
const QrModal = ({ visible, onClose, code }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState(null);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!visible || !code) return;
    let active = true;
    (async () => {
      setLoading(true);
      setQr(null);
      try {
        const res = await getExamQr(code);
        if (active && res?.success && res.data) {
          setQr(res.data.qr);
          setUrl(res.data.url);
        } else if (active) {
          messageApi.error(res?.message || "QR авахад алдаа гарлаа.");
        }
      } catch (e) {
        if (active) messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [visible, code]);

  const handleDownload = () => {
    if (!qr) return;
    const link = document.createElement("a");
    link.href = qr;
    link.setAttribute("download", `qr-${code}.png`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      messageApi.success("Холбоос хуулагдлаа.");
    } catch {
      messageApi.error("Холбоос хуулахад алдаа гарлаа.");
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      title="Тестийн QR код"
    >
      {contextHolder}
      <div className="flex flex-col items-center gap-4 py-4">
        {loading ? (
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
        ) : qr ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="QR"
              width={260}
              height={260}
              className="rounded-lg border border-gray-200"
            />
            {url && (
              <div className="text-xs text-gray-500 break-all text-center px-4">
                {url}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                icon={<DownloadBoldDuotone width={16} />}
                onClick={handleDownload}
                className="the-btn"
              >
                Татах
              </Button>
              <Button icon={<CopyBoldDuotone width={16} />} onClick={handleCopy}>
                Холбоос хуулах
              </Button>
            </div>
          </>
        ) : (
          <div className="text-gray-500">QR олдсонгүй.</div>
        )}
      </div>
    </Modal>
  );
};

export default QrModal;
