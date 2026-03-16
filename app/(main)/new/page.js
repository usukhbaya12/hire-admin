import React from "react";
import Menu from "@/components/Menu";

import { getAssessmentsNew, getAssessmentCategory } from "@/app/api/assessment";
import Header from "@/components/Header";
import AssessmentsNew from "@/components/AssessmentsNew";

export default async function Home() {
  const assessmentsRes = await getAssessmentsNew();
  const categoriesRes = await getAssessmentCategory();

  const assessments = assessmentsRes.data || [];
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
          <AssessmentsNew
            initialAssessments={assessments}
            initialCategories={categories}
          />
        </div>
      </div>
    </>
  );
}
