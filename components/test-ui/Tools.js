"use client";

import React, { useState, useEffect } from "react";
import { MenuIcon, DropdownIcon } from "../Icons";
import {
  Select,
  Divider,
  Collapse,
  Switch,
  InputNumber,
  Input,
  Checkbox,
  Tooltip,
  message,
} from "antd";
import InfoModal from "../modals/Info";
import {
  getDefaultAnswers,
  questionTypes,
  QUESTION_TYPES,
} from "@/utils/values";
import { TagBoldDuotone, TagLineDuotone } from "solar-icons";
import { DurationField } from "./NumericAnswer";
import { sortedAnswerCategories } from "@/utils/answerCategories";
import {
  DEFAULT_NUMBER_SETTINGS,
  DEFAULT_TIME_SETTINGS,
  formatDuration,
  pointToSeconds,
  secondsToPoint,
  timeParts,
} from "@/utils/numericAnswer";

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

    // Тоо / хугацаа: min/max нь хоосон байж болно (= хязгааргүй), тохиргоо нь settings-д.
    if (type === QUESTION_TYPES.NUMBER) {
      updates.question = {
        ...updates.question,
        minValue: 0,
        maxValue: 100,
        slider: "",
        settings: { ...DEFAULT_NUMBER_SETTINGS },
      };
    } else if (type === QUESTION_TYPES.TIME) {
      updates.question = {
        ...updates.question,
        minValue: 0,
        maxValue: 1440, // 24:00 (минутаар)
        slider: "",
        settings: { ...DEFAULT_TIME_SETTINGS },
      };
    } else {
      updates.question = { ...updates.question, settings: null };
    }

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

      {question.type === QUESTION_TYPES.NUMBER && (
        <NumberSettings question={question} onUpdate={onUpdate} />
      )}

      {question.type === QUESTION_TYPES.TIME && (
        <TimeSettings question={question} onUpdate={onUpdate} />
      )}
    </>
  );
};

const numOrNull = (v) =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v))
    ? null
    : Number(v);

const RangeWarning = ({ min, max }) =>
  min !== null && max !== null && min > max ? (
    <div className="text-red-500 text-xs">
      Хамгийн бага утга хамгийн ихээс их байна.
    </div>
  ) : null;

const NumberSettings = ({ question, onUpdate }) => {
  const q = question.question || {};
  const s = { ...DEFAULT_NUMBER_SETTINGS, ...(q.settings || {}) };
  const set = (patch) =>
    onUpdate(question.id, { question: { ...q, ...patch } });
  const setS = (patch) => set({ settings: { ...s, ...patch } });
  const min = numOrNull(q.minValue);
  const max = numOrNull(q.maxValue);
  const places = Number(s.decimalPlaces) || 2;
  const precision = s.decimal ? places : 0;
  const step = s.decimal ? Math.pow(10, -places) : 1;

  return (
    <>
      <div className="font-bold px-8">Тоон утгын тохиргоо</div>
      <Divider />
      <div className="px-8 space-y-3">
        <div>
          <div className="pb-1">Хамгийн бага</div>
          <InputNumber
            value={min}
            precision={precision}
            step={step}
            placeholder="хязгааргүй"
            onChange={(v) => set({ minValue: numOrNull(v) })}
            className="w-40"
          />
        </div>
        <div>
          <div className="pb-1">Хамгийн их</div>
          <InputNumber
            value={max}
            precision={precision}
            step={step}
            placeholder="хязгааргүй"
            onChange={(v) => set({ maxValue: numOrNull(v) })}
            className="w-40"
          />
        </div>
        <RangeWarning min={min} max={max} />
        <div className="text-xs text-gray-400">Хоосон бол хязгааргүй.</div>
      </div>
      <Divider />
      <div className="px-8 flex items-center gap-2">
        <Switch
          size="small"
          checked={!!s.decimal}
          onChange={(checked) => setS({ decimal: checked })}
        />
        <span>Бутархай тоо зөвшөөрөх</span>
      </div>
      {s.decimal && (
        <div className="px-8 pt-3 flex items-center gap-2">
          <InputNumber
            min={1}
            max={4}
            value={places}
            onChange={(v) => setS({ decimalPlaces: v || 1 })}
            className="w-20"
          />
          <span>орон (таслалаас хойш)</span>
        </div>
      )}
      <Divider />
      <div className="font-bold px-8">Нэгж</div>
      <div className="px-8 pt-2">
        <Input
          maxLength={20}
          placeholder="Жишээ нь: өдөр, кг, удаа"
          value={s.unit || ""}
          onChange={(e) => setS({ unit: e.target.value })}
        />
      </div>
      <Divider />
    </>
  );
};

