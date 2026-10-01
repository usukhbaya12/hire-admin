"use client";

import React, { useState } from "react";
import { InputNumber, Button, Tooltip, Dropdown, message } from "antd";
import { DropdownIcon, MoreIcon } from "../Icons";
import { deleteAnswerById } from "@/app/api/assessment";
import { sortedAnswerCategories, answerCategoryLabel } from "@/utils/answerCategories";
import {
  PenBoldDuotone,
  TagBoldDuotone,
  TagLineDuotone,
  TrashBin2BoldDuotone,
} from "solar-icons";

const MatrixGrid = ({ question, onUpdate, assessmentData }) => {
  const [editingCell, setEditingCell] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleDeleteOption = async (rowIndex) => {
    if (question.answers.length <= 2) return;

    const answerId = [question.answers[rowIndex]?.answer?.id];

    if (!answerId) {
      const newAnswers = question.answers.filter(
        (_, index) => index !== rowIndex
      );
      onUpdate({ answers: newAnswers });
      return;
    }

    try {
      const response = await deleteAnswerById(answerId, false);
      if (response.success) {
        const newAnswers = question.answers.filter(
          (_, index) => index !== rowIndex
        );
        onUpdate({ answers: newAnswers });
        messageApi.info("Хариулт устсан.", [3]);
      } else {
        messageApi.error(response.message || "Хариулт устгахад алдаа гарлаа.");
      }
    } catch (error) {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа");
    }
  };

  const handleDeletePoint = async (pointIndex) => {
    if (question.answers[0].matrix.length <= 2) return;
    const matrixPointId = question.answers[0].matrix[pointIndex]?.id;
    const matrix = question.answers.map((answer) => {
      return answer.matrix[pointIndex]?.id;
    });
    if (!matrixPointId) {
      const newAnswers = question.answers.map((answer) => ({
        ...answer,
        matrix: answer.matrix.filter((_, index) => index !== pointIndex),
      }));
      onUpdate({ answers: newAnswers });
      return;
    }

    try {
      const response = await deleteAnswerById(matrix, question.id);
      if (response.success) {
        const newAnswers = question.answers.map((answer) => ({
          ...answer,
          matrix: answer.matrix.filter((_, index) => index !== pointIndex),
        }));
        onUpdate({ answers: newAnswers });
        messageApi.info("Цэг устсан.", [3]);
      } else {
        messageApi.error(response.message || "Цэг устгахад алдаа гарлаа.");
      }
    } catch (error) {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа");
    }
  };

  // Мөрийн (хариултын) ангилал — жиш ASSIST: мөр бүр нэг бодис. Баганад ангилал
  // тохируулаагүй бол хариулт энэ мөрийн ангилалд бүртгэгдэнэ (core: matrix-category.ts).
  const handleRowCategorySelect = (category, rowIndex) => {
    const newAnswers = question.answers.map((answer, i) =>
      i === rowIndex
        ? {
            ...answer,
            answer: {
              ...answer.answer,
              category: category.id,
              categoryName: category.name,
            },
          }
        : answer
    );
    onUpdate({ answers: newAnswers });
  };

  const handleRowCategoryRemove = (rowIndex) => {
    const newAnswers = question.answers.map((answer, i) =>
      i === rowIndex
        ? {
            ...answer,
            answer: { ...answer.answer, category: null, categoryName: null },
          }
        : answer
    );
    onUpdate({ answers: newAnswers });
  };

  const categoryMenuItems = (onPick) =>
    sortedAnswerCategories(assessmentData?.data.answerCategories).map((category, ci) => ({
      key: category.id,
      label: (
        <div className="flex items-center gap-2">
          <TagLineDuotone width={16} className="text-blue-800" />
          <span className="font-semibold text-blue-800 text-sm">
            {ci + 1}. {category.name}
          </span>
        </div>
      ),
      onClick: () => onPick(category),
    }));

  const getOptionMenu = (index) => ({
    items: [
      {
        key: "category",
        label: <div className="pl-2 pr-3 pt-[1px]">Ангилал тохируулах</div>,
        icon: <PenBoldDuotone width={16} />,
        disabled: !assessmentData?.data.answerCategories?.length,
        children: categoryMenuItems((category) =>
          handleRowCategorySelect(category, index)
        ),
        expandIcon: <DropdownIcon width={15} rotate={-90} />,
      },
      {
        key: "remove",
        label: <div className="pl-2">Устгах</div>,
        icon: <TrashBin2BoldDuotone width={16} />,
        danger: true,
        disabled: question.answers.length <= 2,
        onClick: () => handleDeleteOption(index),
      },
    ],
  });

  const getPointMenu = (index) => ({
    items: [
      {
        key: "category",
        label: <div className="pl-2 pr-3 pt-[1px]">Ангилал тохируулах</div>,
        icon: <PenBoldDuotone width={16} />,
        disabled: !assessmentData?.data.answerCategories?.length,
        children: sortedAnswerCategories(assessmentData?.data.answerCategories).map((category, ci) => ({
          key: category.id,
          label: (
            <div>
              <div className="flex items-center gap-2">
                <TagLineDuotone width={16} className="text-blue-800" />
                <span className="font-semibold text-blue-800 text-sm">
                  {ci + 1}. {category.name}
                </span>
              </div>
            </div>
          ),
          onClick: () => handleCategorySelect(category, index),
        })),
        expandIcon: <DropdownIcon width={15} rotate={-90} />,
      },
      {
        key: "remove",
        label: <div className="pl-2">Устгах</div>,
        icon: <TrashBin2BoldDuotone width={16} />,
        danger: true,
        disabled: question.answers[0].matrix.length <= 2,
        onClick: () => handleDeletePoint(index),
      },
    ],
  });

  const handleScalePointKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIndex =
        index < question.answers[0].matrix.length - 1 ? index + 1 : 0;
      setEditingCell({ type: "scale", index: nextIndex });
    }
  };

  const handleOptionKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIndex = index < question.answers.length - 1 ? index + 1 : 0;
      setEditingCell({ type: "option", index: nextIndex });
    }
  };

  const handleCategorySelect = (category, index) => {
    const newAnswers = question.answers.map((answer) => ({
      ...answer,
      matrix: answer.matrix.map((item, i) =>
        i === index
          ? { ...item, category: category.id, categoryName: category.name }
          : item
      ),
    }));
    onUpdate({ answers: newAnswers });
  };

  const handleRemoveCategory = (index) => {
    const newAnswers = question.answers.map((answer) => ({
      ...answer,
      matrix: answer.matrix.map((item, i) =>
        i === index ? { ...item, category: null } : item
      ),
    }));
    onUpdate({ answers: newAnswers });
  };

  const handleScalePointEdit = (index, newValue) => {
    const newAnswers = question.answers.map((answer) => ({
      ...answer,
      matrix: answer.matrix.map((item, i) =>
        i === index ? { ...item, value: newValue } : item
      ),
    }));
    onUpdate({ answers: newAnswers });
  };

  const handleOptionEdit = (index, newText) => {
    const newAnswers = [...question.answers];
    newAnswers[index].answer.value = newText;
    onUpdate({ answers: newAnswers });
  };

  const handlePointChange = (rowIndex, colIndex, value) => {
    const newAnswers = [...question.answers];
    if (!newAnswers[rowIndex].matrix[colIndex]) {
      newAnswers[rowIndex].matrix[colIndex] = {};
    }
    newAnswers[rowIndex].matrix[colIndex].point = value;
    onUpdate({ answers: newAnswers });
  };

  return (
    <div className="w-full pr-12">
      {contextHolder}
      <div className="flex">
        <div className="w-1/4 border-b border-r"></div>
        <div
          className="flex-1 grid border-b"
          style={{
            gridTemplateColumns: `repeat(${question.answers[0].matrix?.length}, 1fr)`,
          }}
        >
          {question.answers[0].matrix?.map((point, index) => (
            <div key={index} className="text-center mb-1">
              <div className="flex flex-col items-center">
                {editingCell?.type === "scale" &&
                editingCell?.index === index ? (
                  <input
                    value={point.value}
                    onChange={(e) =>
                      handleScalePointEdit(index, e.target.value)
                    }
                    onBlur={() => {
                      if (!point.value.trim()) {
                        handleScalePointEdit(index, `Цэг ${index + 1}`);
                      }
                      setEditingCell(null);
                    }}
                    onKeyDown={(e) => handleScalePointKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    autoFocus
                    className="w-full text-center outline-none underline"
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:bg-neutral rounded"
                    onClick={() => setEditingCell({ type: "scale", index })}
                  >
                    {point.value}
                  </div>
                )}
                {point.category ? (
                  <Tooltip title="Ангилал устгах">
                    <div
                      className="bg-blue-100 px-2.5 py-0.5 gap-2 rounded-full text-sm font-semibold flex items-center text-blue-800"
                      onClick={() => handleRemoveCategory(index)}
                    >
                      <TagLineDuotone width={14} className="text-blue-800" />
                      {answerCategoryLabel(
                        assessmentData?.data.answerCategories,
                        point.category,
                        point.categoryName || point.category?.name,
                      )}
                    </div>
                  </Tooltip>
                ) : (
                  <Dropdown
                    menu={getPointMenu(index)}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      className="mt-1 opacity-0 hover:opacity-100"
                      icon={<MoreIcon width={16} />}
                    />
                  </Dropdown>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4"></div>
      {question.answers.map((answer, rowIndex) => (
        <div key={rowIndex} className="flex items-center">
          <div className="w-1/4 border-r py-1 pb-2">
            <div className="flex justify-between items-center pr-2">
              {editingCell?.type === "option" &&
              editingCell?.index === rowIndex ? (
                <input
                  value={answer.answer.value}
                  onChange={(e) => handleOptionEdit(rowIndex, e.target.value)}
                  onBlur={() => {
                    if (!answer.answer.value.trim()) {
                      handleOptionEdit(rowIndex, `Сонголт ${rowIndex + 1}`);
                    }
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => handleOptionKeyDown(e, rowIndex)}
                  onFocus={(e) => e.target.select()}
                  autoFocus
                  className="w-full outline-none underline"
                />
              ) : (
                <div
                  className="cursor-pointer hover:bg-neutral rounded flex"
                  onClick={() =>
                    setEditingCell({ type: "option", index: rowIndex })
                  }
                >
                  {answer.answer.value}
                </div>
              )}
              {answer.answer?.category && (
                <Tooltip title="Ангилал устгах">
                  <div
                    onClick={() => handleRowCategoryRemove(rowIndex)}
                    className="ml-2 shrink-0 bg-blue-100 px-2.5 py-0.5 gap-1.5 rounded-full text-xs font-semibold flex items-center text-blue-800 cursor-pointer hover:bg-blue-200"
                  >
                    <TagLineDuotone width={13} className="text-blue-800" />
                    {answerCategoryLabel(
                      assessmentData?.data.answerCategories,
                      answer.answer?.category,
                      answer.answer?.categoryName || answer.answer?.category?.name,
                    )}
                  </div>
                </Tooltip>
              )}
              <Dropdown
                menu={getOptionMenu(rowIndex)}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  className="opacity-0 hover:opacity-100"
                  icon={<MoreIcon width={16} />}
                />
              </Dropdown>
            </div>
          </div>
          <div
            className="flex-1 grid"
            style={{
              gridTemplateColumns: `repeat(${answer.matrix?.length}, 1fr)`,
            }}
          >
            {answer.matrix?.map((point, colIndex) => (
              <div key={colIndex} className="flex justify-center p-1">
                <InputNumber
                  min={-1}
                  value={point.point || 0}
                  onChange={(value) =>
                    handlePointChange(rowIndex, colIndex, value)
                  }
                  className="w-20"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatrixGrid;
