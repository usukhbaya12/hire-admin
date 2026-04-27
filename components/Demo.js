import { QUESTION_TYPES } from "@/utils/values";

const generateQuestionDemoValue = (question) => {
  const type = question.type;
  const answers = question.answers || [];

  switch (type) {
    case QUESTION_TYPES.SINGLE: {
      return Math.floor(Math.random() * answers.length);
    }

    case QUESTION_TYPES.MULTIPLE: {
      const count = Math.floor(Math.random() * answers.length) + 1;
      const indices = [];
      while (indices.length < count) {
        const idx = Math.floor(Math.random() * answers.length);
        if (!indices.includes(idx)) indices.push(idx);
      }
      return indices;
    }

    case QUESTION_TYPES.TRUE_FALSE: {
      return Math.floor(Math.random() * 2);
    }

    case QUESTION_TYPES.SLIDERSINGLE: {
      const min = parseInt(question.minValue) || 1;
      const max = parseInt(question.maxValue) || 5;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    case QUESTION_TYPES.SLIDER: {
      const min = parseInt(question.minValue) || 1;
      const max = parseInt(question.maxValue) || 5;
      const values = {};
      answers.forEach((_, index) => {
        values[index] = Math.floor(Math.random() * (max - min + 1)) + min;
      });
      return values;
    }

    case QUESTION_TYPES.MATRIX: {
      const values = {};
      answers.forEach((answer) => {
        values[answer.value] = Math.floor(
          Math.random() * (answer.matrix?.length || 4)
        );
      });
      return values;
    }

    case QUESTION_TYPES.CONSTANT_SUM: {
      const min = parseInt(question.minValue) || 0;
      const max = parseInt(question.maxValue) || 10;
      const totalPoints = parseInt(question.point) || 100;
      const answerCount = answers.length;

      const values = {};
      let remaining = totalPoints;

      answers.forEach((answer, index) => {
        if (index === answerCount - 1) {
          values[index] = Math.max(min, Math.min(max, remaining));
        } else {
          const remainingAnswers = answerCount - index - 1;
          const maxPossible = Math.min(max, remaining - remainingAnswers * min);
          const minPossible = Math.max(min, remaining - remainingAnswers * max);

          if (maxPossible >= minPossible) {
            const value =
              Math.floor(Math.random() * (maxPossible - minPossible + 1)) +
              minPossible;
            values[index] = value;
            remaining -= value;
          } else {
            values[index] = min;
            remaining -= min;
          }
        }
      });

      return values;
    }

    case QUESTION_TYPES.TEXT: {
      return "Жишээ хариулт";
    }

    default:
      return null;
  }
};

const calculateQuestionPoints = (question, answerValue) => {
  const type = question.type;
  const answers = question.answers || [];
  const min = parseInt(question.minValue) || 0;
  const max = parseInt(question.maxValue) || 10;

  const reverseValue = (value, shouldReverse) => {
    if (!shouldReverse) return value;
    return min + max - value;
  };

  switch (type) {
    case QUESTION_TYPES.SINGLE: {
      const selectedAnswer = answers[answerValue];
      return parseFloat(selectedAnswer?.point) || 0;
    }

    case QUESTION_TYPES.MULTIPLE: {
      let total = 0;
      answerValue.forEach((idx) => {
        total += parseFloat(answers[idx]?.point) || 0;
      });
      return total;
    }

    case QUESTION_TYPES.TRUE_FALSE: {
      const selectedAnswer = answers[answerValue];
      return parseFloat(selectedAnswer?.point) || 0;
    }

    case QUESTION_TYPES.SLIDERSINGLE: {
      const shouldReverse = answers[0]?.reverse || false;
      return reverseValue(answerValue, shouldReverse);
    }

    case QUESTION_TYPES.SLIDER: {
      let total = 0;
      Object.entries(answerValue).forEach(([index, value]) => {
        const answer = answers[parseInt(index)];
        const shouldReverse = answer?.reverse || false;
        const actualValue = reverseValue(value, shouldReverse);
        total += actualValue;
      });
      return total;
    }

    case QUESTION_TYPES.MATRIX: {
      let total = 0;
      answers.forEach((answer) => {
        const colIndex = answerValue[answer.value];
        if (colIndex !== undefined && answer.matrix?.[colIndex]) {
          total += parseFloat(answer.matrix[colIndex].point) || 0;
        }
      });
      return total;
    }

    case QUESTION_TYPES.CONSTANT_SUM: {
      let total = 0;
      Object.values(answerValue).forEach((val) => {
        total += val;
      });
      return total;
    }

    case QUESTION_TYPES.TEXT: {
      return 0;
    }

    default:
      return 0;
  }
};

export const generateDemoData = (
  assessmentQuestions,
  answerCategories = []
) => {
  if (!assessmentQuestions || !Array.isArray(assessmentQuestions)) return null;

  const demoData = {
    byBlock: {},
    byQuestion: [],
    byAnswerCategory: {},
    allAnswers: {},
  };

  if (answerCategories && answerCategories.length > 0) {
    answerCategories.forEach((cat) => {
      demoData.byAnswerCategory[cat.name] = {
        points: [],
        count: 0,
        questions: [],
      };
    });
  }

  assessmentQuestions.forEach((blockData) => {
    const blockName =
      blockData.category?.name ||
      `Блок ${blockData.category?.orderNumber || 1}`;
    const questions = blockData.questions || [];

    demoData.byBlock[blockName] = {
      answers: [],
      totalPoints: 0,
      categories: {},
    };

    questions.forEach((question) => {
      const answerValue = generateQuestionDemoValue(question);
      const points = calculateQuestionPoints(question, answerValue);

      demoData.allAnswers[question.id] = answerValue;

      const questionResult = {
        questionId: question.id,
        questionText: question.name || "Асуулт",
        questionType: question.type,
        answerValue,
        points,
        blockName,
        blockId: blockData.category?.id,
      };

      demoData.byBlock[blockName].answers.push(questionResult);
      demoData.byBlock[blockName].totalPoints += points;

      const type = question.type;
      const answers = question.answers || [];
      const min = parseInt(question.minValue) || 0;
      const max = parseInt(question.maxValue) || 10;

      const reverseValue = (value, shouldReverse) => {
        if (!shouldReverse) return value;
        return min + max - value;
      };

      if (type === QUESTION_TYPES.SLIDER) {
        Object.entries(answerValue).forEach(([index, value]) => {
          const answer = answers[parseInt(index)];
          const categoryName = answer?.category?.name;
          const shouldReverse = answer?.reverse || false;
          const actualValue = reverseValue(value, shouldReverse);

          if (categoryName && demoData.byAnswerCategory[categoryName]) {
            demoData.byAnswerCategory[categoryName].points.push(actualValue);
            demoData.byAnswerCategory[categoryName].count++;
          }
        });
      } else if (type === QUESTION_TYPES.CONSTANT_SUM) {
        Object.entries(answerValue).forEach(([index, value]) => {
          const answer = answers[parseInt(index)];
          const categoryName = answer?.category?.name;

          if (categoryName && demoData.byAnswerCategory[categoryName]) {
            demoData.byAnswerCategory[categoryName].points.push(value);
            demoData.byAnswerCategory[categoryName].count++;
          }
        });
      } else if (
        type === QUESTION_TYPES.SINGLE ||
        type === QUESTION_TYPES.TRUE_FALSE
      ) {
        const answer = answers[answerValue];
        const categoryName = answer?.category?.name;

        if (categoryName && demoData.byAnswerCategory[categoryName]) {
          demoData.byAnswerCategory[categoryName].points.push(points);
          demoData.byAnswerCategory[categoryName].count++;
        }
      } else if (type === QUESTION_TYPES.MULTIPLE) {
        answerValue.forEach((index) => {
          const answer = answers[index];
          const categoryName = answer?.category?.name;
          const answerPoints = parseFloat(answer?.point) || 0;

          if (categoryName && demoData.byAnswerCategory[categoryName]) {
            demoData.byAnswerCategory[categoryName].points.push(answerPoints);
            demoData.byAnswerCategory[categoryName].count++;
          }
        });
      } else if (type === QUESTION_TYPES.SLIDERSINGLE) {
        const answer = answers[0];
        const categoryName = answer?.category?.name;
        const shouldReverse = answer?.reverse || false;
        const actualValue = reverseValue(answerValue, shouldReverse);

        if (categoryName && demoData.byAnswerCategory[categoryName]) {
          demoData.byAnswerCategory[categoryName].points.push(actualValue);
          demoData.byAnswerCategory[categoryName].count++;
        }
      } else if (type === QUESTION_TYPES.MATRIX) {
        Object.entries(answerValue).forEach(([rowKey, colIndex]) => {
          const answer = answers.find((a) => a.value === rowKey);
          if (answer && answer.matrix?.[colIndex]) {
            const categoryName = answer.category?.name;
            const matrixPoint = parseFloat(answer.matrix[colIndex].point) || 0;

            if (categoryName && demoData.byAnswerCategory[categoryName]) {
              demoData.byAnswerCategory[categoryName].points.push(matrixPoint);
              demoData.byAnswerCategory[categoryName].count++;
            }
          }
        });
      }

      demoData.byQuestion.push(questionResult);
    });
  });

  return demoData;
};

export const formatDemoResults = (
  demoData,
  groupByEnabled,
  aggregations = [],
  sortEnabled = false,
  sortValue = "false",
  limitEnabled = false,
  limitValue = null,
  assessmentQuestions = []
) => {
  if (!demoData) return null;

  const results = {
    raw: [],
    grouped: {},
    aggregated: {},
  };

  const groupingType = groupByEnabled?.[0] || "none";

  if (groupingType === "questionCategoryId") {
    Object.entries(demoData.byBlock).forEach(([blockName, blockData]) => {
      const allAnswerValues = [];

      blockData.answers.forEach((questionResult) => {
        const answerValue = questionResult.answerValue;
        const question = assessmentQuestions
          ?.flatMap((b) => b.questions)
          ?.find((q) => q.id === questionResult.questionId);
        const answers = question?.answers || [];
        const min = parseInt(question?.minValue) || 0;
        const max = parseInt(question?.maxValue) || 10;

        const reverseValue = (value, shouldReverse) => {
          if (!shouldReverse) return value;
          return min + max - value;
        };

        if (typeof answerValue === "object" && !Array.isArray(answerValue)) {
          Object.entries(answerValue).forEach(([idx, value]) => {
            const answer = answers[parseInt(idx)];
            const shouldReverse = answer?.reverse || false;
            const actualValue = reverseValue(value, shouldReverse);
            allAnswerValues.push(actualValue);
          });
        } else if (Array.isArray(answerValue)) {
          answerValue.forEach((idx) => {
            const answerPoints = parseFloat(answers[idx]?.point) || 0;
            allAnswerValues.push(answerPoints);
          });
        } else {
          allAnswerValues.push(questionResult.points);
        }
      });

      results.grouped[blockName] = {
        points: allAnswerValues,
        count: allAnswerValues.length,
        questionCount: blockData.answers.length,
        questions: blockData.answers,
      };
    });
  } else if (groupingType === "answerCategoryId") {
    Object.entries(demoData.byAnswerCategory).forEach(
      ([categoryName, categoryData]) => {
        if (categoryData.count > 0) {
          results.grouped[categoryName] = {
            points: categoryData.points,
            count: categoryData.count,
            questions: categoryData.questions,
          };
        }
      }
    );
  } else {
    const allPoints = demoData.byQuestion.map((q) => q.points);
    results.grouped["Нийт"] = {
      points: allPoints,
      count: allPoints.length,
      questions: demoData.byQuestion,
    };
  }

  aggregations.forEach((agg) => {
    const operation = agg.operation?.toLowerCase();

    if (!results.aggregated[operation]) {
      results.aggregated[operation] = {};
    }

    Object.entries(results.grouped).forEach(([groupName, groupData]) => {
      switch (operation) {
        case "sum":
          results.aggregated[operation][groupName] = groupData.points.reduce(
            (a, b) => a + b,
            0
          );
          break;
        case "avg":
          const sum = groupData.points.reduce((a, b) => a + b, 0);
          results.aggregated[operation][groupName] = parseFloat(
            (sum / groupData.points.length).toFixed(2)
          );
          break;
        case "count":
          results.aggregated[operation][groupName] = groupData.count;
          break;
        default:
          break;
      }
    });
  });

  // Sort but DON'T slice - keep ALL data
  if (sortEnabled) {
    aggregations.forEach((agg) => {
      const operation = agg.operation?.toLowerCase();

      if (results.aggregated[operation]) {
        let entries = Object.entries(results.aggregated[operation]);

        entries.sort((a, b) => {
          const valueA = parseFloat(a[1]);
          const valueB = parseFloat(b[1]);

          if (sortValue === "true") {
            return valueA - valueB;
          } else {
            return valueB - valueA;
          }
        });

        // Don't slice - keep all entries
        results.aggregated[operation] = Object.fromEntries(entries);
      }
    });
  }

  return results;
};

export const calculateMinMaxValues = (
  assessmentQuestions,
  groupByEnabled = [],
  groupName = null,
  aggregations
) => {
  if (!assessmentQuestions || !Array.isArray(assessmentQuestions)) {
    return { min: 0, max: 100 };
  }

  let min = 0;
  let max = 0;

  const groupingType = groupByEnabled?.[0] || "none";
  const aggregationType = aggregations?.[0]?.operation || "sum";

  let questionsToCalculate = [];

  if (groupName && groupingType === "questionCategoryId") {
    const block = assessmentQuestions.find(
      (b) => b.category?.name === groupName
    );
    questionsToCalculate = block?.questions || [];
  } else if (groupName && groupingType === "answerCategoryId") {
    let totalAnswers = 0;
    let questionsWithCategory = 0;

    assessmentQuestions.forEach((block) => {
      (block.questions || []).forEach((question) => {
        const answers = question.answers || [];
        const categoryAnswers = answers.filter(
          (a) => a.category?.name === groupName
        );

        if (categoryAnswers.length > 0) {
          questionsWithCategory++;
          const type = question.type;
          const minValue = parseInt(question.minValue) || 0;
          const maxValue = parseInt(question.maxValue) || 10;

          if (type === QUESTION_TYPES.SLIDER) {
            totalAnswers += categoryAnswers.length;
            min += categoryAnswers.length * minValue;
            max += categoryAnswers.length * maxValue;
          } else if (type === QUESTION_TYPES.SLIDERSINGLE) {
            totalAnswers += 1;
            min += minValue;
            max += maxValue;
          } else if (type === QUESTION_TYPES.CONSTANT_SUM) {
            const totalPoints = parseInt(question.point) || 0;
            const avgPerAnswer = totalPoints / answers.length;
            totalAnswers += categoryAnswers.length;
            min += 0;
            max += Math.ceil(avgPerAnswer * categoryAnswers.length);
          } else if (
            type === QUESTION_TYPES.SINGLE ||
            type === QUESTION_TYPES.TRUE_FALSE
          ) {
            totalAnswers += 1;
            const categoryPoints = categoryAnswers.map(
              (a) => parseFloat(a.point) || 0
            );
            min += 0;
            max += Math.max(...categoryPoints);
          } else if (type === QUESTION_TYPES.MULTIPLE) {
            totalAnswers += categoryAnswers.length;
            const categoryPoints = categoryAnswers.reduce(
              (sum, a) => sum + (parseFloat(a.point) || 0),
              0
            );
            min += 0;
            max += categoryPoints;
          } else if (type === QUESTION_TYPES.MATRIX) {
            categoryAnswers.forEach((answer) => {
              if (answer.matrix && answer.matrix.length > 0) {
                totalAnswers += 1;
                const matrixPoints = answer.matrix.map(
                  (m) => parseFloat(m.point) || 0
                );
                min += Math.min(...matrixPoints);
                max += Math.max(...matrixPoints);
              }
            });
          } else {
            const totalPoints = parseInt(question.point) || 0;
            const avgPerAnswer = totalPoints / answers.length;
            totalAnswers += categoryAnswers.length;
            min += 0;
            max += Math.ceil(avgPerAnswer * categoryAnswers.length);
          }
        }
      });
    });

    if (aggregationType === "avg" && totalAnswers > 0) {
      min = min / totalAnswers;
      max = max / totalAnswers;
    } else if (aggregationType === "count") {
      min = 0;
      max = questionsWithCategory;
    }

    return { min: Math.floor(min), max: Math.ceil(max) };
  } else {
    assessmentQuestions.forEach((block) => {
      questionsToCalculate.push(...(block.questions || []));
    });
  }

  let totalAnswers = 0;

  questionsToCalculate.forEach((question) => {
    const type = question.type;
    const answers = question.answers || [];
    const minValue = parseInt(question.minValue) || 0;
    const maxValue = parseInt(question.maxValue) || 10;

    switch (type) {
      case QUESTION_TYPES.SLIDERSINGLE:
        totalAnswers += 1;
        min += minValue;
        max += maxValue;
        break;

      case QUESTION_TYPES.SLIDER:
        totalAnswers += answers.length;
        min += answers.length * minValue;
        max += answers.length * maxValue;
        break;

      case QUESTION_TYPES.CONSTANT_SUM:
        const totalPoints = parseInt(question.point) || 0;
        totalAnswers += answers.length;
        min += 0;
        max += totalPoints;
        break;

      case QUESTION_TYPES.SINGLE:
      case QUESTION_TYPES.TRUE_FALSE:
        if (answers.length > 0) {
          totalAnswers += 1;
          const points = answers.map((a) => parseFloat(a.point) || 0);
          min += Math.min(...points);
          max += Math.max(...points);
        }
        break;

      case QUESTION_TYPES.MULTIPLE:
        if (answers.length > 0) {
          totalAnswers += answers.length;
          const allPoints = answers.reduce(
            (sum, a) => sum + (parseFloat(a.point) || 0),
            0
          );
          min += 0;
          max += allPoints;
        }
        break;

      case QUESTION_TYPES.MATRIX:
        answers.forEach((answer) => {
          if (answer.matrix && answer.matrix.length > 0) {
            totalAnswers += 1;
            const matrixPoints = answer.matrix.map(
              (m) => parseFloat(m.point) || 0
            );
            min += Math.min(...matrixPoints);
            max += Math.max(...matrixPoints);
          }
        });
        break;

      default:
        break;
    }
  });

  if (aggregationType === "avg" && totalAnswers > 0) {
    min = min / totalAnswers;
    max = max / totalAnswers;
  } else if (aggregationType === "count") {
    min = 0;
    max = totalAnswers;
  }

  return { min: Math.floor(min), max: Math.ceil(max) };
};

export default {
  generateDemoData,
  formatDemoResults,
  calculateMinMaxValues,
  generateQuestionDemoValue,
  calculateQuestionPoints,
  QUESTION_TYPES,
};
