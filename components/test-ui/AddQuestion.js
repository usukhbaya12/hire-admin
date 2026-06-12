"use client";

import React, { useState, useRef } from "react";
import { Button, Tooltip, Switch, message } from "antd";
import QuestionEditor from "./QuestionEditor";
import AnswerOptions from "./AnswerOptions";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CopyBoldDuotone,
  TrashBin2BoldDuotone,
  GalleryCircleBoldDuotone,
} from "solar-icons";
import { api } from "@/utils/routes";
import { imageUploader } from "@/app/api/constant";

const AddQuestion = ({
  question,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  onCopy,
  assessmentData,
}) => {
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const imageUploadRef = useRef({
    setInsertImage: () => {},
  });
  const [messageApi, contextHolder] = message.useMessage();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleQuestionUpdate = (updates) => {
    onUpdate({
      question: {
        ...question.question,
        ...updates.question,
      },
    });
  };

  const handleAnswersUpdate = (updates) => {
    onUpdate(updates);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopy(question);
  };

  const handleImageUpload = async (e) => {
    e.stopPropagation();

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

      // Check file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        messageApi.error("2MB-с ихгүй хэмжээтэй зураг оруулна уу.");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        messageApi.error("Зөвхөн зургийн файл оруулна уу.");
        return;
      }

      setUploading(true);
      messageApi.loading({
        content: "Зураг оруулж байна...",
        key: "image-upload",
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

          // Insert image using the function from QuestionEditor
          if (
            imageUploadRef.current &&
            typeof imageUploadRef.current.setInsertImage === "function"
          ) {
            imageUploadRef.current.setInsertImage(imageUrl);
          }

          onUpdate({
            question: {
              ...question.question,
              file: fileId,
            },
          });

          messageApi.success({
            content: "Зураг амжилттай оруулагдлаа.",
            key: "image-upload",
          });
        } else {
          throw new Error("Upload failed to return a valid ID.");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        messageApi.error({
          content: `Зураг оруулахад алдаа гарлаа: ${error.message}`,
          key: "image-upload",
        });
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  return (
    <>
      {contextHolder}
      <div
        ref={setNodeRef}
        style={style}
        className={`p-6 border rounded-3xl mt-6 mb-6 pb-7 pl-8 pr-8 pt-8 relative ${
          selected
            ? "border-main shadow-md shadow-slate-200"
            : "border-neutral hover:border-main/30"
        } ${isDragging ? "z-50" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
        }}
      >
        <div className="flex justify-between items-start gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move absolute left-5 top-1/2 -translate-y-1/2 text-xl text-bold text-gray-400 hover:text-gray-600"
          >
            ⣿
          </div>

          <QuestionEditor
            initialContent={question.question.name}
            onUpdate={handleQuestionUpdate}
            orderNumber={question.order}
            posted={typeof question.id !== "string"}
            question={question}
            onImageUpload={imageUploadRef}
          />

          <div className="flex flex-col gap-0.5">
            <Tooltip title="Зураг оруулах">
              <Button
                onClick={handleImageUpload}
                loading={uploading}
                disabled={uploading}
                className="text-blue-500! hover:rounded-full!"
                type="text"
                icon={!uploading && <GalleryCircleBoldDuotone width={18} />}
              />
            </Tooltip>
            <Tooltip title="Асуулт хувилах">
              <Button
                onClick={handleCopy}
                className="text-blue-400! hover:rounded-full!"
                type="text"
                icon={<CopyBoldDuotone width={18} height={18} />}
              />
            </Tooltip>
            <Tooltip title="Асуулт устгах">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500! hover:rounded-full! flex-shrink-0"
                type="text"
                icon={<TrashBin2BoldDuotone width={18} />}
              />
            </Tooltip>
          </div>
        </div>

        <div className="pt-4 pl-20 pr-2">
          <AnswerOptions
            question={question}
            onUpdate={handleAnswersUpdate}
            assessmentData={assessmentData}
            editingOptionIndex={editingOptionIndex}
            setEditingOptionIndex={setEditingOptionIndex}
          />
        </div>

        {selected && (
          <div className="pl-20 pr-2 pt-3 flex items-center gap-2 text-sm text-gray-500">
            <Switch
              size="small"
              checked={question.question.required ?? true}
              onChange={(checked) =>
                handleQuestionUpdate({ question: { required: checked } })
              }
            />
            <span>Заавал бөглөх</span>
          </div>
        )}
      </div>
    </>
  );
};

export default AddQuestion;
