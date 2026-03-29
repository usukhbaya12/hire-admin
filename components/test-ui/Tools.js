"use client";

import React, { useState, useEffect } from "react";
import { MenuIcon, DropdownIcon } from "../Icons";
import { Select, Divider, Collapse, Switch, InputNumber, Input } from "antd";
import InfoModal from "../modals/Info";
import {
  getDefaultAnswers,
  questionTypes,
  QUESTION_TYPES,
} from "@/utils/values";
import { TagBoldDuotone, TagLineDuotone } from "solar-icons";

export const Tools = ({
  selection,
  blocks,
  onUpdateBlock,
  onUpdateQuestion,
  assessmentData,
  onUpdateAssessment,
}) => {
  const selectedBlock = blocks.find((b) => b.id === selection.blockId);
  const selectedQuestion = selectedBlock?.questions.find(
    (q) => q.id === selection.questionId,
  );

  return (
    <div className="border-r border-neutral py-3 w-1/5 fixed h-screen">
      <div className="px-8 font-extrabold text-menu flex items-center gap-2 mt-1 text-[#6a6d70]">
        <MenuIcon width={14} />
        {selection.questionId ? "Асуулт засах" : "Блокийн тохиргоо"}
      </div>
      <Divider />

      {selection.questionId && selectedQuestion ? (
        <QuestionSettings
          question={selectedQuestion}
          onUpdate={onUpdateQuestion}
        />
      ) : (
        selectedBlock && (
          <BlockSettings
            block={selectedBlock}
            onUpdate={onUpdateBlock}
            assessmentData={assessmentData}
            onUpdateAssessment={onUpdateAssessment}
          />
        )
      )}
    </div>
  );
};

const QuestionSettings = ({ question, onUpdate }) => {
  const updateOptions = (type, count) => {
    const answers = getDefaultAnswers(type, count);
    const updates = {
      ...question,
      type,
      optionCount: count,
      question: {
        ...question.question,
        minValue:
          type === QUESTION_TYPES.CONSTANT_SUM
            ? 0
            : question.question?.minValue || 0,
        maxValue:
          type === QUESTION_TYPES.CONSTANT_SUM
            ? 10
            : question.question?.maxValue || 5,
      },
      answers,
    };

    onUpdate(question.id, updates);
  };

  const handleOptionCountChange = (value) => {
    const currentAnswers = question.answers || [];
    const newAnswers =
      value > currentAnswers.length
        ? [
            ...currentAnswers,
            ...Array.from(
              { length: value - currentAnswers.length },
              (_, i) => ({
                answer: {
                  value: `Сонголт ${currentAnswers.length + i + 1}`,
                  point: 0,
                  orderNumber: currentAnswers.length + i,
                  category: null,
                  correct: false,
                },
              }),
            ),
          ]
        : currentAnswers.slice(0, value);

    onUpdate(question.id, {
      ...question,
      answers: newAnswers,
    });
  };

  const renderOptionCountSetting = () => (
    <Collapse
      expandIcon={({ isActive }) => (
        <DropdownIcon width={15} rotate={isActive ? 0 : -90} />
      )}
      defaultActiveKey={["1"]}
      items={[
        {
          key: "1",
          label: "Хариултын тоо",
          children: (
            <div className="flex items-center gap-2">
              <InputNumber
                min={
                  question.type === QUESTION_TYPES.SLIDERSINGLE
                    ? 1
                    : typeof question.id === "string"
                      ? 2
                      : question.answers?.length
                }
                max={question.type === QUESTION_TYPES.SLIDERSINGLE ? 1 : 100}
                value={question.answers?.length || 4}
                onChange={handleOptionCountChange}
              />
              <span>хариулттай</span>
            </div>
          ),
        },
      ]}
    />
  );

  return (
    <>
      <div className="px-8 pb-1.5">
        <div className="font-bold pl-1 pb-2">Асуултын төрөл</div>
        <Select
          disabled={typeof question.id !== "string"}
          suffixIcon={<DropdownIcon width={15} height={15} />}
          value={question.type}
          onChange={(type) => updateOptions(type, type === 30 ? 2 : 4)}
          options={questionTypes}
          className="w-full"
        />
      </div>
      <Divider />

      {/* <div className="px-6">
        <div className="gap-2 flex items-center">
          <Switch
            size="small"
            checked={question.required}
            onChange={(checked) => onUpdate(question.id, { required: checked })}
          />
          <span>Заавал асуух</span>
        </div>
      </div>
      <Divider /> */}

      {question.type === 40 && (
        <MatrixSettings question={question} onUpdate={onUpdate} />
      )}

      {question.type === 50 && (
        <ConstantSumSettings question={question} onUpdate={onUpdate} />
      )}

      {[10, 20, 70].includes(question.type) && (
        <>
          {renderOptionCountSetting()}
          <Divider className="clps" />
        </>
      )}

      {(question.type === QUESTION_TYPES.SLIDER ||
        question.type === QUESTION_TYPES.SLIDERSINGLE) && (
        <>
          <div className="font-bold px-8">Слайдерын тохиргоо</div>
          <Divider />
          <div>
            <div className="flex items-center gap-2 px-8">
              <InputNumber
                min={0}
                max={(parseInt(question.question?.maxValue) || 5) - 1}
                value={parseInt(question.question?.minValue) || 0}
                onChange={(value) => {
                  onUpdate(question.id, {
                    question: {
                      ...question.question,
                      minValue: value,
                      slider: "",
                    },
                  });
                }}
              />
              <span>онооноос</span>
            </div>
            <Divider />
            <div className="flex items-center gap-2 px-8">
              <InputNumber
                min={(parseInt(question.question?.minValue) || 1) + 1}
                value={parseInt(question.question?.maxValue) || 5}
                onChange={(value) => {
                  onUpdate(question.id, {
                    question: {
                      ...question.question,
                      maxValue: value,
                      slider: "",
                    },
                  });
                }}
              />
              <span>хүртэл</span>
            </div>
            <Divider />
            <div className="font-bold px-8">Тэмдэглэгээ</div>
            <div className="px-8 pt-2">
              <Input.TextArea
                rows={3}
                placeholder="Таслалаар хязгаарлан оруулна уу. Жишээ нь: Хэзээ ч үгүй, Заримдаа, Байнга"
                value={question.question?.slider || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const maxCommas =
                    (question.question?.maxValue || 5) -
                    (question.question?.minValue || 0);
                  const currentCommas = newValue.split(",").length - 1;

                  if (currentCommas <= maxCommas) {
                    onUpdate(question.id, {
                      question: {
                        ...question.question,
                        slider: newValue,
                      },
                    });
                  }
                }}
              />
            </div>
          </div>
          <Divider />
        </>
      )}
    </>
  );
};