const TIME_PARTS = [
  { key: "hours", part: "h", label: "Цаг" },
  { key: "minutes", part: "m", label: "Минут" },
  { key: "seconds", part: "s", label: "Секунд" },
];

const TimeSettings = ({ question, onUpdate }) => {
  const q = question.question || {};
  const s = { ...DEFAULT_TIME_SETTINGS, ...(q.settings || {}) };
  const parts = timeParts(s);
  const set = (patch) =>
    onUpdate(question.id, { question: { ...q, ...patch } });
  // min/max нь point-той ижил нэгжээр (settings.pointUnit) хадгалагдана.
  const toSec = (v, st = s) =>
    numOrNull(v) === null ? null : pointToSeconds(Number(v), st);
  const toPoint = (sec, st = s) =>
    sec === null || sec === undefined ? null : secondsToPoint(sec, st);
  const minSec = toSec(q.minValue);
  const maxSec = toSec(q.maxValue);

  const togglePart = (key, checked) => {
    const next = {
      ...s,
      hours: parts.includes("h"),
      minutes: parts.includes("m"),
      seconds: parts.includes("s"),
      [key]: checked,
    };
    if (!next.hours && !next.minutes && !next.seconds) return; // ядаж нэг хэсэг
    if (next.hours && next.seconds) next.minutes = true; // завсаргүй
    set({ settings: next });
  };

  const changeUnit = (pointUnit) => {
    const next = { ...s, pointUnit };
    set({
      settings: next,
      minValue: toPoint(minSec, next),
      maxValue: toPoint(maxSec, next),
    });
  };

  return (
    <>
      <div className="font-bold px-8">Хугацааны тохиргоо</div>
      <Divider />
      <div className="px-8">
        <div className="pb-2">Харуулах хэсэг</div>
        <div className="flex gap-4">
          {TIME_PARTS.map(({ key, part, label }) => (
            <Checkbox
              key={key}
              checked={parts.includes(part)}
              disabled={
                key === "minutes" && parts.includes("h") && parts.includes("s")
              }
              onChange={(e) => togglePart(key, e.target.checked)}
            >
              {label}
            </Checkbox>
          ))}
        </div>
        <div className="text-xs text-gray-400 pt-2">
          Хэлбэр: {parts.map((p) => ({ h: "ЦЦ", m: "ММ", s: "СС" })[p]).join(":")}
          {" "}(жишээ нь {formatDuration(5400 + (parts.includes("s") ? 20 : 0), parts)})
        </div>
      </div>
      <Divider />
      <div className="px-8 space-y-3">
        <div>
          <div className="pb-1">Хамгийн бага</div>
          <DurationField
            seconds={minSec}
            settings={s}
            onChange={(sec) => set({ minValue: toPoint(sec) })}
          />
        </div>
        <div>
          <div className="pb-1">Хамгийн их</div>
          <DurationField
            seconds={maxSec}
            settings={s}
            onChange={(sec) => set({ maxValue: toPoint(sec) })}
          />
        </div>
        <RangeWarning min={minSec} max={maxSec} />
        <div className="text-xs text-gray-400">Хоосон бол хязгааргүй.</div>
      </div>
      <Divider />
      <div className="font-bold px-8">Оноо болгох нэгж</div>
      <div className="px-8 pt-2">
        <Select
          value={s.pointUnit}
          onChange={changeUnit}
          suffixIcon={<DropdownIcon width={15} height={15} />}
          options={[
            { value: "minute", label: "Минут" },
            { value: "hour", label: "Цаг" },
            { value: "second", label: "Секунд" },
          ]}
          className="w-full"
        />
        <div className="text-xs text-gray-400 pt-2">
          Тайлан, томьёонд хугацаа{" "}
          {{ minute: "минутаар", hour: "цагаар", second: "секундээр" }[
            s.pointUnit
          ] ?? "минутаар"}{" "}
          орно: 01:30 → {secondsToPoint(5400, s)}
        </div>
      </div>
      <Divider />
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

const ConstantSumSettings = ({ question, onUpdate }) => {
  // Бутархай оноо (жиш: 2.5) байршуулах — settings.decimal / decimalPlaces (web
  // app/utils/constantSum.js уншина). Унтраалттай бол хуучнаараа бүхэл тоо.
  const s = question.question?.settings || {};
  const places = Math.min(4, Math.max(1, Number(s.decimalPlaces) || 1));
  const precision = s.decimal ? places : 0;
  const step = s.decimal ? Math.pow(10, -places) : 1;
  const setSettings = (patch) =>
    onUpdate(question.id, {
      question: {
        ...question.question,
        settings: { ...s, ...patch },
      },
    });
  const toNum = (v) => (v === null || v === undefined || v === "" ? undefined : Number(v));
  const point = toNum(question.question?.point) ?? 10;

  return (
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
        min={step}
        max={1000}
        precision={precision}
        step={step}
        value={point}
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
                  max={point - step}
                  precision={precision}
                  step={step}
                  value={toNum(question.question?.minValue)}
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
                  min={toNum(question.question?.minValue) || 0}
                  max={point}
                  precision={precision}
                  step={step}
                  value={toNum(question.question?.maxValue)}
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
    <div className="px-8 flex items-center gap-2">
      <Switch
        size="small"
        checked={!!s.decimal}
        onChange={(checked) => setSettings({ decimal: checked })}
      />
      <span>Бутархай тоо зөвшөөрөх</span>
    </div>
    {s.decimal && (
      <div className="px-8 pt-3 flex items-center gap-2">
        <InputNumber
          min={1}
          max={4}
          value={places}
          onChange={(v) => setSettings({ decimalPlaces: v || 1 })}
          className="w-20"
        />
        <span>орон (таслалаас хойш)</span>
      </div>
    )}
    <Divider className="clps" />
  </>
  );
};

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
                    {/* Дугаар = Studio / тайлан дахь дэд бүлгийн дугаар ({{1-р дэд бүлгийн оноо}},
                        {{answerCategory[1].score}}) — id-аар эрэмбэлсэн, бүх газар ижил. */}
                    <div className="text-xs text-gray-400 pl-1">
                      Дугаар нь тайлангийн {"{{1-р дэд бүлгийн оноо}}"} дахь дугаар. Дарж хуулна.
                    </div>
                    <div className="mt-2 flex flex-col gap-1.5">
                      {sortedAnswerCategories(assessmentData?.data.answerCategories).map(
                        (category, index) => (
                          <Tooltip
                            key={category.id ?? index}
                            title={`{{${index + 1}-р дэд бүлгийн оноо}} · {{answerCategory[${index + 1}].score}}`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard
                                  ?.writeText(`{{${index + 1}-р дэд бүлгийн оноо}}`)
                                  .then(() => message.success(`Хуулагдлаа: {{${index + 1}-р дэд бүлгийн оноо}}`))
                                  .catch(() => {});
                              }}
                              className="self-start bg-blue-100 hover:bg-blue-200 px-2.5 py-0.5 gap-2 rounded-full text-sm font-semibold flex items-center text-blue-800 cursor-pointer text-left"
                            >
                              <span className="min-w-5 h-5 px-1 rounded-full bg-blue-800 text-white text-[11px] flex items-center justify-center">
                                {index + 1}
                              </span>
                              {category.name}
                            </button>
                          </Tooltip>
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
