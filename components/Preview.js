import React, { useState, useEffect } from "react";
import {
  Card,
  Progress,
  Button,
  Radio,
  Checkbox,
  InputNumber,
  Input,
  Tooltip,
  Steps,
  Divider,
  Dropdown,
  message,
  Modal,
  Image,
  Slider,
} from "antd";
import { QUESTION_TYPES } from "@/utils/values";
import { DropdownIcon } from "./Icons";
import { getFileUrl, normalizeFileUrls } from "@/utils/fileUrl";
import {
  BookmarkBoldDuotone,
  CloseCircleBoldDuotone,
  Flag2BoldDuotone,
  ListCheckLineDuotone,
  QuestionCircleBoldDuotone,
} from "solar-icons";

const Preview = ({ assessmentData, blocks }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [isAdviceOpen, setIsAdviceOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentBlock = blocks[currentBlockIndex];
  const totalBlocks = blocks.length;

  const currentQuestionNumber = blocks
    .slice(0, currentBlockIndex)
    .reduce((sum, block) => sum + block.questions.length, 0);

  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  const [answers, setAnswers] = useState({});

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setAnsweredQuestions((prev) => {
      const newSet = new Set(prev);
      newSet.add(questionId);
      return newSet;
    });
  };

  useEffect(() => {
    if (selectedQuestionId) {
      const element = document.getElementById(`question-${selectedQuestionId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedQuestionId]);

  const handleFlag = (questionId) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getQuestionData = (questionId) => {
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const questionIndex = blocks[blockIndex].questions.findIndex(
        (q) => q.id === questionId
      );
      if (questionIndex !== -1) {
        return {
          blockIndex,
          questionIndex,
          globalIndex:
            blocks
              .slice(0, blockIndex)
              .reduce((sum, block) => sum + block.questions.length, 0) +
            questionIndex,
        };
      }
    }
    return null;
  };

  const handleQuestionClick = (questionId) => {
    const questionData = getQuestionData(questionId);
    if (questionData) {
      setCurrentBlockIndex(questionData.blockIndex);
      setTimeout(() => {
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setSelectedQuestionId(questionId);
      }, 100);
    }
  };

  const QuestionNavigation = () => {
    const hasDuration = blocks.some((block) => block.duration > 0);

    const globalQuestionIndexes = blocks.reduce((acc, block, blockIndex) => {
      const blockQuestions = block.questions.map((question, questionIndex) => ({
        ...question,
        blockIndex,
        globalIndex: acc.length + questionIndex + 1,
        blockName: block.name,
      }));
      return [...acc, ...blockQuestions];
    }, []);

    const allQuestions = hasDuration
      ? globalQuestionIndexes.filter((q) => q.blockIndex === currentBlockIndex)
      : globalQuestionIndexes;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-x-3 gap-y-2 auto-rows-max max-h-[400px] overflow-y-auto">
          {allQuestions.map((question, index) => (
            <div className="relative group" key={index}>
              <button
                onClick={() => handleQuestionClick(question.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${
                      question.blockIndex === currentBlockIndex
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : answeredQuestions.has(question.id)
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-gray-50 hover:bg-gray-100"
                    }
                    transform hover:scale-105 active:scale-95`}
              >
                <span className="relative z-10">{question.globalIndex}</span>
                {answeredQuestions.has(question.id) && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </button>
              {flaggedQuestions.has(question.id) && (
                <div className="absolute -top-0.5 right-0 w-2.5 h-2.5 bg-main rounded-full opacity-80 group-hover:scale-110 transition-transform duration-300" />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-neutral pt-4 mt-4">
          <div className="text-sm text-gray-500 mb-2">Тайлбар:</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="relative w-4 h-4 bg-gray-50 rounded">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-main rounded-full" />
              </div>
              <span>Тэмдэглэсэн асуулт</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
              <span>Одоогийн хэсэг</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="relative w-4 h-4 bg-gray-50 rounded">
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
              <span>Хариулсан асуулт</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SidePanel = ({
    isOpen,
    setIsOpen,
    title,
    children,
    position = "left",
    icon,
  }) => (
    <div
      className={`fixed hidden sm:block ${position}-0 top-1/2 -translate-y-1/2 z-20
        ${
          isOpen
            ? `${
                position === "left" ? "xl:w-[320px] 2xl:w-[420px]" : "w-[290px]"
              }`
            : "w-[48px] cursor-pointer hover:w-[52px] transition-[width] duration-300"
        }`}
      onClick={() => !isOpen && setIsOpen(true)}
    >
      <div
        className={`bg-white shadow-xl shadow-slate-200 h-auto ${
          position === "left" ? "rounded-r-3xl" : "rounded-l-3xl"
        }
        min-h-[250px]
        ${isOpen ? "scale-100 opacity-100 p-4" : "scale-100 opacity-90"}`}
      >
        {isOpen ? (
          <div className="relative">
            <div className="flex justify-between items-center mb-1 pl-4 pr-1 2xl:pr-3 2xl:pl-6 pt-1">
              <h3 className="font-bold text-md">{title}</h3>
              <Button
                type="text"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="hover:bg-gray-100 rounded-xl p-1 h-9 w-9 flex items-center justify-center font-black"
              >
                ✕
              </Button>
            </div>
            <div className="py-1 px-4 2xl:px-6">{children}</div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div
              className={`flex items-center gap-2 text-main transform ${
                position === "left"
                  ? "-rotate-90 translate-y-[115px]"
                  : "rotate-90 translate-y-[115px]"
              } whitespace-nowrap`}
            >
              {icon}
              <span className="text-sm font-medium">{title}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const [isNavOpen, setIsNavOpen] = useState(false);

  const QuestionActions = ({ question }) => (
    <Tooltip
      title={
        flaggedQuestions.has(question.id)
          ? "Тэмдэглэгээнээс хасах"
          : "Тэмдэглэх"
      }
    >
      <div
        onClick={() => handleFlag(question.id)}
        className={`cursor-pointer transition-colors duration-200
          ${
            flaggedQuestions.has(question.id)
              ? "text-main"
              : "text-gray-300 hover:text-gray-400"
          }`}
      >
        <BookmarkBoldDuotone width={18} />
      </div>
    </Tooltip>
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentBlockIndex]);

  const handleNext = () => {
    const currentBlock = blocks[currentBlockIndex];

    if (currentBlock.duration > 0) {
      const blockQuestions = currentBlock.questions;
      const allAnswered = blockQuestions.every((question) =>
        answeredQuestions.has(question.id)
      );

      if (!allAnswered) {
        messageApi.warning("Бүх асуултад хариулна уу.");
        return;
      }
    }

    if (currentBlockIndex < totalBlocks - 1) {
      setCurrentBlockIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex((prev) => prev - 1);
    }
  };

  const [messageApi, contextHolder] = message.useMessage();

  const getBlockProgress = (blockIndex) => {
    const block = blocks[blockIndex];
    const totalQuestionsInBlock = block?.questions.length;
    const answeredQuestionsInBlock = block?.questions.reduce(
      (count, question) => {
        return answeredQuestions.has(question.id) ? count + 1 : count;
      },
      0
    );

    return (answeredQuestionsInBlock / totalQuestionsInBlock) * 100;
  };

  const renderBlockQuestion = (block) => {
    if (!block.value) return null;
    return (
      <div
        className="prose max-w-none py-6 px-8"
        dangerouslySetInnerHTML={{ __html: normalizeFileUrls(block.value) }}
      />
    );
  };

  const renderQuestionContent = (question) => {
    const extractParagraphs = (html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const paragraphs = div.getElementsByTagName("p");
      const pContent = Array.from(paragraphs)
        .map((p) => p.innerHTML)
        .join("<br />");
      return pContent || html;
    };

    return (
      <div className="max-w-none font-semibold leading-5">
        <div
          dangerouslySetInnerHTML={{
            __html: extractParagraphs(normalizeFileUrls(question.question.name)),
          }}
        />
      </div>
    );
  };

  const renderMatrix = (question) => (
    <div className="mt-4 overflow-x-auto pb-1">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="bg-gray-50/50 rounded-l-xl p-3 w-[200px] text-left text-gray-600 text-sm font-medium"></th>
            {question.answers[0].matrix.map((point, index) => (
              <th
                key={index}
                className="text-center bg-gray-50/50 last:rounded-r-xl p-3 text-gray-600 text-sm font-medium"
              >
                {point.value}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {question.answers.map((answer, rowIndex) => (
            <tr key={rowIndex}>
              <td className="p-3 text-gray-700 font-medium border-t border-gray-100">
                {answer.answer.value}
              </td>
              {answer.matrix.map((_, colIndex) => (
                <td
                  key={colIndex}
                  className="p-3 text-center border-t border-gray-100"
                >
                  <Radio
                    checked={
                      answers[question.id]?.[answer.answer.value] === colIndex
                    }
                    onChange={() => {
                      const newAnswer = {
                        ...(answers[question.id] || {}),
                        [answer.answer.value]: colIndex,
                      };
                      handleAnswer(question.id, newAnswer);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAnswers = (question) => {
    switch (question.type) {
      case QUESTION_TYPES.SINGLE:
        return (
          <Radio.Group
            className="w-full space-y-1 pl-3.5!"
            value={answers[question.id]}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
          >
            {question.answers.map((answer, index) => (
              <div key={index}>
                <Radio
                  value={index}
                  className="w-full transition-colors duration-200"
                >
                  <div className="py-[6px] px-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    {answer.answer.file ? (
                      <img
                        draggable="false"
                        src={normalizeFileUrls(answer.answer.file)}
                        alt={`Option ${index + 1}`}
                        className="max-h-[100px] h-auto rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {answer.answer.value}
                      </span>
                    )}
                  </div>
                </Radio>
              </div>
            ))}
          </Radio.Group>
        );

      case QUESTION_TYPES.MULTIPLE:
        return (
          <Checkbox.Group
            className="w-full space-y-2 flex flex-col pl-3.5"
            value={answers[question.id] || []}
            onChange={(values) => handleAnswer(question.id, values)}
          >
            {question.answers.map((answer, index) => (
              <div key={index}>
                <Checkbox
                  value={index}
                  className="w-full transition-colors duration-200"
                >
                  <div className="py-[6px] px-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    {answer.answer.file ? (
                      <img
                        draggable="false"
                        src={normalizeFileUrls(answer.answer.file)}
                        alt={`Option ${index + 1}`}
                        className="max-h-[100px] h-auto rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {answer.answer.value}
                      </span>
                    )}
                  </div>
                </Checkbox>
              </div>
            ))}
          </Checkbox.Group>
        );

      case QUESTION_TYPES.TRUE_FALSE:
        return (
          <Radio.Group
            className="w-full space-y-2 pl-3.5"
            value={answers[question.id]}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
          >
            <div>
              <Radio
                value={true}
                className="w-full transition-colors duration-200"
              >
                <div className="py-[6px] px-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-gray-600">Үнэн</span>
                </div>
              </Radio>
              <Radio
                value={false}
                className="w-full transition-colors duration-200"
              >
                <div className="py-[6px] px-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-gray-600">Худал</span>
                </div>
              </Radio>
            </div>
          </Radio.Group>
        );

      case QUESTION_TYPES.MATRIX:
        return renderMatrix(question);

      case QUESTION_TYPES.CONSTANT_SUM:
        const targetSum = question.question.point || 10;
        const currentAnswers = answers[question.id] || {};
        const currentSum = Object.values(currentAnswers).reduce(
          (sum, val) => sum + (val || 0),
          0
        );
        const isComplete = currentSum === targetSum;

        return (
          <div className="space-y-4 pt-1 pl-1">
            <div className="flex gap-4 justify-between items-center">
              <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-2">
                <div className="text-gray-600 text-sm leading-4">
                  Байршуулах оноо:
                </div>
                <div className="font-extrabold text-base">{targetSum}</div>
              </div>
              <div
                className={`bg-gray-100 rounded-2xl p-3 flex items-center gap-2 transition-colors ${
                  isComplete
                    ? "bg-green-50"
                    : currentSum > targetSum
                    ? "bg-red-50"
                    : ""
                }`}
              >
                <div className="text-gray-600 text-sm leading-4">
                  Нийт онооны нийлбэр:
                </div>
                <div
                  className={`font-extrabold text-base ${
                    isComplete
                      ? "text-green-600"
                      : currentSum > targetSum
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {currentSum}
                </div>
              </div>
            </div>
            <Divider />

            <div className="space-y-3">
              {question.answers.map((answer, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between gap-8 py-2">
                    <span className="leading-5 text-gray-600 flex-1">
                      {answer.answer.value}
                    </span>
                    <InputNumber
                      precision={0}
                      min={parseInt(question.question.minValue) || 0}
                      max={parseInt(question.question.maxValue) || targetSum}
                      className="w-24"
                      value={currentAnswers[index] || 0}
                      onChange={(value) => {
                        const newAnswer = {
                          ...currentAnswers,
                          [index]: value || 0,
                        };
                        handleAnswer(question.id, newAnswer);

                        const newSum = Object.values(newAnswer).reduce(
                          (sum, val) => sum + (val || 0),
                          0
                        );
                        if (newSum === targetSum) {
                          setAnsweredQuestions((prev) => {
                            const newSet = new Set(prev);
                            newSet.add(question.id);
                            return newSet;
                          });
                        } else {
                          setAnsweredQuestions((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(question.id);
                            return newSet;
                          });
                        }
                      }}
                      status={
                        currentAnswers[index] >
                        (question.question.maxValue || targetSum)
                          ? "error"
                          : undefined
                      }
                    />
                  </div>
                  {index !== question.answers.length - 1 && (
                    <Divider className="my-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case QUESTION_TYPES.TEXT:
        return (
          <div className="mb-1">
            <Input.TextArea
              rows={3}
              placeholder="Хариултаа бичнэ үү."
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            />
          </div>
        );

      case QUESTION_TYPES.SLIDER:
        const min = parseInt(question.question?.minValue) || 1;
        const max = parseInt(question.question?.maxValue) || 5;

        const internalMin = min - 1;

        const marks = {};

        if (question.question?.slider) {
          const labels = question.question.slider
            .split(",")
            .map((s) => s.trim());

          labels.forEach((label, idx) => {
            marks[min + idx] = label;
          });
        } else {
          for (let i = min; i <= max; i++) {
            marks[i] = i.toString();
          }
        }

        return (
          <div className="space-y-4 pl-3.5!">
            {question.answers.map((answer, index) => (
              <>
                <div
                  key={index}
                  className="flex flex-col md:flex-row items-center gap-2 md:gap-4 md:justify-between"
                >
                  <div className="md:w-1/4 w-full">{answer.answer.value}</div>
                  <div className="flex pl-2 sm:pl-0 pr-5">
                    <Slider
                      min={internalMin}
                      max={max}
                      value={answers[question.id]?.[index] ?? internalMin}
                      onChange={(value) => {
                        const newAnswer = {
                          ...(answers[question.id] || {}),
                          [index]: value,
                        };
                        handleAnswer(question.id, newAnswer);
                      }}
                      marks={marks}
                      disabled={false}
                      className="w-[262px]! md:w-80 lg:w-96 custom-slider"
                    />
                  </div>
                </div>
                <Divider />
              </>
            ))}
          </div>
        );

      case QUESTION_TYPES.SLIDERSINGLE:
        const minSingle = parseInt(question.question?.minValue) || 1;
        const maxSingle = parseInt(question.question?.maxValue) || 5;
        const internalMinSingle = minSingle - 1;
        const marksSingle = {};

        if (question.question?.slider) {
          const labels = question.question.slider
            .split(",")
            .map((s) => s.trim());

          labels.forEach((label, idx) => {
            marksSingle[minSingle + idx] = label;
          });
        } else {
          for (let i = minSingle; i <= maxSingle; i++) {
            marksSingle[i] = i.toString();
          }
        }

        return (
          <div className="space-y-4 pl-3.5!">
            {question.answers.map((answer, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 md:justify-between">
                  <div className="flex pl-6 pr-5 w-full">
                    <Slider
                      min={internalMinSingle}
                      max={maxSingle}
                      value={answers[question.id]?.[index] ?? internalMinSingle}
                      onChange={(value) => {
                        const newAnswer = {
                          ...(answers[question.id] || {}),
                          [index]: value,
                        };
                        handleAnswer(question.id, newAnswer);
                      }}
                      marks={marksSingle}
                      disabled={false}
                      className="w-full custom-slider"
                    />
                  </div>
                </div>
                <Divider />
              </React.Fragment>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-[calc(100vh-50px)]">
      {contextHolder}
      {assessmentData?.data?.advice && (
        <SidePanel
          isOpen={isAdviceOpen}
          setIsOpen={setIsAdviceOpen}
          title="Асуумжид хариулах заавар"
          position="left"
          icon={<DropdownIcon width={16} />}
        >
          <div
            className="prose prose-sm max-w-none text-justify"
            dangerouslySetInnerHTML={{
              __html: assessmentData?.data.advice,
            }}
          />
        </SidePanel>
      )}

      <SidePanel
        isOpen={isNavOpen}
        setIsOpen={setIsNavOpen}
        title="Асуултууд"
        position="right"
        icon={<ListCheckLineDuotone />}
      >
        <QuestionNavigation />
      </SidePanel>

      <div className="max-w-4xl mx-auto px-9 sm:px-0 pt-4">
        <div className="md:bg-white/70 md:py-[22px] relative rounded-full md:shadow md:shadow-slate-200 backdrop-blur-md md:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black bg-gradient-to-r from-main to-secondary bg-clip-text text-transparent">
              {assessmentData?.data.name}
            </h1>
            {totalBlocks > 1 && (
              <div className="hidden sm:block">
                <Progress
                  percent={Math.round((currentBlockIndex / totalBlocks) * 100)}
                  steps={totalBlocks}
                  strokeColor="#f36421"
                />
              </div>
            )}
          </div>
        </div>
        <div className="sticky top-[57px] bg-gray-100 z-10 space-y-4 pt-4 rounded-b-2xl">
          <div className="bg-white backdrop-blur-md rounded-3xl shadow-lg shadow-slate-200">
            <div className="px-4 py-[15px] px-7 md:px-8">
              <div className="justify-between gap-3 flex items-center">
                <div>
                  <h2 className="font-bold">{currentBlock?.name}</h2>
                </div>
                <div className="font-medium text-base text-gray-500">
                  <div className="w-[120px] text-end flex justify-end items-center gap-3">
                    {currentBlockIndex + 1}-р хэсэг / {totalBlocks}-c
                  </div>
                  <Progress
                    percent={getBlockProgress(currentBlockIndex)}
                    // size="small"
                    format={(percent) => `${Math.round(percent)}%`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {currentBlock?.value && (
          <div className="bg-white rounded-2xl shadow-sm mt-4">
            {renderBlockQuestion(currentBlock)}
          </div>
        )}

        <div className="space-y-4! mt-4! pb-24!">
          {currentBlock?.questions.map((question, index) => (
            <Card
              key={question.id}
              id={`question-${question.id}`}
              className="rounded-2xl duration-200 sm:px-1"
            >
              <div className="flex gap-5 items-center">
                <div className="relative">
                  <div className="w-11! h-11! bg-gray-50 rounded-xl flex items-center justify-center relative">
                    <span className="text-gray-700 font-medium">
                      {index + 1}
                    </span>
                    <div className="absolute -top-1 -right-1">
                      <QuestionActions question={question} index={index} />
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="prose max-w-none">
                    {renderQuestionContent(question)}
                  </div>
                </div>
              </div>
              {question.question.file && (
                <div className="pt-3 sm:pt-2 sm:pb-1 sm:max-w-[400px] flex sm:ml-[55px]">
                  <Image
                    src={getFileUrl(question.question.file)}
                    alt="Question"
                    className="object-cover rounded-xl"
                  />
                </div>
              )}

              <div className="pt-1">
                <Divider />
              </div>
              {renderAnswers(question)}
            </Card>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral z-30">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-end gap-3">
            <div
              className="text-main cursor-pointer hover:text-secondary transition-colors"
              onClick={() => setIsFlagModalOpen(true)}
            >
              <Flag2BoldDuotone />
            </div>
            {assessmentData?.data?.advice && (
              <Dropdown
                className="sm:hidden"
                arrow
                trigger={["click"]}
                placement="topLeft"
                dropdownRender={() => (
                  <div className="bg-white rounded-xl shadow-xl py-6 px-8 min-w-[315px] max-w-[315px]">
                    <div className="font-bold pb-2 text-base">
                      Асуумжид хариулах заавар
                    </div>
                    <div
                      className=" max-w-none text-justify"
                      dangerouslySetInnerHTML={{
                        __html: assessmentData?.data.advice,
                      }}
                    />
                  </div>
                )}
              >
                <div className="text-main cursor-pointer">
                  <QuestionCircleBoldDuotone />
                </div>
              </Dropdown>
            )}
            <Dropdown
              className="sm:hidden"
              arrow
              trigger={["click"]}
              placement="topRight"
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
              dropdownRender={() => (
                <div
                  className="bg-white rounded-xl shadow-xl py-6 px-8 min-w-[290px]"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <QuestionNavigation />
                </div>
              )}
            >
              <div className="text-main cursor-pointer">
                <ListCheckLineDuotone />
              </div>
            </Dropdown>

            {currentBlockIndex !== 0 && (
              <Button
                className="back-btn"
                onClick={handlePrevious}
                disabled={currentBlockIndex === 0}
              >
                Өмнөх
              </Button>
            )}

            <Button
              onClick={handleNext}
              className="the-btn"
              disabled={currentBlockIndex === totalBlocks - 1}
            >
              {currentBlockIndex === totalBlocks - 1 ? "Дуусгах" : "Дараах"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
