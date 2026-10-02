"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  Button,
  Spin,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Upload,
  Divider,
} from "antd";
import {
  LoadingOutlined,
  PlusOutlined,
  VideoCameraOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { QuoteIcon, DropdownIcon } from "@/components/Icons";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Focus from "@tiptap/extension-focus";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Node } from "@tiptap/core";

import {
  getBlogById,
  createBlog,
  updateBlogById,
  imageUploader,
} from "@/app/api/constant";

import { api } from "@/utils/routes";
import {
  CloseCircleBoldDuotone,
  CodeCircleBoldDuotone,
  GalleryCircleBoldDuotone,
  LinkCircleBoldDuotone,
  List1Bold,
  SettingsBoldDuotone,
  TextBoldCircleBoldDuotone,
  TextItalicCircleBoldDuotone,
  TextUnderlineCircleBoldDuotone,
  UndoLeftRoundBold,
  UndoRightRoundBold,
  VideocameraBoldDuotone,
  VideoLibraryBoldDuotone,
} from "solar-icons";
import { TestName } from "./test-ui/TestName";
import LoadingSpinner from "./Loading";

const BLOG_CATEGORIES = [
  { label: "Блог", value: 1 },
  { label: "Зөвлөмжүүд", value: 2 },
];

const VideoNode = Node.create({
  name: "videoNode",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      "data-file-name": { default: "video" },
    };
  },

  parseHTML() {
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", { ...HTMLAttributes, controls: true }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoComponent);
  },
});

const VideoComponent = (props) => {
  const { deleteNode, node } = props;
  const fileName = node.attrs["data-file-name"];

  return (
    <NodeViewWrapper className="react-component-with-content">
      <div
        className="content"
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#f0f0f0",
          padding: "8px 12px",
          borderRadius: "99px",
          border: "1px solid #ddd",
          margin: "10px 0",
        }}
      >
        <VideocameraBoldDuotone
          style={{ marginRight: "10px", fontSize: "20px" }}
        />
        <span style={{ flexGrow: 1, fontFamily: "monospace" }}>{fileName}</span>
        <Button className="the-btn !px-2.5" danger onClick={deleteNode}>
          <CloseOutlined size={1} />
        </Button>
      </div>
    </NodeViewWrapper>
  );
};

const IconBold = () => <TextBoldCircleBoldDuotone />;
const IconItalic = () => <TextItalicCircleBoldDuotone />;
const IconUnderline = () => <TextUnderlineCircleBoldDuotone />;
const IconH1 = () => <strong>H1</strong>;
const IconH2 = () => <strong>H2</strong>;
const IconH3 = () => <strong>H3</strong>;
const IconBulletList = () => (
  <div className="flex gap-1 items-center">
    • <List1Bold width={20} />
  </div>
);
const IconOrderedList = () => (
  <div className="flex gap-1 items-center text-xs">
    1. <List1Bold width={20} />
  </div>
);
const IconBlockquote = () => <QuoteIcon />;
const IconCodeBlock = () => <CodeCircleBoldDuotone />;
const IconLink = () => <LinkCircleBoldDuotone />;
const IconUnlink = () => (
  <div className="flex gap-1 items-center text-xs font-semibold">
    <CloseCircleBoldDuotone width={20} color="red" /> Линк устгах
  </div>
);
const IconImage = () => <GalleryCircleBoldDuotone width={20} />;
const IconVideo = () => <VideoLibraryBoldDuotone width={20} />;
const IconHorizontalRule = () => (
  <span className="text-xs font-semibold">Зай авах</span>
);
const IconUndo = () => <UndoLeftRoundBold width={20} />;
const IconRedo = () => <UndoRightRoundBold width={20} />;

