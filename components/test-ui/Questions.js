"use client";

import React, { useState, useEffect } from "react";
import { Block } from "./Block";
import { Tools } from "./Tools";
import { TestName } from "./TestName";
import { getDefaultAnswers, QUESTION_TYPES } from "@/utils/values";
import {
  deleteQuestionById,
  deleteQuestionCategoryById,
} from "@/app/api/assessment";
import InfoModal from "../modals/Info";
import { message, Spin } from "antd";

const Questions = ({
  assessmentData,
  onUpdateAssessment,
  blocks,
  setBlocks,
  onQuestionModified, // New prop to track modified questions
  onBlockModified, // New prop to track modified blocks
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localTestName, setLocalTestName] = useState(
    assessmentData?.data.name || "",
  );

  const [selection, setSelection] = useState({
    blockId: null,
    questionId: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    blockId: null,
    questionId: null,
    type: null,
  });
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFieldChange = (field, value) => {
    if (onUpdateAssessment) {
      onUpdateAssessment({
        ...assessmentData,
        data: {
          ...assessmentData.data,
          [field]: value,
        },
      });
    }
  };

  useEffect(() => {
    if (
      blocks?.length > 0 &&
      (!selection.blockId ||
        !blocks.find((b) => (b.category?.id || b.id) === selection.blockId))
    ) {
      const firstBlock = blocks[0];
      const blockId = firstBlock.category?.id || firstBlock.id;

      if (blockId !== selection.blockId) {
        setSelection({
          blockId: blockId,
          questionId: null,
        });
      }
    }
  }, [blocks, selection.blockId]);

  const handleSelect = React.useCallback((blockId, questionId) => {
    setSelection({ blockId, questionId });
  }, []);

  const handleBlocksUpdate = React.useCallback(
    (newBlocks) => {
      if (onUpdateAssessment) {
        onUpdateAssessment({
          ...assessmentData,
          blocks: newBlocks,
        });
      }
    },
    [assessmentData, onUpdateAssessment],
  );

  const updateBlock = React.useCallback(
    (blockId, updates) => {
      // Mark this block as modified
      if (onBlockModified) {
        onBlockModified(blockId);
      }

      setBlocks((prev) => {
        const newBlocks = prev.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block,
        );
        handleBlocksUpdate(newBlocks);
        return newBlocks;
      });
    },
    [handleBlocksUpdate, onBlockModified],
  );

  const updateQuestion = React.useCallback(
    (questionId, updates) => {
      // Mark this question as modified
      if (onQuestionModified) {
        onQuestionModified(questionId);
      }

      setBlocks((prev) =>
        prev.map((block) => ({
          ...block,
          questions: block.questions.map((q) =>
            q.id === questionId ? { ...q, ...updates } : q,
          ),
        })),
      );
    },
    [onQuestionModified],
  );

  const addBlock = React.useCallback(() => {
    const blockId = `block-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;

    setBlocks((prev) => {
      if (prev.some((block) => block.id === blockId)) {
        return prev;
      }

      const newBlock = {
        id: blockId,
        name: `Блок #${prev.length + 1}`,
        order: prev.length + 1,
        value: "",
        url: null,
        duration: 0,
        questionCount: 0,
        hasQuestion: false,
        isExpanded: true,
        questions: [],
      };

      const newBlocks = [...prev, newBlock];
      handleBlocksUpdate(newBlocks);

      setTimeout(() => handleSelect(blockId, null), 0);

      return newBlocks;
    });
  }, [handleBlocksUpdate, handleSelect]);

  const addQuestion = React.useCallback(
    (blockId) => {
      const questionId = `question-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}`;

      // Mark the parent block as modified
      if (onBlockModified) {
        onBlockModified(blockId);
      }

      setBlocks((prev) => {
        const block = prev.find((b) => b.id === blockId);
        if (block?.questions.some((q) => q.id === questionId)) {
          return prev;
        }

        const questionCount = block?.questions.length || 0;
        const newQuestion = {
          id: questionId,
          order: questionCount + 1,
          type: QUESTION_TYPES.SINGLE,
          question: {
            name: "Энд дарж асуултын текстийг өөрчилнө үү.",
            minValue: 1,
            maxValue: 5,
            orderNumber: questionCount,
          },
          answers: getDefaultAnswers(QUESTION_TYPES.SINGLE, 4),
          category: null,
        };

        const newBlocks = prev.map((block) =>
          block.id === blockId
            ? { ...block, questions: [...block.questions, newQuestion] }
            : block,
        );

        if (handleBlocksUpdate) {
          handleBlocksUpdate(newBlocks);
        }

        setTimeout(() => {
          setSelection({ blockId, questionId });
        }, 0);

        return newBlocks;
      });
    },
    [handleBlocksUpdate, setSelection, onBlockModified],
  );

  const deleteBlock = React.useCallback((blockId) => {
    setDeleteModal({
      open: true,
      blockId,
      questionId: null,
      type: "block",
    });
  }, []);

  const handleDeleteBlock = async (blockId) => {
    if (!blockId) return;

    const exists = typeof blockId !== "string";

    setLoading(true);

    if (exists) {
      try {
        const response = await deleteQuestionCategoryById(blockId);
        if (response.success) {
          setDeleteModal({
            open: false,
            blockId: null,
            questionId: null,
            type: null,
          });
          messageApi.info("Блок устсан.", [3]);

          setBlocks((prev) => {
            const filteredBlocks = prev.filter((block) => block.id !== blockId);
            return filteredBlocks.map((block, index) => ({
              ...block,
              order: index + 1,
            }));
          });

          if (selection.blockId === blockId) {
            handleSelect(blocks[0]?.id || null, null);
          }
        } else {
          messageApi.error(response.message || "Блок устгахад алдаа гарлаа.");
        }
      } catch (error) {
        message.error("Сервертэй холбогдоход алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    } else {
      setDeleteModal({
        open: false,
        blockId: null,
        questionId: null,
        type: null,
      });
      setBlocks((prev) => {
        const filteredBlocks = prev.filter((block) => block.id !== blockId);
        return filteredBlocks.map((block, index) => ({
          ...block,
          order: index + 1,
        }));
      });

      if (selection.blockId === blockId) {
        handleSelect(blocks[0]?.id || null, null);
      }
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (blockId, questionId) => {
    if (!questionId) return;

    const exists = typeof questionId !== "string";

    // Mark the parent block as modified when deleting a question
    if (onBlockModified) {
      onBlockModified(blockId);
    }

    setLoading(true);

    if (exists) {
      deleteQuestionById(questionId)
        .then((d) => {
          if (d.success) {
            setDeleteModal({
              open: false,
              blockId: null,
              questionId: null,
              type: null,
            });
            messageApi.info("Асуулт устсан.", [3]);

            setBlocks((prev) =>
              prev.map((block) =>
                block.id === blockId
                  ? {
                      ...block,
                      questions: block.questions
                        .filter((q) => q.id !== questionId)
                        .map((q, index) => ({ ...q, order: index + 1 })),
                    }
                  : block,
              ),
            );

            if (selection.questionId === questionId) {
              handleSelect(blockId, null);
            }
          } else {
            messageApi.error(d.message || "Асуулт устгахад алдаа гарлаа.");
          }
        })
        .catch(() => {
          message.error("Сервертэй холбогдоход алдаа гарлаа");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDeleteModal({
        open: false,
        blockId: null,
        questionId: null,
        type: null,
      });
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId
            ? {
                ...block,
                questions: block.questions
                  .filter((q) => q.id !== questionId)
                  .map((q, index) => ({ ...q, order: index + 1 })),
              }
            : block,
        ),
      );

      if (selection.questionId === questionId) {
        handleSelect(blockId, null);
      }
      setLoading(false);
    }
  };

  const handleCopyBlock = (blockToCopy) => {
    const newBlockId = `block-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;

    const newBlock = {
      ...blockToCopy,
      id: newBlockId,
      order: blocks.length + 1,
      name: `${blockToCopy.name} (Хуулбар)`,
      value: blockToCopy.value,
      url: blockToCopy.url,
      questionCount: blockToCopy.questions.length,
      isExpanded: true,
      questions: blockToCopy.questions.map((q) => ({
        ...q,
        id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        answers: q.answers.map((answer) => ({
          answer: {
            ...answer.answer,
            id: null,
          },
          ...(answer.matrix && {
            matrix: answer.matrix.map((item) => ({
              ...item,
              id: null,
            })),
          }),
        })),
      })),
    };

    setBlocks((prev) => [...prev, newBlock]);
    messageApi.info("Блок хувилагдсан.");
    handleSelect(newBlockId, null);
  };

  useEffect(() => {
    if (assessmentData?.data.name) {
      setLocalTestName(assessmentData.data.name);
    }
  }, [assessmentData?.data.name]);

  const [copiedItem, setCopiedItem] = useState(null);

  useEffect(() => {
    const handleKeyboard = (e) => {
      const isInEditor = e.target.closest(".ProseMirror") !== null;

      if (isInEditor) return;

      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      const isCopy = (e.ctrlKey || e.metaKey) && e.key === "c";
      const isPaste = (e.ctrlKey || e.metaKey) && e.key === "v";

      if (isCopy && selection.blockId) {
        e.preventDefault();
        const item = selection.questionId
          ? blocks
              .find((b) => b.id === selection.blockId)
              ?.questions.find((q) => q.id === selection.questionId)
          : blocks.find((b) => b.id === selection.blockId);

        if (item) {
          setCopiedItem({
            type: selection.questionId ? "question" : "block",
            data: JSON.parse(JSON.stringify(item)),
          });
        }
      }

      if (isPaste && copiedItem) {
        e.preventDefault();
        if (copiedItem.type === "question" && selection.blockId) {
          const newQuestion = {
            ...copiedItem.data,
            id: `question-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 11)}`,
            order:
              blocks.find((b) => b.id === selection.blockId)?.questions.length +
                1 || 1,
            answers: copiedItem.data.answers.map((answer) => {
              if (answer.answer) {
                return {
                  answer: {
                    ...answer.answer,
                    id: null,
                  },
                  ...(answer.matrix && {
                    matrix: answer.matrix.map((item) => ({
                      ...item,
                      id: null,
                    })),
                  }),
                };
              }
              return answer;
            }),
          };

          // Mark the block as modified when pasting a question
          if (onBlockModified) {
            onBlockModified(selection.blockId);
          }

          setBlocks((prev) =>
            prev.map((block) =>
              block.id === selection.blockId
                ? { ...block, questions: [...block.questions, newQuestion] }
                : block,
            ),
          );
          handleSelect(selection.blockId, newQuestion.id);
        } else if (copiedItem.type === "block") {
          handleCopyBlock(copiedItem.data);
        }
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [blocks, selection, copiedItem, handleSelect, onBlockModified]);

  const handleQuestionCopy = (questionData) => {
    const questionId = `question-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;

    const newQuestion = {
      ...questionData,
      id: questionId,
      order:
        blocks.find((b) => b.id === selection.blockId)?.questions.length + 1 ||
        1,
      answers: questionData.answers.map((answer) => ({
        answer: {
          ...answer.answer,
          id: null,
        },
        ...(answer.matrix && {
          matrix: answer.matrix.map((item) => ({
            ...item,
            id: null,
          })),
        }),
      })),
    };

    // Mark the block as modified when copying a question
    if (onBlockModified) {
      onBlockModified(selection.blockId);
    }

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === selection.blockId
          ? { ...block, questions: [...block.questions, newQuestion] }
          : block,
      ),
    );

    handleSelect(selection.blockId, questionId);
  };

  const deleteQuestion = React.useCallback((blockId, questionId) => {
    setDeleteModal({
      open: true,
      blockId,
      questionId,
      type: "question",
    });
  }, []);

  return (
    <div className="flex mt-[47px]">
      <Spin tip="Уншиж байна..." fullscreen spinning={loading} />

      {contextHolder}
      <InfoModal
        open={deleteModal.open}
        onOk={() => {
          if (deleteModal.type === "block") {
            handleDeleteBlock(deleteModal.blockId);
          } else if (deleteModal.type === "question") {
            handleDeleteQuestion(deleteModal.blockId, deleteModal.questionId);
          }
        }}
        onCancel={() =>
          setDeleteModal({
            open: false,
            blockId: null,
            questionId: null,
            type: null,
          })
        }
        text={
          deleteModal.type === "block"
            ? `Блокийг устгах гэж байна. Итгэлтэй байна уу? Энэ үйлдлийг буцан сэргээх боломжгүй.`
            : `Асуултыг устгах гэж байна. Итгэлтэй байна уу? Энэ үйлдлийг буцан сэргээх боломжгүй.`
        }
        title={deleteModal.type === "block" ? `Блок устгах` : `Асуулт устгах`}
      />
      <Tools
        selection={selection}
        blocks={blocks}
        onUpdateBlock={updateBlock}
        onUpdateQuestion={updateQuestion}
        assessmentData={assessmentData}
        onUpdateAssessment={onUpdateAssessment}
      />

      <div className="ml-[20%] w-4/5 p-6 px-11">
        <div className="pb-4">
          <TestName
            testName={assessmentData?.data.name || ""}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setTestName={(value) => handleFieldChange("name", value)}
          />
        </div>
        {blocks.map((block) => (
          <Block
            key={block.id}
            blocksLength={blocks.length}
            block={block}
            selection={selection}
            onSelect={handleSelect}
            onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock}
            onAddBlock={addBlock}
            onAddQuestion={addQuestion}
            onDeleteQuestion={deleteQuestion}
            onUpdateQuestion={updateQuestion}
            assessmentData={assessmentData}
            onCopy={handleQuestionCopy}
            onCopyBlock={handleCopyBlock}
          />
        ))}
      </div>
    </div>
  );
};

export default Questions;
