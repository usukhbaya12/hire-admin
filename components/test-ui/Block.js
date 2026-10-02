"use client";

import React, { useState } from "react";
import { Button, Divider, Tooltip, message } from "antd";
import { DropdownIcon, PlusIcon } from "../Icons";
import { Question } from "./Question";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { imageUploader } from "@/app/api/constant";
import { api } from "@/utils/routes";
import {
  CheckCircleBoldDuotone,
  CopyBoldDuotone,
  GalleryCircleBoldDuotone,
  TextBoldCircleBoldDuotone,
  TextItalicCircleBoldDuotone,
  TextUnderlineCircleBoldDuotone,
  TrashBin2BoldDuotone,
} from "solar-icons";

export const Block = ({
  blocksLength,
  block,
  selection,
  onSelect,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateQuestion,
  assessmentData,
  onCopy,
  onCopyBlock,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const editor = useEditor({
    extensions: [
      Underline,
      StarterKit.configure({
        table: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "h-[150px] object-cover rounded transition-all",
          "data-selected": "false",
        },
        selectable: true,
        draggable: false,
      }),
    ],
    content: block.value || "Энд дарж асуултын текстийг өөрчилнө үү.",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdateBlock(block.id, { value: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[100px] p-4",
      },
      handleClick: (view, pos, event) => {
        const images = document.querySelectorAll(".ProseMirror img");
        images.forEach((img) => img.setAttribute("data-selected", "false"));

        if (event.target.tagName === "IMG") {
          event.target.setAttribute("data-selected", "true");
        } else {
          const node = view.state.doc.nodeAt(pos);
          if (node && node.isText) {
            const parentOffset = view.posAtDOM(event.target);
            const from = parentOffset;
            const to = parentOffset + node.nodeSize;
            const transaction = view.state.tr.setSelection(
              view.state.selection.constructor.create(view.state.doc, from, to)
            );
            view.dispatch(transaction);
          }
        }
      },
    },
  });

  const FloatingMenu = () => {
    if (!editor) return null;

    const handleFormat = (e, type) => {
      e.preventDefault();
      e.stopPropagation();

      switch (type) {
        case "bold":
          editor.commands.toggleBold();
          break;
        case "italic":
          editor.commands.toggleItalic();
          break;
        case "underline":
          editor.commands.toggleUnderline();
          break;
      }
    };

    return (
      <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border text-gray-400">
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "bold")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("bold") ? "text-main" : ""
          }`}
        >
          <TextBoldCircleBoldDuotone />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "italic")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("italic") ? "text-main" : ""
          }`}
        >
          <TextItalicCircleBoldDuotone />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "underline")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("underline") ? "text-main" : ""
          }`}
        >
          <TextUnderlineCircleBoldDuotone />
        </button>
      </div>
    );
  };

  const handleBlockImageUpload = async (e) => {
    if (uploading) {
      messageApi.warning("Зураг оруулж байна. Түр хүлээнэ үү.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxSize = 1024 * 1024; // 1MB
      if (file.size > maxSize) {
        messageApi.error("1MB-с ихгүй хэмжээтэй зураг оруулна уу.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        messageApi.error("Зөвхөн зургийн файл оруулна уу.");
        return;
      }

      setUploading(true);
      messageApi.loading({
        content: "Зураг оруулж байна...",
        key: "block-image-upload",
        duration: 0,
      });

      try {
        const formData = new FormData();
        formData.append("files", file);

        const uploadedImages = await imageUploader(formData);

        if (
          uploadedImages &&
          Array.isArray(uploadedImages) &&
          uploadedImages.length > 0
        ) {
          const fileId = uploadedImages[0];
          const imageUrl = `${api}file/${fileId}`;

          onUpdateBlock(block.id, { url: imageUrl });
          editor?.chain().focus().setImage({ src: imageUrl }).run();

          messageApi.success({
            content: "Зураг амжилттай орсон.",
            key: "block-image-upload",
          });
        } else {
          throw new Error("Upload failed to return a valid ID.");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        messageApi.error({
          content: `Зураг оруулахад алдаа гарлаа: ${error.message}`,
          key: "block-image-upload",
        });
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const handleDeleteBlockContent = () => {
    editor?.commands.setContent("");
    onUpdateBlock(block.id, { value: "", url: null });
  };

  const isSelected = selection.blockId === block.id && !selection.questionId;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = block.questions.findIndex((q) => q.id === active.id);
      const newIndex = block.questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(block.questions, oldIndex, newIndex).map(
        (q, index) => ({ ...q, order: index + 1 })
      );

      onUpdateBlock(block.id, { questions: newQuestions });
    }
  };

  return (
    <>
      {contextHolder}
      <div
        className={`mb-4 border rounded-3xl p-5 px-8 ${
          isSelected
            ? "border-main shadow-lg shadow-slate-200"
            : "border-neutral"
        }`}
        onClick={() => onSelect(block.id, null)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onUpdateBlock(block.id, { isExpanded: !block.isExpanded });
              }}
              className="px-2 py-1 hover:bg-neutral rounded-full cursor-pointer"
            >
              <DropdownIcon width={16} rotate={block.isExpanded ? 0 : -90} />
            </button>
            <div className="flex items-center">
              {isEditingName ? (
                <input
                  value={block.name}
                  onChange={(e) =>
                    onUpdateBlock(block.id, { name: e.target.value })
                  }
                  onBlur={() => setIsEditingName(false)}
                  autoFocus
                  className="font-bold outline-none underline"
                  size={block.name?.length + 10}
                />
              ) : (
                <div
                  className="cursor-pointer font-bold hover:bg-neutral rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                >
                  {block.name?.trim() || "Блок"}
                </div>
              )}
              {!block.isExpanded && (
                <span className="text-gray-500 ml-3">
                  {block.questions.length} Асуулт
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddBlock();
              }}
              className="text-blue-500 hover:underline pr-3 cursor-pointer"
            >
              Блок нэмэх
            </button>
            {typeof block.id !== "string" && (
              <Tooltip title="Хадгалагдсан">
                <CheckCircleBoldDuotone
                  width={19}
                  className="text-green-600 mr-2"
                />
              </Tooltip>
            )}
            <Tooltip title="Блок хувилах">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCopyBlock) {
                    onCopyBlock(block);
                  }
                }}
                type="text"
                className="hover:rounded-full!"
                icon={<CopyBoldDuotone width={18} className="text-blue-400!" />}
              />
            </Tooltip>

            <Tooltip title="Блок устгах">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block.id);
                }}
                type="text"
                className="hover:rounded-full! text-red-500!"
                icon={<TrashBin2BoldDuotone width={18} />}
                disabled={blocksLength === 1}
              />
            </Tooltip>
          </div>
        </div>

        {block.isExpanded && (
          <div className="mt-4">
            {block.hasQuestion && (
              <div className="pl-[34px] pr-2">
                <div className="flex items-center gap-4">
                  <div className="flex-1 border border-bg30 rounded-3xl border-neutral overflow-hidden relative">
                    {editor && (
                      <BubbleMenu
                        editor={editor}
                        tippyOptions={{ duration: 100 }}
                        shouldShow={({ editor, state }) => {
                          const { selection } = state;
                          const isTextSelected = !selection.empty;
                          const hasImage = editor.isActive("image");
                          return isTextSelected && !hasImage;
                        }}
                        className="bg-white"
                      >
                        <FloatingMenu editor={editor} />
                      </BubbleMenu>
                    )}
                    <div className="border-b border-neutral p-2 bg-neutral/50">
                      <div className="flex items-center gap-1 py-1">
                        <div className="pl-[10px] pr-2 font-bold">
                          Блокийн асуулт
                        </div>
                        <Button
                          onClick={handleBlockImageUpload}
                          loading={uploading}
                          disabled={uploading}
                          type="text"
                          className="hover:rounded-full!"
                          icon={
                            <GalleryCircleBoldDuotone
                              width={18}
                              className="text-blue-500!"
                            />
                          }
                        />
                        <Button
                          onClick={handleDeleteBlockContent}
                          type="text"
                          className="hover:rounded-full!"
                          icon={
                            <TrashBin2BoldDuotone
                              width={18}
                              className="text-red-500!"
                            />
                          }
                        />
                      </div>
                    </div>
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>
            )}

            <div className="pl-9 mt-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={({ active }) => {
                  onSelect(block.id, active.id);
                }}
              >
                <SortableContext
                  items={block.questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {block.questions.map((question) => (
                    <Question
                      key={question.id}
                      question={question}
                      blockId={block.id}
                      isSelected={selection.questionId === question.id}
                      onSelect={onSelect}
                      onUpdate={(updates) =>
                        onUpdateQuestion(question.id, updates)
                      }
                      onDelete={() => onDeleteQuestion(block.id, question.id)}
                      assessmentData={assessmentData}
                      onCopy={onCopy}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Divider />
              <div className="flex justify-between pt-2 pb-3">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddQuestion(block.id);
                  }}
                  className="the-btn"
                  icon={<PlusIcon width={18} color={"#f36421"} />}
                >
                  Асуулт нэмэх
                </Button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAddBlock();
                    }}
                    className="text-blue-500 hover:underline pr-2 cursor-pointer"
                  >
                    Блок нэмэх
                  </button>
                  <Tooltip title="Блок устгах">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                      }}
                      className="text-red-500! hover:rounded-full!"
                      type="text"
                      icon={<TrashBin2BoldDuotone width={18} />}
                      disabled={blocksLength === 1}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
