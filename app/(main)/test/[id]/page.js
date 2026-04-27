"use client";

import { Button, message } from "antd";
import React, { useState, useEffect } from "react";
import { EyeBoldDuotone } from "solar-icons";
import { useParams } from "next/navigation";
import {
  getAssessmentById,
  getAssessmentCategory,
  getQuestionsByAssessmentId,
  updateAssessmentById,
  updateQuestions,
  updateQuestionCategory,
  createQuestion,
  createQuestionCategory,
} from "@/app/api/assessment";
import Questions from "@/components/test-ui/Questions";
import LoadingSpinner from "@/components/Loading";
import Settings from "@/components/Settings";
import Report from "@/components/Report";

export default function Test() {
  const [assessmentData, setAssessmentData] = useState(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState(null);
  const [assessmentCategories, setAssessmentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [changes, setChanges] = useState({});

  const [modifiedBlocks, setModifiedBlocks] = useState(new Set());
  const [modifiedQuestions, setModifiedQuestions] = useState(new Set());
  const params = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [blocks, setBlocks] = useState([
    {
      id: "block-1",
      name: "Блок #1",
      order: 1,
      value: "",
      url: null,
      duration: 0,
      questionCount: 0,
      hasQuestion: false,
      isExpanded: true,
      questions: [],
    },
  ]);

  const [activeKey, setActiveKey] = useState("1");

  const handleTabClick = (key) => {
    setActiveKey(key);
  };

  const fetchData = async () => {
    try {
      const id = params.id;
      if (id) {
        await getAssessmentById(id).then((d) => {
          if (d.success) setAssessmentData(d.data);
        });
        await getAssessmentCategory().then((d) => {
          if (d.success) setAssessmentCategories(d.data);
        });
        await getQuestionsByAssessmentId(id).then((d) => {
          if (d.success) {
            setAssessmentQuestions(d.data);
            if (d.data && d.data.length > 0) {
              const transformedBlocks = d.data.map((block) => {
                const hasCustomCount =
                  block.category.questionCount !== block.questions.length;
                return {
                  id: block.category.id,
                  name: block.category.name,
                  order: block.category.orderNumber,
                  value: block.category.value || null,
                  duration: block.category.duration || 0,
                  questionCount:
                    block.category.questionCount || block.questions.length,
                  sliced: hasCustomCount,
                  image: null,
                  hasQuestion: !!block.category.value,
                  isExpanded: true,
                  questions: block.questions
                    .sort((a, b) => a.orderNumber - b.orderNumber)
                    .map((question) => {
                      if (question.type === 40) {
                        return {
                          id: question.id,
                          order: question.orderNumber,
                          type: question.type,
                          question: {
                            name: question.name,
                            minValue: question.minValue,
                            maxValue: question.maxValue,
                            orderNumber: question.orderNumber,
                            point: question.point || null,
                            file: question.file,
                            required: question.required,
                            slider: question.slider || null,
                          },
                          answers: question.answers.map((answerObj) => ({
                            answer: {
                              id: answerObj.id,
                              value: answerObj.value,
                              point: answerObj.point || 0,
                              orderNumber: answerObj.orderNumber,
                              category: answerObj.category || null,
                            },
                            matrix: answerObj.matrix.map((matrixItem) => {
                              return {
                                id: matrixItem.id,
                                value: matrixItem.value,
                                point: matrixItem.point,
                                category: matrixItem.category || null,
                                orderNumber: matrixItem.orderNumber,
                              };
                            }),
                          })),
                          optionCount: question.answers.length,
                        };
                      } else {
                        return {
                          id: question.id,
                          order: question.orderNumber,
                          type: question.type,
                          question: {
                            name: question.name,
                            minValue: question.minValue,
                            maxValue: question.maxValue,
                            orderNumber: question.orderNumber,
                            point: question.point || null,
                            file: question.file,
                            required: question.required,
                            slider: question.slider || null,
                          },
                          answers: question.answers.map((answer) => {
                            return {
                              answer: {
                                id: answer.id,
                                value: answer.value,
                                point: answer.point !== null ? answer.point : 0,
                                orderNumber: answer.orderNumber,
                                category: answer.category,
                                ...((question.type === 70 ||
                                  question.type === 80) && {
                                  reverse: answer.reverse ?? false,
                                  negative: answer.negative ?? false,
                                }),
                                correct: answer.correct || false,
                                file: answer.file || null,
                              },
                            };
                          }),
                          optionCount: question.answers.length,
                        };
                      }
                    }),
                };
              });
              setBlocks(transformedBlocks);
            }
          }
        });
      }
    } catch (error) {
      message.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
      setModifiedBlocks(new Set());
      setModifiedQuestions(new Set());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateAssessment = (updates) => {
    if (updates.blocks) {
      setBlocks(updates.blocks);

      if (updates.blocks !== blocks) {
        const newModifiedBlocks = new Set(modifiedBlocks);
        updates.blocks.forEach((block) => {
          const originalBlock = blocks.find((b) => b.id === block.id);
          if (
            originalBlock &&
            JSON.stringify(originalBlock) !== JSON.stringify(block)
          ) {
            newModifiedBlocks.add(block.id);
          }
        });
        setModifiedBlocks(newModifiedBlocks);
      }
    }

    setAssessmentData(updates);

    setChanges((prev) => ({
      ...prev,
      ...updates.data,
    }));
  };

  const handleQuestionModification = (questionId) => {
    setModifiedQuestions((prev) => new Set(prev).add(questionId));
  };

  const handleBlockModification = (blockId) => {
    setModifiedBlocks((prev) => new Set(prev).add(blockId));
  };

  const formatAnswers = (question) => {
    if (question.type === 40) {
      return question.answers.map((answerObj) => {
        const id = isNaN(parseInt(answerObj.answer.id));

        const answer = {
          id: id ? null : answerObj.answer.id,
          value: answerObj.answer.value,
          point: answerObj.answer.point || 0,
          orderNumber: answerObj.answer.orderNumber,
          category:
            answerObj.answer.category?.id ?? answerObj.answer.category ?? null,
        };

        const matrix = answerObj.matrix.map((matrixItem) => {
          const mId = isNaN(parseInt(matrixItem.id));
          return {
            value: matrixItem.value,
            id: mId ? null : matrixItem.id,
            category: matrixItem.category?.id ?? matrixItem.category ?? null,
            orderNumber: matrixItem.orderNumber,
            point: matrixItem.point || 0,
          };
        });

        return {
          answer,
          matrix,
        };
      });
    }

    return question.answers.map((answerObj) => {
      const id = isNaN(parseInt(answerObj.answer.id));
      return {
        answer: {
          id: id ? null : answerObj.answer.id,
          value: answerObj.answer.value,
          point: answerObj.answer.point || 0,
          file: answerObj.answer.file,
          ...((question.type === 70 || question.type === 80) && {
            reverse: answerObj.answer.reverse ?? false,
            negative: answerObj.answer.negative ?? false,
          }),
          orderNumber: answerObj.answer.orderNumber,
          category:
            answerObj.answer.category?.id ?? answerObj.answer.category ?? null,
          correct: answerObj.answer.correct || false,
        },
      };
    });
  };

  const publish = async () => {
    try {
      setLoadingBtn(true);
      const id = params.id;
      if (!id) return;

      if (assessmentData?.data?.type === 10) {
        const questionsWithoutCorrectAnswer = [];

        blocks.forEach((block) => {
          block.questions.forEach((question) => {
            if (
              (question.type === 10 || question.type === 20) &&
              !question.answers.some((answer) => answer.answer?.correct)
            ) {
              questionsWithoutCorrectAnswer.push({
                blockName: block.name,
                questionText: question.order,
              });
            }
          });
        });

        if (questionsWithoutCorrectAnswer.length > 0) {
          const detailsCount = Math.min(
            questionsWithoutCorrectAnswer.length,
            3
          );
          for (let i = 0; i < detailsCount; i++) {
            const q = questionsWithoutCorrectAnswer[i];
            messageApi.warning(
              `${q.blockName} блокийн ${q.questionText}-р асуултад зөв хариултыг сонгоно уу.`,
              4
            );
          }
          setLoadingBtn(false);
          return;
        }
      }

      if (Object.keys(changes).length > 0) {
        const assessmentResponse = await updateAssessmentById(id, changes);
        if (!assessmentResponse.success) {
          messageApi.error(
            assessmentResponse.message || "Хадгалахад алдаа гарлаа."
          );
          return;
        }
      }

      for (const block of blocks) {
        let blockId = block.id;
        const isNewBlock = typeof blockId === "string";
        const isModifiedBlock = modifiedBlocks.has(blockId);

        if (isNewBlock || isModifiedBlock) {
          if (!assessmentQuestions?.some((aq) => aq.category.id === block.id)) {
            const blockResponse = await createQuestionCategory({
              name: block.name,
              value: block.value || null,
              duration: 0,
              totalPoint: 0,
              questionCount: block.sliced
                ? block.questionCount
                : block.questions.length,
              sliced: block.sliced || false,
              orderNumber: block.order,
              assessment: id,
              url: block.url || null,
            });

            if (!blockResponse.success) {
              messageApi.error("Блок үүсгэхэд алдаа гарлаа.");
              return;
            }
            blockId = blockResponse.data;
          } else if (isModifiedBlock) {
            const blockResponse = await updateQuestionCategory({
              id: blockId,
              name: block.name,
              orderNumber: block.order,
              value: block.value || null,
              url: block.url || null,
              questionCount: block.sliced
                ? block.questionCount
                : block.questions.length,
              sliced: block.sliced || false,
              duration: block.duration || 0,
            });

            if (!blockResponse.success) {
              messageApi.error("Блок шинэчлэхэд алдаа гарлаа.");
              return;
            }
          }
        }

        const existingBlockQuestions =
          assessmentQuestions?.find((aq) => aq.category.id === block.id)
            ?.questions || [];

        for (const question of block.questions) {
          const isNewQuestion = typeof question.id === "string";
          const isModifiedQuestion = modifiedQuestions.has(question.id);

          if (isNewQuestion || isModifiedQuestion || isModifiedBlock) {
            if (existingBlockQuestions.find((eq) => eq.id === question.id)) {
              await updateQuestions({
                id: question.id,
                category: blockId,
                type: question.type,
                question: {
                  name: question.question.name,
                  minValue: question.question?.minValue || 0,
                  maxValue: question.question?.maxValue || 1,
                  orderNumber: question.order,
                  point: question.question.point,
                  file: question.question.file || null,
                  required: question.question.required || true,
                  slider: question.question.slider || null,
                },
                answers: formatAnswers(question),
              });
            } else {
              await createQuestion({
                category: blockId,
                type: question.type,
                question: {
                  name: question.question.name,
                  minValue: question.question?.minValue || 0,
                  maxValue: question.question?.maxValue || 1,
                  point: question.question?.point || null,
                  orderNumber: question.order,
                  file: question.question.file || null,
                  required: question.question.required || true,
                  slider: question.question.slider || null,
                },
                answers: formatAnswers(question),
              });
            }
          }
        }
      }

      messageApi.success("Амжилттай хадгаллаа.");
      await fetchData();
      setChanges({});
    } catch (error) {
      console.error("Error in publish:", error);
      messageApi.error("Алдаа гарлаа.");
    } finally {
      setLoadingBtn(false);
    }
  };

  if (loading) {
    <LoadingSpinner />;
  }

  const tabItems = [
    {
      key: "1",
      label: "Асуултууд",
      children: (
        <Questions
          blocks={blocks}
          setBlocks={setBlocks}
          assessmentData={assessmentData}
          onUpdateAssessment={handleUpdateAssessment}
          onQuestionModified={handleQuestionModification}
          onBlockModified={handleBlockModification}
        />
      ),
    },
    {
      key: "2",
      label: "Ерөнхий мэдээлэл",
      children: (
        <Settings
          blocks={blocks}
          setBlocks={setBlocks}
          assessmentData={assessmentData}
          assessmentCategories={assessmentCategories}
          onUpdateAssessment={handleUpdateAssessment}
        />
      ),
    },
    {
      key: "3",
      label: "Тайлан",
      children: (
        <Report
          assessmentData={assessmentData}
          onUpdateAssessment={handleUpdateAssessment}
          assessmentQuestions={assessmentQuestions}
        />
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {contextHolder}
      <div className="flex border-b border-neutral pl-8 pr-11 justify-between items-end fixed w-full bg-white z-10">
        <div className="flex gap-6">
          <div className="flex gap-6">
            {tabItems.map((item) => (
              <div
                key={item.key}
                className={`cursor-pointer p-2 ${
                  item.key === activeKey
                    ? "font-bold text-main border-b-2 border-main"
                    : ""
                }`}
                onClick={() => handleTabClick(item.key)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 py-2 items-center">
          <div className="mr-2 flex gap-1 items-center bg-main/20 px-3 py-1 rounded-full text-main text-sm font-semibold border border-main/50 shadow shadow-slate-200">
            <div>Сүүлд шинэчилсэн:</div>
            <div>
              {assessmentData?.data.updatedAt &&
                (() => {
                  const date = new Date(assessmentData.data.updatedAt);
                  date.setHours(date.getHours() + 8);
                  return `${
                    date
                      .toISOString()
                      .slice(5, 16)
                      .replace("T", " ")
                      .replace("-", "-")
                      .split(" ")[0]
                  }-нд ${date.toISOString().slice(11, 16)}`;
                })()}
            </div>
          </div>
          <Button
            className="back-btn"
            onClick={() => window.open(`/preview/${params.id}`)}
          >
            <EyeBoldDuotone />
          </Button>
          <Button
            loading={loadingBtn}
            className="the-btn"
            onClick={publish}
            disabled={
              modifiedBlocks.size === 0 &&
              modifiedQuestions.size === 0 &&
              Object.keys(changes).length === 0
            }
          >
            Хадгалах
          </Button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {tabItems.find((item) => item.key === activeKey)?.children}
      </div>
    </>
  );
}
