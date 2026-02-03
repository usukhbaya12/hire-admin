import React, { useMemo } from "react";
import { Card, Divider } from "antd";
import { generateDemoData, formatDemoResults } from "./Demo";
import {
  ClipboardCheckBoldDuotone,
  RevoteLineDuotone,
  SortHorizontalBoldDuotone,
  TagLineDuotone,
} from "solar-icons";
import { MenuIcon } from "./Icons";

const FormulaExample = ({
  demoData,
  formattedResults,
  aggregations,
  limitEnabled,
  limitValue,
  sortEnabled,
  sortValue,
  assessmentQuestions,
  resultConfig,
}) => {
  // Function to get interval label for a value
  const getIntervalLabel = (value, intervals) => {
    if (!intervals || intervals.length === 0) return null;
    const interval = intervals.find((i) => value >= i.start && value <= i.end);
    return interval?.label || null;
  };

  // Function to classify value based on group intervals
  const getGroupIntervalLabel = (value, groupName, groupIntervals) => {
    if (!groupIntervals || !groupIntervals[groupName]) return null;
    return getIntervalLabel(value, groupIntervals[groupName]);
  };

  const calculateExample = () => {
    if (demoData.byQuestion.length === 0 || !formattedResults) {
      return (
        <div>
          Жишээ үүсгэх боломжгүй байна. Асуулт нэмэх эсвэл хадгалах үйлдэл хийнэ
          үү.
        </div>
      );
    }

    return (
      <div>
        <div>
          {Object.entries(demoData.byBlock).map(
            ([blockName, blockData], index) => {
              return (
                <div key={index} className="mb-3">
                  <div className="flex flex-wrap gap-0.5 items-center">
                    <span className="font-medium mr-1.5">{blockName}:</span>
                    {blockData.answers.map((ans, qIndex) => {
                      const answerValue = ans.answerValue;
                      const isLastQuestion =
                        qIndex === blockData.answers.length - 1;

                      // Get the specific question for this answer
                      const currentQuestion = assessmentQuestions
                        .find((b) => b.category?.name === blockName)
                        ?.questions?.find((q) => q.id === ans.questionId);
                      const answers = currentQuestion?.answers || [];

                      if (
                        typeof answerValue === "object" &&
                        !Array.isArray(answerValue)
                      ) {
                        return Object.entries(answerValue).map(
                          ([idx, value], entryIndex, array) => {
                            const answer = answers[parseInt(idx)];
                            const hasReverse = answer?.reverse || false;
                            const isLastAnswer =
                              entryIndex === array.length - 1;
                            const isLast = isLastQuestion && isLastAnswer;

                            return (
                              <React.Fragment key={`${qIndex}-${idx}`}>
                                <div className="inline-flex items-center gap-1">
                                  <span className="text-main font-bold">
                                    {value}
                                  </span>
                                  {hasReverse && (
                                    <SortHorizontalBoldDuotone
                                      width={14}
                                      className="text-green-800"
                                    />
                                  )}
                                </div>
                                {!isLast && (
                                  <span className="text-black font-normal">
                                    ,
                                  </span>
                                )}
                              </React.Fragment>
                            );
                          }
                        );
                      } else if (Array.isArray(answerValue)) {
                        return (
                          <React.Fragment key={qIndex}>
                            <span className="text-main font-bold">
                              {answerValue.map((v) => v + 1).join(",")}
                            </span>
                            {!isLastQuestion && (
                              <span className="text-black font-normal">,</span>
                            )}
                          </React.Fragment>
                        );
                      } else {
                        const answer = answers[0];
                        const hasReverse = answer?.reverse || false;

                        return (
                          <React.Fragment key={qIndex}>
                            <div className="inline-flex items-center gap-1">
                              <span className="text-main font-bold">
                                {ans.points}
                              </span>
                              {hasReverse && (
                                <SortHorizontalBoldDuotone
                                  width={14}
                                  className="text-green-800"
                                />
                              )}
                            </div>
                            {!isLastQuestion && (
                              <span className="text-black font-normal">,</span>
                            )}
                          </React.Fragment>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>

        <Divider className="my-6!" />

        <div>
          <div className="font-semibold mb-3">📁 Үр дүн</div>
          <div className="font-bold text-gray-500 gap-2 flex items-center mb-3">
            {limitEnabled && limitValue && (
              <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 inline-block text-sm">
                Эхний {limitValue}
              </div>
            )}
            {sortEnabled && (
              <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 inline-block text-sm">
                {sortValue === "true" ? "Өсөхөөр" : "Буурахаар"}
              </div>
            )}
            {aggregations?.length > 0 && (
              <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 inline-block text-sm">
                {aggregations[0].operation === "avg"
                  ? "Дундаж"
                  : aggregations[0].operation === "sum"
                  ? "Нийлбэр"
                  : "Тоолох"}
              </div>
            )}
          </div>
          {aggregations.length > 0 && (
            <div>
              {aggregations.map((agg, aggIndex) => {
                const operation = agg.operation?.toLowerCase();
                return (
                  <div key={aggIndex} className="mb-4">
                    <div className="space-y-1">
                      {formattedResults.aggregated[operation] &&
                        Object.entries(
                          formattedResults.aggregated[operation]
                        ).map(([groupName, value], index) => {
                          // Check if in limit
                          const limit = limitValue
                            ? parseInt(limitValue)
                            : null;
                          const isInLimit =
                            !limitEnabled || !limit || index < limit;

                          // Get interval label ONLY if resultConfig is saved
                          let intervalLabel = null;
                          if (
                            resultConfig &&
                            resultConfig.type === "single" &&
                            resultConfig.intervals
                          ) {
                            intervalLabel = getIntervalLabel(
                              value,
                              resultConfig.intervals
                            );
                          } else if (
                            resultConfig &&
                            resultConfig.type === "grouped" &&
                            resultConfig.groupIntervals
                          ) {
                            intervalLabel = getGroupIntervalLabel(
                              value,
                              groupName,
                              resultConfig.groupIntervals
                            );
                          }

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={
                                  isInLimit ? "font-bold" : "font-normal"
                                }
                              >
                                {groupName}:
                              </div>
                              <div
                                className={
                                  isInLimit
                                    ? "font-bold text-main"
                                    : "font-normal text-black"
                                }
                              >
                                {value}
                                {intervalLabel && (
                                  <span className="ml-1">
                                    ({intervalLabel})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* {resultConfig && resultConfig.type !== "byCategory" && (
          <>
            <Divider className="my-6!" />
            <div>
              <div className="font-semibold mb-3">📊 Бүлгээр</div>
              <div className="space-y-2">
                {Object.entries(formattedResults.grouped || {})
                  .slice(0, 3)
                  .map(([groupName, groupData]) => (
                    <div
                      key={groupName}
                      className="text-xs bg-gray-50 p-2 rounded"
                    >
                      <div className="font-medium mb-1">{groupName}</div>
                      <div className="text-gray-600">
                        Нийт: {groupData.count} | Асуулт:{" "}
                        {groupData.questionCount || 0}
                      </div>
                    </div>
                  ))}
                {Object.keys(formattedResults.grouped || {}).length > 3 && (
                  <div className="text-xs text-gray-500">
                    ... болон {Object.keys(formattedResults.grouped).length - 3}{" "}
                    бүлэг
                  </div>
                )}
              </div>
            </div>
          </>
        )} */}

        {/* Show note when in byCategory mode AND config is saved */}
        {resultConfig && resultConfig.type === "byCategory" && (
          <>
            <Divider className="my-6!" />
            <div className="text-xs text-gray-500 italic">
              Бүх ангиллын үр дүн "Үр дүн тохируулах" хэсэгт харагдаж байна
            </div>
          </>
        )}
      </div>
    );
  };

  const exampleContent = calculateExample();

  return (
    <Card
      title={
        <div className="justify-between items-center flex">
          <div className="flex items-center gap-2">
            <ClipboardCheckBoldDuotone width={15} />
            <span>Демо өгөгдөл</span>
          </div>
          <div className="text-sm font-bold text-gray-500">
            {demoData?.byQuestion?.length || 0} асуулт
          </div>
        </div>
      }
      className="text-sm"
    >
      {exampleContent}
    </Card>
  );
};

export default FormulaExample;
