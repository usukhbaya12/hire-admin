import React, { useState } from "react";
import {
  Radio,
  Checkbox,
  Input,
  Button,
  Dropdown,
  InputNumber,
  Tooltip,
  message,
  Slider,
} from "antd";
import { MoreIcon, DropdownIcon } from "../Icons";
import MatrixGrid from "./MatrixGrid";
import { deleteAnswerById } from "@/app/api/assessment";
import { api } from "@/utils/routes";
import { imageUploader } from "@/app/api/constant";
import {
  GalleryCircleBoldDuotone,
  MinusSquareBoldDuotone,
  Pen2BoldDuotone,
  SortHorizontalBoldDuotone,
  TagLineDuotone,
  TrashBin2BoldDuotone,
} from "solar-icons";

const AnswerOptions = ({
  question,
  onUpdate,
  assessmentData,
  editingOptionIndex,
  setEditingOptionIndex,
}) => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleOptionImageUpload = async (index) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size (1MB limit)
      const maxSize = 1024 * 1024; // 1MB
      if (file.size > maxSize) {
        messageApi.error("1MB-с ихгүй хэмжээтэй зураг оруулна уу.");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        messageApi.error("Зөвхөн зургийн файл оруулна уу.");
        return;
      }

      messageApi.loading({
        content: "Зураг оруулж байна...",
        key: `option-upload-${index}`,
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

          const newOptions = [...question.answers];
          newOptions[index].answer.file = imageUrl;
          onUpdate({ answers: newOptions });

          messageApi.success({
            content: "Зураг амжилттай оруулагдлаа.",
            key: `option-upload-${index}`,
          });
        } else {
          throw new Error("Upload failed to return a valid ID.");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        messageApi.error({
          content: `Зураг оруулахад алдаа гарлаа: ${error.message}`,
          key: `option-upload-${index}`,
        });
      }
    };

    input.click();
  };

  console.log(question.answers);
  const handleOptionChange = (index, changes) => {
    const newOptions = [...question.answers];
    newOptions[index].answer = {
      ...newOptions[index].answer,
      ...changes,
    };
    onUpdate({ answers: newOptions });
  };

  const handleOptionBlur = (index) => {
    if (!question.answers[index].answer.value) {
      handleOptionChange(index, { value: `Сонголт ${index + 1}` });
    }
    setEditingOptionIndex(null);
  };

  const handleCategorySelect = (category, index) => {
    const newOptions = [...question.answers];
    newOptions[index].answer.category = category.id;
    newOptions[index].answer.categoryName = category.name;
    onUpdate({ answers: newOptions });
  };

  const handleRemoveCategory = (index) => {
    const newOptions = [...question.answers];
    newOptions[index].answer.category = null;
    newOptions[index].answer.categoryName = null;
    onUpdate({ answers: newOptions });
  };

  const removeOptionImage = (index) => {
    const newOptions = [...question.answers];
    newOptions[index].answer.file = null;
    onUpdate({ answers: newOptions });
  };

  const handleCancelReverse = (index) => {
    const newOptions = [...question.answers];
    newOptions[index].answer.reverse = false;
    onUpdate({ answers: newOptions });
  };

  const handleCancelNegative = (index) => {
    const newOptions = [...question.answers];
    newOptions[index].answer.negative = false;
    onUpdate({ answers: newOptions });
  };

  const handleCorrectAnswerChange = (index, checked) => {
    const newOptions = [...question.answers];
    if (question.type === 10) {
      newOptions.forEach((opt, i) => {
        opt.answer.correct = i === index ? checked : false;
      });
    } else {
      newOptions[index].answer.correct = checked;
    }
    onUpdate({ answers: newOptions });
  };

  const handleDelete = async (index) => {
    const answerId = question.answers[index]?.answer?.id;

    if (!answerId) {
      const newOptions = [...question.answers];
      newOptions.splice(index, 1);
      onUpdate({
        answers: newOptions,
        optionCount: newOptions.length,
      });
      return;
    }

    try {
      const response = await deleteAnswerById([answerId], false);
      if (response.success) {
        const newOptions = [...question.answers];
        newOptions.splice(index, 1);
        onUpdate({
          answers: newOptions,
          optionCount: newOptions.length,
        });
        messageApi.info("Хариулт устсан.", [3]);
      } else {
        messageApi.error(response.message || "Хариулт устгахад алдаа гарлаа.");
      }
    } catch (error) {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа");
    }
  };

  const getOptionMenu = (index) => ({
    items: [
      {
        key: "image",
        label: <div className="pl-1">Зураг оруулах</div>,
        icon: <GalleryCircleBoldDuotone width={18} />,
        onClick: () => handleOptionImageUpload(index),
      },
      {
        key: "category",
        label: <div className="pl-1 pt-[1px] pr-3">Ангилал тохируулах</div>,
        icon: <Pen2BoldDuotone width={16} />,
        disabled: !assessmentData?.data.answerCategories.length > 0,
        children: assessmentData?.data.answerCategories.map((category) => ({
          key: category.id,
          label: (
            <div className="flex items-center gap-2">
              <TagLineDuotone width={16} className="text-blue-800" />
              <span className="font-semibold text-blue-800 text-sm">
                {category.name}
              </span>
            </div>
          ),
          onClick: () => handleCategorySelect(category, index),
        })),
        expandIcon: <DropdownIcon width={15} rotate={-90} />,
      },
      ...(question.type === 70 || question.type === 80
        ? [
            {
              key: "reverse",
              label: (
                <div className="pl-1">
                  {question.answers[index].answer?.reverse
                    ? "Урвуу оноог цуцлах"
                    : "Урвуу оноо"}
                </div>
              ),
              icon: <SortHorizontalBoldDuotone width={16} />,
              onClick: () => {
                const newAnswers = [...question.answers];
                newAnswers[index].answer = {
                  ...newAnswers[index].answer,
                  reverse: !newAnswers[index].answer?.reverse,
                };
                onUpdate({ answers: newAnswers });
              },
            },
            {
              key: "negative",
              label: (
                <div className="pl-1">
                  {question.answers[index].answer?.negative
                    ? "Хасах утгыг цуцлах"
                    : "Хасах утга"}
                </div>
              ),
              icon: <MinusSquareBoldDuotone width={16} />,
              onClick: () => {
                const newAnswers = [...question.answers];
                newAnswers[index].answer = {
                  ...newAnswers[index].answer,
                  negative: !newAnswers[index].answer?.negative,
                };
                onUpdate({ answers: newAnswers });
              },
            },
          ]
        : []),
      {
        key: "remove",
        label: <div className="pl-1">Устгах</div>,
        icon: <TrashBin2BoldDuotone width={16} />,
        onClick: () => handleDelete(index),
        danger: true,
        disabled: question.answers.length <= 2,
      },
    ],
  });

  const renderSingleOrMultipleChoice = () => (
    <div className="w-full">
      {question.answers.map((option, index) => {
        return (
          <div key={index} className="flex items-center gap-2 group">
            <AnswerTypeControl
              type={question.type}
              option={option}
              index={index}
              assessmentData={assessmentData}
              onChange={handleCorrectAnswerChange}
            />
            <AnswerContent
              option={option}
              index={index}
              editingOptionIndex={editingOptionIndex}
              setEditingOptionIndex={setEditingOptionIndex}
              handleOptionChange={handleOptionChange}
              handleOptionBlur={handleOptionBlur}
              removeOptionImage={removeOptionImage}
              handleRemoveCategory={handleRemoveCategory}
              handleCancelReverse={handleCancelReverse}
              handleCancelNegative={handleCancelNegative}
              getOptionMenu={getOptionMenu}
              question={question}
            />
          </div>
        );
      })}
    </div>
  );

  const renderConstantSum = () => (
    <div>
      {question.answers.map((option, index) => (
        <div key={index} className="flex items-center gap-2 group">
          <div className="flex-1">
            <AnswerContent
              option={option}
              index={index}
              editingOptionIndex={editingOptionIndex}
              setEditingOptionIndex={setEditingOptionIndex}
              handleOptionChange={handleOptionChange}
              handleOptionBlur={handleOptionBlur}
              handleRemoveCategory={handleRemoveCategory}
              handleCancelReverse={handleCancelReverse}
              handleCancelNegative={handleCancelNegative}
              getOptionMenu={getOptionMenu}
              isConstantSum
              question={question}
            />
          </div>
        </div>
      ))}
    </div>
  );

  if (question.type === 40) {
    return (
      <MatrixGrid
        question={question}
        onUpdate={onUpdate}
        assessmentData={assessmentData}
      />
    );
  }

  const renderTrueFalse = () => (
    <div className="w-full">
      {question.answers?.slice(0, 2).map((option, index) => (
        <div key={index} className="flex items-center gap-2 mb-0.5">
          <Radio
            disabled={assessmentData?.data.type === 20}
            checked={option.answer.correct || false}
            onChange={(e) => {
              const newOptions = [...question.answers];
              newOptions.forEach((opt, i) => {
                opt.answer.correct = i === index;
              });
              onUpdate({ answers: newOptions });
            }}
          />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-16">{index === 0 ? "Үнэн" : "Худал"}</div>
            <InputNumber
              min={0}
              value={option.answer.point || 0}
              onChange={(value) => {
                const newOptions = [...question.answers];
                newOptions[index].answer = {
                  ...newOptions[index].answer,
                  point: value,
                };
                onUpdate({ answers: newOptions });
              }}
              className="w-24 h-[30px]"
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTextInput = () => (
    <div className="w-2/5 flex gap-2 items-center">
      <div className="w-[80%]">
        <Input disabled placeholder="Хариулт бичих хэсэг" />
      </div>
      {/* <InputNumber
        min={0}
        value={question.question?.minValue || 0}
        onChange={(value) =>
          onUpdate(question.id, {
            question: {
              ...question.question,
              minValue: value,
            },
          })
        }
        className="w-full h-[30px]"
      /> */}
    </div>
  );

  const renderSlider = () => {
    const min = Number(question.question?.minValue) || 0;
    const max = Number(question.question?.maxValue) || 5;

    const getMarks = () => {
      if (!question.question?.slider) {
        return Array.from({ length: max - min + 1 }, (_, i) => i + min).reduce(
          (acc, num) => ({ ...acc, [Number(num)]: String(num) }),
          {},
        );
      }

      const labels = question.question.slider.split(",").map((s) => s.trim());
      return labels.reduce(
        (acc, label, idx) => ({
          ...acc,
          [Number(min + idx)]: label,
        }),
        {},
      );
    };

    return (
      <div className="w-full">
        {question.answers.map((option, index) => (
          <div key={index} className="flex items-center gap-2 group">
            <div className="flex-1">
              <AnswerContent
                option={option}
                index={index}
                editingOptionIndex={editingOptionIndex}
                setEditingOptionIndex={setEditingOptionIndex}
                handleOptionChange={handleOptionChange}
                handleOptionBlur={handleOptionBlur}
                handleRemoveCategory={handleRemoveCategory}
                handleCancelReverse={handleCancelReverse}
                handleCancelNegative={handleCancelNegative}
                getOptionMenu={getOptionMenu}
                question={question}
                customControl={
                  <Slider
                    disabled
                    min={min}
                    max={max}
                    step={1}
                    value={Number(option.answer.point) || min}
                    onChange={(value) =>
                      handleOptionChange(index, { point: Number(value) })
                    }
                    marks={getMarks()}
                    className="w-60"
                  />
                }
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSliderSingle = () => {
    const min = Number(question.question?.minValue) || 0;
    const max = Number(question.question?.maxValue) || 5;

    const getMarks = () => {
      if (!question.question?.slider) {
        return Array.from({ length: max - min + 1 }, (_, i) => i + min).reduce(
          (acc, num) => ({ ...acc, [Number(num)]: String(num) }),
          {},
        );
      }

      const labels = question.question.slider.split(",").map((s) => s.trim());
      return labels.reduce(
        (acc, label, idx) => ({
          ...acc,
          [Number(min + idx)]: label,
        }),
        {},
      );
    };

    return (
      <div className="w-full">
        {question.answers?.slice(0, 1).map((option, index) => (
          <div key={index} className="flex items-center gap-2 group">
            <div className="flex-1">
              <AnswerContent
                option={option}
                index={index}
                editingOptionIndex={editingOptionIndex}
                setEditingOptionIndex={setEditingOptionIndex}
                handleOptionChange={handleOptionChange}
                handleOptionBlur={handleOptionBlur}
                handleRemoveCategory={handleRemoveCategory}
                handleCancelReverse={handleCancelReverse}
                handleCancelNegative={handleCancelNegative}
                getOptionMenu={getOptionMenu}
                question={question}
                customControl={
                  <Slider
                    disabled
                    min={min}
                    max={max}
                    step={1}
                    value={Number(option.answer.point) || min}
                    onChange={(value) =>
                      handleOptionChange(index, { point: Number(value) })
                    }
                    marks={getMarks()}
                    className="w-96"
                  />
                }
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMap = {
    10: renderSingleOrMultipleChoice,
    20: renderSingleOrMultipleChoice,
    50: renderConstantSum,
    30: renderTrueFalse,
    60: renderTextInput,
    70: renderSlider,
    80: renderSliderSingle,
  };

  return (
    <>
      {contextHolder}
      {renderMap[question.type]?.() || null}
    </>
  );
};

const AnswerTypeControl = ({
  type,
  option,
  index,
  assessmentData,
  onChange,
}) => {
  const Control = type === 10 ? Radio : Checkbox;

  return (
    <Tooltip
      title={assessmentData?.data.type === 10 ? "Зөв хариугаар тэмдэглэх" : ""}
    >
      <Control
        disabled={assessmentData?.data.type === 20}
        checked={option.answer?.correct || false}
        onChange={(e) => onChange(index, e.target.checked)}
        className={type === 20 ? "pr-2" : ""}
      />
    </Tooltip>
  );
};

const AnswerContent = ({
  option,
  index,
  editingOptionIndex,
  setEditingOptionIndex,
  handleOptionChange,
  handleOptionBlur,
  removeOptionImage,
  handleRemoveCategory,
  handleCancelReverse,
  handleCancelNegative,
  getOptionMenu,
  isConstantSum = false,
  question,
  customControl,
}) => {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          {option.answer?.file ? (
            <div className="mt-2 relative group/image">
              <img
                src={option.answer.file}
                alt={option.answer.value}
                className="h-[100px] object-cover rounded"
              />
              <Tooltip title="Хариултаас зураг устгах">
                <button
                  onClick={() => removeOptionImage(index)}
                  className="cursor-pointer absolute top-2 left-2 px-1 bg-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity"
                >
                  <TrashBin2BoldDuotone width={18} className="text-red-500" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center w-full">
              {question.type === 80 ? (
                <></>
              ) : editingOptionIndex === index ? (
                <input
                  value={option.answer?.value || ""}
                  onChange={(e) =>
                    handleOptionChange(index, { value: e.target.value })
                  }
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const nextIndex =
                        index < question.answers.length - 1 ? index + 1 : 0;
                      setEditingOptionIndex(nextIndex);
                    }
                  }}
                  onBlur={() => handleOptionBlur(index)}
                  autoFocus
                  className="outline-none underline w-full"
                  size={option.answer?.value?.length + 10}
                />
              ) : (
                <div
                  className={`cursor-pointer rounded-md ${
                    editingOptionIndex === null ? "hover:bg-neutral" : ""
                  }`}
                  onClick={() => setEditingOptionIndex(index)}
                >
                  {option.answer?.value?.trim() || `Сонголт ${index + 1}`}
                </div>
              )}
            </div>
          )}
        </div>

        {option.answer?.reverse && (
          <Tooltip title="Урвуу оноог цуцлах">
            <div
              onClick={() => handleCancelReverse(index)}
              className="bg-green-100 px-2.5 py-0.5 gap-2 rounded-full text-sm font-semibold flex items-center text-green-800 cursor-pointer hover:bg-green-200"
            >
              <SortHorizontalBoldDuotone
                width={14}
                className="text-green-800"
              />
              Урвуу
            </div>
          </Tooltip>
        )}

        {option.answer?.negative && (
          <Tooltip title="Хасах утгыг цуцлах">
            <div
              onClick={() => handleCancelNegative(index)}
              className="bg-red-100 px-2.5 py-0.5 gap-2 rounded-full text-sm font-semibold flex items-center text-red-800 cursor-pointer hover:bg-red-200"
            >
              <MinusSquareBoldDuotone width={14} className="text-red-800" />
              Хасах
            </div>
          </Tooltip>
        )}

        {option.answer?.category && (
          <Tooltip title="Ангилал устгах">
            <div
              onClick={() => handleRemoveCategory(index)}
              className="bg-blue-100 px-2.5 py-0.5 gap-2 rounded-full text-sm font-semibold flex items-center text-blue-800 cursor-pointer hover:bg-blue-200"
            >
              <TagLineDuotone width={14} className="text-blue-800" />
              {option.answer?.categoryName || option.answer?.category?.name}
            </div>
          </Tooltip>
        )}

        {customControl ? (
          customControl
        ) : !isConstantSum ? (
          <InputNumber
            min={0}
            value={option.answer?.point || 0}
            onChange={(value) => handleOptionChange(index, { point: value })}
            className="w-24 h-[30px]"
          />
        ) : (
          <InputNumber disabled value={0} className="w-24 mr-2 h-[30px]" />
        )}

        <Dropdown
          menu={getOptionMenu(index)}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full!"
            icon={<MoreIcon width={16} />}
          />
        </Dropdown>
      </div>
    </div>
  );
};

export default AnswerOptions;