const MatrixSettings = ({ question, onUpdate }) => (
  <>
    <div>
      <div className="font-bold px-8">Матрицын тохиргоо</div>
      <Divider />
      <div className="flex px-[26px] items-center gap-2">
        <InputNumber
          min={
            typeof question.id === "string"
              ? 2
              : question.answers?.[0]?.matrix?.length
          }
          max={10}
          value={question.answers?.[0]?.matrix?.length || 3}
          onChange={(value) => {
            const newAnswers = question.answers.map((answer) => ({
              ...answer,
              matrix: Array.from({ length: value }, (_, j) => ({
                value: answer.matrix[j]?.value || `Цэг ${j + 1}`,
                category: answer.matrix[j]?.category || null,
                orderNumber: j,
                id: answer.matrix[j]?.id ?? null,
              })),
            }));

            onUpdate(question.id, { answers: newAnswers });
          }}
          className="w-full"
        />
        <div className="text-gray-600">цэгтэй</div>
      </div>
      <Divider />
      <div className="flex px-[26px] items-center gap-2">
        <InputNumber
          min={typeof question.id === "string" ? 2 : question.answers?.length}
          max={10}
          value={question.answers?.length || 2}
          onChange={(value) => {
            if (
              value < question.answers.length &&
              typeof question.id === "string"
            ) {
              const newAnswers = question.answers.slice(0, value);
              onUpdate(question.id, { answers: newAnswers });
            } else if (value > question.answers.length) {
              const length = question.answers.length;
              const answers = [
                ...question.answers,
                ...Array.from({ length: value - length }, (_, i) => ({
                  answer: {
                    value: `Сонголт ${length + i + 1}`,
                    point: 0,
                    orderNumber: length + i,
                    category: null,
                  },
                  matrix: question.answers[0].matrix.map((m) => ({
                    ...m,
                    id: null,
                  })),
                })),
              ];
              onUpdate(question.id, { answers: answers });
            }
          }}
          className="w-full"
        />
        <div className="text-gray-600">сонголттой</div>
      </div>
      <Divider />
      <div className="flex items-center gap-2 px-8">
        <Switch
          size="small"
          checked={question.allowMultiple}
          onChange={(checked) =>
            onUpdate(question.id, { allowMultiple: checked })
          }
        />
        <span>Олон сонголт зөвшөөрөх</span>
      </div>
    </div>
    <Divider />
  </>
);

