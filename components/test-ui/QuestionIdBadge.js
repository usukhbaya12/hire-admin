"use client";

// Асуултын ID — хадгалагдсан асуулт бүр дээр харагдана. Дарахад хуулах сонголтууд:
//   ID (2656) · {{question[2656].answer}} (тайлангийн текстэд хариулт) ·
//   {{question[2656].point}} (Studio томьёо хувьсагчид: тоо, хугацаа → минут, Тийм/Үгүй → оноо).
import React from "react";
import { Dropdown, message } from "antd";

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success(`Хуулагдлаа: ${text}`);
  } catch {
    message.info(text);
  }
};

const QuestionIdBadge = ({ id }) => {
  if (id == null || typeof id === "string") return null;
  const tokens = {
    id: String(id),
    answer: `{{question[${id}].answer}}`,
    point: `{{question[${id}].point}}`,
  };
  const items = [
    { key: "id", label: `ID хуулах — ${id}` },
    { key: "answer", label: <span>Хариулт (текстэд) — <code>{tokens.answer}</code></span> },
    { key: "point", label: <span>Оноо / утга (томьёонд) — <code>{tokens.point}</code></span> },
  ];
  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items,
        onClick: ({ key, domEvent }) => {
          domEvent?.stopPropagation();
          copy(tokens[key]);
        },
      }}
    >
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        title="Асуултын ID — дарж хуулна"
        className="px-1.5 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[11px] leading-4 font-mono text-gray-600 whitespace-nowrap cursor-pointer"
      >
        ID {id}
      </button>
    </Dropdown>
  );
};

export default QuestionIdBadge;
