"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin } from "antd";
import Preview from "@/components/Preview";
import { getAssessmentById } from "@/app/api/assessment";
import { getQuestionsByAssessmentId } from "@/app/api/assessment";
import LoadingSpinner from "@/components/Loading";

export default function PreviewPage() {
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = params.id;
        if (!id) return;

        setLoading(true);

        const assessmentResponse = await getAssessmentById(id);
        if (assessmentResponse.success) {
          setAssessmentData(assessmentResponse.data);
        }

        const questionsResponse = await getQuestionsByAssessmentId(id);
        if (questionsResponse.success && questionsResponse.data) {
          const transformedBlocks = questionsResponse.data.map((block) => ({
            id: block.category.id,
            name: block.category.name,
            order: block.category.orderNumber,
            value: block.category.value || "",
            hasQuestion: !!block.category.value,
            duration: block.category.duration,
            questions: block.questions.map((question) => ({
              id: question.id,
              order: question.orderNumber,
              type: question.type,
              question: {
                name: question.name,
                minValue: question.minValue,
                maxValue: question.maxValue,
                orderNumber: question.orderNumber,
                point: question.point,
                required: question.required,
                file: question.file,
                slider: question.slider,
                settings: question.settings || null,
              },
              answers: question.answers.map((answer) => ({
                answer: {
                  id: answer.id,
                  value: answer.value,
                  point: answer.point || 0,
                  orderNumber: answer.orderNumber,
                  category: answer.category || null,
                  correct: answer.correct || false,
                  file: answer.file || null,
                },
                ...(answer.matrix && {
                  matrix: answer.matrix.map((item) => ({
                    id: item.id,
                    value: item.value,
                    point: item.point,
                    category: item.category || null,
                    orderNumber: item.orderNumber,
                  })),
                }),
              })),
            })),
          }));

          setBlocks(transformedBlocks);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div>
        <Preview assessmentData={assessmentData} blocks={blocks} />
      </div>
    </>
  );
}