const ConstantSumSettings = ({ question, onUpdate }) => (
  <>
    <Collapse
      expandIcon={({ isActive }) => (
        <DropdownIcon width={15} rotate={isActive ? 0 : -90} />
      )}
      defaultActiveKey={["1"]}
      items={[
        {
          key: "1",
          label: "Сонголтын тоо",
          children: (
            <div className="flex items-center gap-2">
              <InputNumber
                min={
                  typeof question.id === "string" ? 2 : question.answers?.length
                }
                max={10}
                value={question.answers?.length || 4}
                onChange={(value) => {
                  const newAnswers = Array.from(
                    { length: value },
                    (_, i) =>
                      question.answers[i] || {
                        answer: {
                          value: `Сонголт ${i + 1}`,
                          orderNumber: i,
                          category: null,
                        },
                      },
                  );
                  onUpdate(question.id, {
                    answers: newAnswers,
                  });
                }}
              />
              <span>сонголттой</span>
            </div>
          ),
        },
      ]}
    />
    <Divider className="clps" />
    <div className="font-bold px-8">Байршуулах оноо</div>
    <Divider />
    <div className="px-8 flex items-center gap-2">
      <InputNumber
        min={1}
        max={1000}
        value={question.question?.point || 10}
        onChange={(value) =>
          onUpdate(question.id, {
            question: {
              ...question.question,
              point: value,
            },
          })
        }
        className="w-full"
      />
      <div>оноо</div>
    </div>
    <Divider />
    <Collapse
      expandIcon={({ isActive }) => (
        <DropdownIcon width={15} rotate={isActive ? 0 : -90} />
      )}
      defaultActiveKey={["1"]}
      items={[
        {
          key: "1",
          label: "Онооны хязгаар",
          children: (
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span>Доод:</span>
                <InputNumber
                  min={0}
                  max={question.question?.point - 1}
                  value={question.question?.minValue}
                  onChange={(value) =>
                    onUpdate(question.id, {
                      question: {
                        ...question.question,
                        minValue: value,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Дээд:</span>
                <InputNumber
                  min={question.question?.minValue || 0}
                  max={question.question?.point}
                  value={question.question?.maxValue}
                  onChange={(value) =>
                    onUpdate(question.id, {
                      question: {
                        ...question.question,
                        maxValue: value,
                      },
                    })
                  }
                />
              </div>
            </div>
          ),
        },
      ]}
    />
    <Divider className="clps" />
  </>
);

const BlockSettings = ({
  block,
  onUpdate,
  assessmentData,
  onUpdateAssessment,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleBlockQuestionToggle = (checked) => {
    onUpdate(block.id, {
      hasQuestion: checked,
      value: checked ? block.value : null,
      url: block.url || null,
    });
  };

  return (
    <div>
      <InfoModal
        open={isModalVisible}
        onOk={() => {
          setCategoryInput("");
          setCategories([]);
          onUpdateAssessment({
            hasAnswerCategory: false,
            categories: [],
          });
          setIsModalVisible(false);
        }}
        onCancel={() => {
          setIsModalVisible(false);
          onUpdateAssessment({ hasAnswerCategory: true });
        }}
        text="Хариултын ангиллууд устгах гэж байна. Итгэлтэй байна уу?"
        title="Хариултын ангилал устгах"
      />

      <div className="gap-2 flex items-center px-8">
        <Switch
          size="small"
          checked={block.hasQuestion}
          onChange={handleBlockQuestionToggle}
        />
        <span>Блокийн асуулт</span>
      </div>
      <Divider />

      <Collapse
        expandIcon={({ isActive }) => (
          <DropdownIcon width={15} rotate={isActive ? 0 : -90} />
        )}
        defaultActiveKey={["1"]}
        items={[
          {
            key: "1",
            label: "Хариултын ангилал",
            children: (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    disabled
                    size="small"
                    checked={assessmentData?.data.answerCategories.length > 0}
                    onChange={(checked) =>
                      checked
                        ? onUpdateAssessment({ hasAnswerCategory: true })
                        : setIsModalVisible(true)
                    }
                  />
                  <span className="text-gray-600">
                    Хариултууд ангилалтай юу?
                  </span>
                </div>
                {assessmentData?.data.answerCategories.length > 0 && (
                  <div className="pt-3">
                    <div className="font-bold pb-1 pl-1">Ангиллууд</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assessmentData?.data.answerCategories.map(
                        (category, index) => (
                          <div
                            key={index}
                            className="bg-blue-100 px-2.5 py-0.5 gap-2 rounded-full text-sm font-semibold flex items-center text-blue-800"
                          >
                            <TagLineDuotone
                              width={14}
                              className="text-blue-800"
                            />
                            {category.name}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Tools;