const useUploader = (messageApi) => {
  const upload = async (file, type = "image") => {
    const isVideo = type === "video";
    const videoSizeLimit = 5 * 1024 * 1024; // 5MB
    const imageSizeLimit = 1024 * 1024; // 1MB

    if (isVideo && file.size > videoSizeLimit) {
      messageApi.error("5MB-с ихгүй хэмжээтэй бичлэг оруулна уу.");
      return null;
    }

    if (!isVideo && file.size > imageSizeLimit) {
      messageApi.error("1MB-с ихгүй хэмжээтэй зураг оруулна уу.");
      return null;
    }

    messageApi.loading({
      content: "Зураг/бичлэг оруулж байна...",
      key: "editor-upload",
      duration: 0,
    });

    try {
      const formData = new FormData();
      formData.append("files", file);
      const uploadResult = await imageUploader(formData);

      if (
        uploadResult &&
        Array.isArray(uploadResult) &&
        uploadResult.length > 0
      ) {
        const fileId = uploadResult[0];
        messageApi.success({
          content: "Амжилттай.",
          key: "editor-upload",
        });
        return {
          id: fileId,
          url: `${api}file/${fileId}`,
          name: file.name,
        };
      } else {
        throw new Error("Upload failed to return a valid ID.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      messageApi.error({
        content: `Файл оруулахад алдаа гарлаа. ${error.message}`,
        key: "editor-upload",
      });
      return null;
    }
  };
  return { upload };
};
const MenuBar = ({ editor, onUpload }) => {
  if (!editor) return null;

  const handleFileUpload = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file, type);
      }
    };
    input.click();
  };

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Холбох URL оруулах", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-b border-neutral bg-gray-50 mt-2 px-5">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${
          editor.isActive("bold") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${
          editor.isActive("italic") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded ${
          editor.isActive("underline") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconUnderline />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-0.5 px-1.5 rounded-full ${
          editor.isActive("heading", { level: 1 })
            ? "bg-main/80 text-white"
            : "hover:bg-gray-200"
        }`}
      >
        <IconH1 />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-0.5 px-1 rounded-full ${
          editor.isActive("heading", { level: 2 })
            ? "bg-main/80 text-white"
            : "hover:bg-gray-200"
        }`}
      >
        <IconH2 />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-0.5 px-1 rounded-full ${
          editor.isActive("heading", { level: 3 })
            ? "bg-main/80 text-white"
            : "hover:bg-gray-200"
        }`}
      >
        <IconH3 />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-0.5 px-1.5 rounded-full ${
          editor.isActive("bulletList")
            ? "bg-main/80 text-white"
            : "hover:bg-gray-200"
        }`}
      >
        <IconBulletList />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-0.5 px-1.5 rounded-full ${
          editor.isActive("orderedList")
            ? "bg-main/80 text-white"
            : "hover:bg-gray-200"
        }`}
      >
        <IconOrderedList />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1 rounded ${
          editor.isActive("blockquote") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconBlockquote />
      </button>
      <button
        onClick={setLink}
        className={`p-1 rounded ${
          editor.isActive("link") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconLink />
      </button>
      <button
        onClick={() => handleFileUpload("image")}
        className="p-1 rounded hover:text-main"
      >
        <IconImage />
      </button>
      <button
        onClick={() => handleFileUpload("video")}
        className="p-1 rounded hover:text-main"
      >
        <IconVideo />
      </button>
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-0.5 px-1.5 rounded-full hover:bg-gray-200"
      >
        <IconHorizontalRule />
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-0.5 px-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
      >
        <IconUndo />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-0.5 px-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
      >
        <IconRedo />
      </button>
    </div>
  );
};

