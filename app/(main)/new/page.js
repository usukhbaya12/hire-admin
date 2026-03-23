import React from "react";
import Menu from "@/components/Menu";
import Assessments from "@/components/Assessments";

import {
  getAssessments,
  getAssessmentsNew,
  getAssessmentCategory,
} from "@/app/api/assessment";
import Header from "@/components/Header";

export default async function Home() {
  const assessmentsRes = await getAssessmentsNew();
  const categoriesRes = await getAssessmentCategory();

  const assessments = assessmentsRes.data?.data || [];
  const categories = categoriesRes.data || [];

  return (
    <>
      <div className="fixed w-full top-0 z-10 bg-white">
        <Header />
      </div>
      <div className="flex mt-[63px]">
        <div className="fixed">
          <Menu />
        </div>
        <div className="flex-grow ml-[220px]">
          <Assessments
            initialAssessments={assessments}
            initialCategories={categories}
          />
        </div>
      </div>
    </>
  );
}
