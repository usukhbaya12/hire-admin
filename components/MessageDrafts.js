"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Select,
  Switch,
  Tag,
  Popconfirm,
  Popover,
  Dropdown,
  Spin,
  Empty,
  Tooltip,
  message,
} from "antd";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import dayjs from "dayjs";
import { LetterOpenedBoldDuotone } from "solar-icons";
import {
  listDrafts,
  createDraft,
  updateDraft,
  deleteDraft,
  previewDraft,
} from "@/app/api/constant";

const TYPES = [
  { value: "inviteEmail", label: "Урилга · И-мэйл" },
  { value: "remindEmail", label: "Сануулга · И-мэйл" },
  { value: "inviteSms", label: "Урилга · SMS" },
  { value: "remindSms", label: "Сануулга · SMS" },
];
const typeLabel = (t) => TYPES.find((x) => x.value === t)?.label ?? t;
const isEmail = (t) => t?.endsWith("Email");

const VARS = {
  lastname: "Овог",
  firstname: "Нэр",
  org: "Байгууллага",
  test: "Тестийн нэр",
  deadline: "Дуусах хугацаа",
  link: "Тестийн холбоос",
};

// Хэрэглэгч рүү явах урилга / сануулгын мэйл, SMS драфт (backend: userService/templates).
const MessageDrafts = () => {
  const [drafts, setDrafts] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [defaultSubjects, setDefaultSubjects] = useState({});
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const smsRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Мессежийн текст..." }),
    ],
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[320px] p-4",
      },
    },
    onUpdate: ({ editor }) =>
      setForm((f) => (f ? { ...f, body: editor.getHTML() } : f)),
  });

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const select = (draft) => {
    setForm(draft);
    setShowSource(false);
    if (isEmail(draft.type)) editor?.commands.setContent(draft.body || "");
  };

  const newDraft = (type = "inviteEmail", d = defaults, s = defaultSubjects) =>
    select({
      // Шинэ загвар дээр төрөл солиход бичсэн нэр хадгалагдана.
      name: form && !form.id ? form.name : "",
      type,
      subject: isEmail(type)
        ? s[type === "remindEmail" ? "remind" : "invite"] ?? ""
        : "",
      body: d[type] ?? "",
      active: false,
    });

  const load = async (selectId) => {
    setLoading(true);
    const res = await listDrafts();
    setLoading(false);
    if (!res?.success) {
      messageApi.error(res?.message || "Загвар уншихад алдаа гарлаа.");
      return;
    }
    const list = res.data?.drafts ?? [];
    setDrafts(list);
    setDefaults(res.data?.defaults ?? {});
    setDefaultSubjects(res.data?.defaultSubjects ?? {});
    const pick = list.find((d) => d.id === selectId) ?? list[0];
    if (pick) select(pick);
    else newDraft("inviteEmail", res.data?.defaults, res.data?.defaultSubjects);
  };

  useEffect(() => {
    if (editor) load();
  }, [editor]);

  // Урьдчилан харах — бичиж байхад 400ms хүлээгээд серверээс бодит мэйлийн HTML авна.
  useEffect(() => {
    if (!form) return;
    const t = setTimeout(async () => {
      const res = await previewDraft({
        type: form.type,
        subject: form.subject,
        body: form.body,
      });
      if (res?.success) setPreview(res.data);
    }, 400);
    return () => clearTimeout(t);
  }, [form?.type, form?.subject, form?.body]);

  const insertVar = (v) => {
    const token = `{${v}}`;
    if (isEmail(form.type)) {
      editor?.chain().focus().insertContent(token).run();
      return;
    }
    const el = smsRef.current?.resizableTextArea?.textArea;
    const body = form.body ?? "";
    const pos = el?.selectionStart ?? body.length;
    setField("body", body.slice(0, pos) + token + body.slice(pos));
  };

  const toggleSource = () => {
    if (showSource) editor?.commands.setContent(form.body || "");
    setShowSource(!showSource);
  };

  const applyLink = () => {
    const chain = editor?.chain().focus().extendMarkRange("link");
    if (linkUrl.trim()) chain.setLink({ href: linkUrl.trim() }).run();
    else chain.unsetLink().run();
    setLinkUrl("");
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const payload = {
      name: form.name,
      type: form.type,
      subject: form.subject,
      body: form.body,
      active: form.active,
    };
    const res = form.id
      ? await updateDraft(form.id, payload)
      : await createDraft(payload);
    setSaving(false);
    if (!res?.success) {
      messageApi.error(res?.message || "Хадгалахад алдаа гарлаа.");
      return;
    }
    messageApi.success("Загвар хадгалагдлаа.");
    load(res.data?.id ?? form.id);
  };

  const handleDelete = async () => {
    const res = await deleteDraft(form.id);
    if (!res?.success) {
      messageApi.error(res?.message || "Устгахад алдаа гарлаа.");
      return;
    }
    messageApi.success("Загвар устгагдлаа.");
    load();
  };

  const tool = (label, title, onClick, active = false) => (
    <Tooltip title={title} key={title}>
      <Button
        size="small"
        type={active ? "primary" : "text"}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={showSource && title !== "HTML код"}
        className="min-w-[30px] font-semibold"
      >
        {label}
      </Button>
    </Tooltip>
  );

  const varMenu = {
    items: Object.entries(VARS).map(([v, name]) => ({
      key: v,
      label: `${name}  {${v}}`,
    })),
    onClick: ({ key }) => insertVar(key),
  };

  const email = isEmail(form?.type);

  return (
    <div className="px-5 py-6">
      {contextHolder}
      <div className="flex justify-between items-center mb-4">
        <div className="text-base font-bold flex items-center gap-2">
          <LetterOpenedBoldDuotone className="text-main" />
          Мэйлийн загвар
        </div>
        <Button className="the-btn" onClick={() => newDraft()}>
          + Шинэ загвар
        </Button>
      </div>

      <Spin spinning={loading}>
        <div className="flex gap-4 items-start">
          {/* Жагсаалт */}
          <div className="w-[260px] shrink-0 border border-neutral rounded-2xl overflow-hidden">
            {drafts.length === 0 && (
              <Empty className="py-8" description="Загвар алга" />
            )}
            {drafts.map((d) => (
              <div
                key={d.id}
                onClick={() => select(d)}
                className={`px-4 py-3 cursor-pointer border-b border-neutral last:border-b-0 hover:bg-gray-50 ${
                  form?.id === d.id ? "bg-main/10" : ""
                }`}
              >
                <div className="font-semibold truncate">{d.name}</div>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <Tag className="m-0">{typeLabel(d.type)}</Tag>
                  {d.active && (
                    <Tag color="green" className="m-0">
                      Идэвхтэй
                    </Tag>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {dayjs(d.updatedAt).format("YYYY-MM-DD HH:mm")}
                </div>
              </div>
            ))}
          </div>

          {form && (
            <div className="flex-1 min-w-0 grid xl:grid-cols-2 gap-4">
              {/* Засварлагч */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Загварын нэр"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                  <Select
                    value={form.type}
                    options={TYPES}
                    disabled={!!form.id}
                    onChange={(t) => newDraft(t)}
                    className="min-w-[170px]"
                  />
                </div>

                {email && (
                  <div>
                    <div className="text-gray-500 text-sm mb-1">Subject</div>
                    <Input
                      value={form.subject ?? ""}
                      onChange={(e) => setField("subject", e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <div className="text-gray-500 text-sm mb-1">Message</div>
                  <div className="border border-[#d9d9d9] rounded-xl overflow-hidden">
                    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-[#d9d9d9] bg-gray-50">
                      {email &&
                        editor && [
                          tool("↶", "Буцаах", () => editor.chain().focus().undo().run()),
                          tool("↷", "Дахих", () => editor.chain().focus().redo().run()),
                        ]}
                      <Dropdown menu={varMenu} trigger={["click"]}>
                        <Button size="small" type="text" className="font-semibold">
                          {"{a}"} Хувьсагч
                        </Button>
                      </Dropdown>
                      {email && editor && (
                        <>
                          {tool("H", "Гарчиг", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading"))}
                          {tool("B", "Тод", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
                          {tool(<i>I</i>, "Налуу", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
                          {tool(<u>U</u>, "Доогуур зураас", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}
                          {tool("•", "Жагсаалт", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
                          {tool("1.", "Дугаартай жагсаалт", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
                          <Popover
                            trigger="click"
                            content={
                              <div className="flex gap-2">
                                <Input
                                  size="small"
                                  placeholder="https://..."
                                  value={linkUrl}
                                  onChange={(e) => setLinkUrl(e.target.value)}
                                  onPressEnter={applyLink}
                                />
                                <Button size="small" onClick={applyLink}>
                                  OK
                                </Button>
                              </div>
                            }
                          >
                            {tool("🔗", "Холбоос", () => setLinkUrl(editor.getAttributes("link").href ?? ""), editor.isActive("link"))}
                          </Popover>
                          {tool("Tx", "Формат арилгах", () => editor.chain().focus().unsetAllMarks().clearNodes().run())}
                          {tool("</>", "HTML код", toggleSource, showSource)}
                        </>
                      )}
                    </div>
                    {email ? (
                      showSource ? (
                        <Input.TextArea
                          value={form.body}
                          onChange={(e) => setField("body", e.target.value)}
                          autoSize={{ minRows: 14 }}
                          className="font-mono text-xs !border-0 !rounded-none"
                        />
                      ) : (
                        <EditorContent editor={editor} />
                      )
                    ) : (
                      <Input.TextArea
                        ref={smsRef}
                        value={form.body}
                        onChange={(e) => setField("body", e.target.value)}
                        autoSize={{ minRows: 4 }}
                        className="!border-0 !rounded-none"
                      />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {email
                      ? "{link} нь дарагдах холбоос болно. Доор нь \"Тест өгөх\" товч болон тестийн тухай мэдээлэл автоматаар нэмэгдэнэ."
                      : "Кирилл үсгийг латинаар хөрвүүлж илгээнэ. 160 тэмдэгтээс хэтэрвэл тестийн нэрийг тайрна. {link} заавал байна."}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!form.active}
                      onChange={(v) => setField("active", v)}
                    />
                    <span className="text-gray-700">
                      Идэвхтэй — илгээхэд энэ загварыг ашиглана
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {form.id && (
                      <Popconfirm
                        title="Загварыг устгах уу?"
                        okText="Устгах"
                        cancelText="Болих"
                        onConfirm={handleDelete}
                      >
                        <Button danger>Устгах</Button>
                      </Popconfirm>
                    )}
                    <Button className="the-btn" loading={saving} onClick={handleSave}>
                      Хадгалах
                    </Button>
                  </div>
                </div>
              </div>

              {/* Урьдчилан харах */}
              <div className="border border-neutral rounded-2xl overflow-hidden bg-gray-50">
                <div className="px-4 py-2 border-b border-neutral text-sm text-gray-500">
                  Урьдчилан харах (жишээ утгаар)
                  {email && preview?.subject && (
                    <div className="text-gray-800 font-semibold mt-1">
                      {preview.subject}
                    </div>
                  )}
                </div>
                {email ? (
                  <iframe
                    title="preview"
                    srcDoc={preview?.html ?? ""}
                    sandbox=""
                    className="w-full h-[680px] bg-white"
                  />
                ) : (
                  <div className="p-6">
                    <div className="max-w-[300px] bg-white rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap break-words text-sm">
                      {preview?.text}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        preview?.length > preview?.max ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      {preview?.length ?? 0}/{preview?.max ?? 160} тэмдэгт
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Spin>
    </div>
  );
};

export default MessageDrafts;