const EditorBubbleMenu = ({ editor }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .run();
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, zIndex: 30 }}
      shouldShow={({ state }) => !state.selection.empty}
      className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border text-gray-400"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${
          editor.isActive("bold") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${
          editor.isActive("italic") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded ${
          editor.isActive("underline") ? "text-main" : "hover:text-gray-600"
        }`}
      >
        <IconUnderline />
      </button>
      <div className="w-px h-4 bg-gray-500 mx-1"></div>
      {editor.isActive("link") ? (
        <>
          <button
            onClick={setLink}
            className="p-1 rounded hover:text-gray-700 text-xs font-semibold"
          >
            Линк засах
          </button>
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1 rounded hover:text-gray-700"
          >
            <IconUnlink />
          </button>
        </>
      ) : (
        <button onClick={setLink} className="p-1 rounded hover:text-gray-600">
          <IconLink />
        </button>
      )}
    </BubbleMenu>
  );
};

const BlogEditor = () => {
  const router = useRouter();
  const params = useParams();
  const isEditMode = !!params?.id;

  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState({
    title: "",
    content: "",
    image: null,
    minutes: 2,
    category: 1,
    pinned: false,
  });
  const [fileList, setFileList] = useState([]);
  const [activeKey, setActiveKey] = useState("1");
  const [messageApi, contextHolder] = message.useMessage();
  const { upload } = useUploader(messageApi);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
          class: "text-blue-600 hover:text-blue-800 underline cursor-pointer",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full h-auto my-1 rounded-lg border block",
        },
      }),
      Placeholder.configure({ placeholder: "Нийтлэл бичих..." }),
      Focus.configure({ className: "has-focus" }),
      HorizontalRule.configure({
        HTMLAttributes: { class: "my-6 border-gray-300" },
      }),
      VideoNode,
    ],
    content: blog.content,
    onUpdate: ({ editor }) => {
      setBlog((prev) => ({ ...prev, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none p-4 editor-styling",
      },
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchBlog = async (id) => {
        setLoading(true);
        try {
          const response = await getBlogById(id);
          if (response.success && response.data) {
            const { image, ...blogData } = response.data;
            setBlog(blogData);
            if (editor) editor.commands.setContent(blogData.content);
            if (image) {
              const imageUrl = `${api}file/${image}`;
              setFileList([
                { uid: "-1", name: "cover.jpg", status: "done", url: imageUrl },
              ]);
              setBlog((prev) => ({ ...prev, image }));
            }
          } else {
            messageApi.error(response.message || "Блог олдсонгүй.");
            router.push("/");
          }
        } catch (error) {
          console.error("Fetch blog error:", error);
          messageApi.error("Блог дуудахад алдаа гарлаа. " + error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchBlog(params.id);
    }
  }, [isEditMode, params?.id, editor, messageApi, router]);

  const handleEditorUpload = async (file, type) => {
    const result = await upload(file, type);
    if (result && editor) {
      if (type === "image") {
        editor
          .chain()
          .focus()
          .setImage({ src: result.url, alt: result.name })
          .run();
      } else if (type === "video") {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "videoNode",
            attrs: { src: result.url, "data-file-name": result.name },
          })
          .run();
      }
    }
  };

  const handleFeaturedImageUpload = async ({ file, onSuccess, onError }) => {
    const result = await upload(file, "image");
    if (result) {
      setBlog((prev) => ({ ...prev, image: result.id }));
      setFileList([
        { uid: file.uid, name: file.name, status: "done", url: result.url },
      ]);
      onSuccess(result, file);
    } else {
      setFileList([]);
      onError(new Error("Upload failed"));
    }
  };

  const handleRemoveFeaturedImage = () => {
    setFileList([]);
    setBlog((prev) => ({ ...prev, image: null }));
  };

  const handleSave = async () => {
    if (!blog.title.trim()) {
      messageApi.error("Гарчиг оруулна уу.");
      setActiveKey("2");
      return;
    }
    if (!editor?.getText().trim()) {
      messageApi.error("Агуулга оруулна уу.");
      setActiveKey("1");
      return;
    }
    if (fileList.length === 0) {
      messageApi.error("Нүүр зураг оруулна уу.");
      setActiveKey("2");
      return;
    }

    messageApi.loading({
      content: "Хадгалж байна...",
      key: "save",
      duration: 0,
    });
    try {
      const response = isEditMode
        ? await updateBlogById(params.id, blog)
        : await createBlog(blog);

      if (response.success) {
        messageApi.success({
          content: `Амжилттай ${isEditMode ? "шинэчлэгдлээ." : "нийтлэгдлээ."}`,
          key: "save",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Save blog error:", error);
      messageApi.error({ content: `Алдаа. ${error.message}`, key: "save" });
    }
  };

  const handleInputChange = (key, value) => {
    setBlog((prev) => ({ ...prev, [key]: value }));
  };

  if (loading && isEditMode) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col">
      {contextHolder}
      <div className="fixed w-full top-0 z-40 bg-white">
        <Header />
        <div className="flex border-b border-neutral pl-8 pr-11 justify-between items-end fixed w-full bg-white z-10">
          <div className="flex gap-6">
            <div
              onClick={() => setActiveKey("1")}
              className={`cursor-pointer p-2 ${
                activeKey === "1"
                  ? "font-bold text-main border-b-2 border-main"
                  : "text-gray-600"
              }`}
            >
              Агуулга
            </div>
            <div
              onClick={() => setActiveKey("2")}
              className={`cursor-pointer p-2 ${
                activeKey === "2"
                  ? "font-bold text-main border-b-2 border-main"
                  : "text-gray-600"
              }`}
            >
              Тохиргоо
            </div>
          </div>
          <div className="flex gap-2 py-2 items-center">
            <Button
              onClick={handleSave}
              disabled={loading || !editor}
              className="the-btn"
            >
              {isEditMode ? "Шинэчлэх" : "Хадгалах"}
            </Button>
          </div>
        </div>
      </div>

      {activeKey === "1" && (
        <div className="mt-[60px] px-4 sm:px-6 lg:px-8 pb-12 pt-6">
          <div className="max-w-3xl mx-auto bg-white border rounded-3xl border-neutral overflow-hidden">
            <Input.TextArea
              placeholder="Блогийн гарчиг..."
              value={blog.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="text-2xl! md:text-3xl! font-black border-none! focus:shadow-none! px-4! py-3! mt-2! mb-1! mx-2! w-full! placeholder-gray-400! resize-none!"
              autoSize={{ minRows: 2, maxRows: 4 }}
              size="large"
            />
            <MenuBar editor={editor} onUpload={handleEditorUpload} />
            {editor && <EditorBubbleMenu editor={editor} />}
            <EditorContent
              editor={editor}
              className="min-h-[500px] editor-content-area p-2 text-justify text-base!"
            />
            <style jsx global>{`
              .editor-content-area .ProseMirror {
                font-size: 14px !important;
              }
            `}</style>
          </div>
        </div>
      )}
      {activeKey === "2" && (
        <div className="mt-[47px]">
          <div className="border-r border-neutral py-3 w-1/5 fixed h-screen">
            <div className="px-8 font-extrabold text-menu flex items-center gap-2 mt-1 text-[#6a6d70] pb-3 border-b border-neutral">
              <SettingsBoldDuotone width={16} />
              Тохиргоо
            </div>
            <div className="px-8 py-3 bg-gray-100 cursor-pointer">
              <div className="font-bold">Ерөнхий мэдээлэл</div>
              <div className="text-[13px] pb-0.5">
                Блогийн гарчиг, зураг, төрөл
              </div>
            </div>
          </div>
          <div className="ml-[20%]">
            <div className="p-6 w-1/2">
              <div className="pr-36">
                <div className="px-1 pb-1">Блогийн гарчиг</div>
                <TestName
                  testName={blog.title || ""}
                  isEditing={false} // This component seems to manage its own state
                  setIsEditing={() => {}}
                  setTestName={(value) => handleInputChange("title", value)}
                />
                <Divider />
                <div className="pr-36 pt-1">
                  <div className="px-1 pb-2">Ангилал</div>
                  <Select
                    className="w-full"
                    options={BLOG_CATEGORIES}
                    value={blog.category}
                    onChange={(v) => handleInputChange("category", v)}
                    suffixIcon={<DropdownIcon width={15} height={15} />}
                  />
                </div>
                <Divider />
                <div className="pr-36 pt-1">
                  <div className="px-1 pb-2">Унших хугацаа (мин)</div>
                  <InputNumber
                    className="w-full"
                    min={1}
                    max={99}
                    value={blog.minutes}
                    onChange={(v) => handleInputChange("minutes", v)}
                  />
                </div>
                <Divider />
                <div className="flex items-center gap-2 pb-1">
                  <Switch
                    checked={blog.pinned}
                    onChange={(c) => handleInputChange("pinned", c)}
                    size="small"
                  />
                  <span>Онцлох нийтлэл болгох</span>
                </div>
                <Divider />
              </div>

              <div>
                <div className="px-1 pb-2">Нүүр зураг</div>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  customRequest={handleFeaturedImageUpload}
                  onRemove={handleRemoveFeaturedImage}
                  maxCount={1}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="featured-image-uploader"
                >
                  {fileList.length < 1 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Зураг оруулах</div>
                    </div>
                  )}
                </Upload>
                <style jsx global>{`
                  .featured-image-uploader .ant-upload-select,
                  .featured-image-uploader .ant-upload-list-item-container {
                    width: 128px !important;
                    height: 128px !important;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogEditor;
