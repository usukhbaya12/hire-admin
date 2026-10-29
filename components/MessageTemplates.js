"use client";
import React, { useEffect, useState } from "react";
import { Modal, Tabs, Input, Button, Tag, Spin, message } from "antd";
import { getMessageTemplates, saveMessageTemplates } from "@/app/api/constant";

const FIELDS = [
  { key: "inviteEmail", label: "Урилга · И-мэйл" },
  { key: "inviteSms", label: "Урилга · SMS", sms: true },
  { key: "remindEmail", label: "Сануулга · И-мэйл" },
  { key: "remindSms", label: "Сануулга · SMS", sms: true },
];

const VARS = {
  lastname: "Овог",
  firstname: "Нэр",
  org: "Байгууллага",
  test: "Тестийн нэр",
  deadline: "Дуусах хугацаа",
  link: "Тестийн холбоос",
};

// Хэрэглэгч рүү явах урилга / сануулгын мэйл, SMS-ийн ерөнхий драфт (backend: userService/templates, admin).
const MessageTemplates = ({ open, onClose }) => {
  const [values, setValues] = useState({});
  const [defaults, setDefaults] = useState({});
  const [active, setActive] = useState(FIELDS[0].key);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMessageTemplates()
      .then((res) => {
        if (!res?.success) {
          messageApi.error(res?.message || "Драфт уншихад алдаа гарлаа.");
          return;
        }
        setDefaults(res.data?.defaults ?? {});
        setValues({ ...res.data?.defaults, ...res.data?.templates });
      })
      .finally(() => setLoading(false));
  }, [open]);

  const setField = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    // Анхны загвартай ижил бол хоосноор илгээнэ → сервер default-оо ашиглана.
    const payload = Object.fromEntries(
      FIELDS.map(({ key }) => [
        key,
        values[key] === defaults[key] ? "" : values[key] ?? "",
      ]),
    );
    const res = await saveMessageTemplates(payload);
    setSaving(false);
    if (res?.success) {
      messageApi.success("Драфт хадгалагдлаа.");
      onClose();
    } else {
      messageApi.error(res?.message || "Хадгалахад алдаа гарлаа.");
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Мессежийн драфт"
        open={open}
        onCancel={() => !saving && onClose()}
        footer={null}
        width={720}
      >
        <Spin spinning={loading}>
          <Tabs
            activeKey={active}
            onChange={setActive}
            items={FIELDS.map(({ key, label, sms }) => ({
              key,
              label,
              children: (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1 items-center text-sm text-gray-600">
                    Хувьсагч оруулах:
                    {Object.entries(VARS).map(([v, name]) => (
                      <Tag
                        key={v}
                        className="cursor-pointer"
                        onClick={() => setField(key, `${values[key] ?? ""}{${v}}`)}
                      >
                        {name} {`{${v}}`}
                      </Tag>
                    ))}
                  </div>
                  <Input.TextArea
                    value={values[key] ?? ""}
                    onChange={(e) => setField(key, e.target.value)}
                    rows={sms ? 3 : 9}
                    showCount={sms}
                  />
                  <div className="text-xs text-gray-500">
                    {sms
                      ? "Кирилл үсгийг латинаар хөрвүүлж илгээнэ. Хувьсагч орлуулсны дараа 160 тэмдэгтээс хэтэрч болохгүй — {link} заавал байх хэрэгтэй."
                      : "Мэйлд \"Тест өгөх\" товч болон тестийн тухай мэдээлэл автоматаар нэмэгдэнэ."}
                  </div>
                </div>
              ),
            }))}
          />
          <div className="flex justify-between pt-4">
            <Button
              onClick={() => setField(active, defaults[active] ?? "")}
              disabled={saving}
            >
              Анхны загвар руу буцаах
            </Button>
            <Button className="the-btn" loading={saving} onClick={handleSave}>
              Хадгалах
            </Button>
          </div>
        </Spin>
      </Modal>
    </>
  );
};

export default MessageTemplates;
