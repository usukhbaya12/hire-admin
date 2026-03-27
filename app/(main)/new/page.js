import Header from "@/components/Header";
import Menu from "@/components/Menu";
import TestsPageClient from "@/components/AssessmentsNew";
import { getAssessmentsNew, getAssessmentCategory } from "@/app/api/assessment";

export default async function AssessmentPage() {
  const [assessmentsRes, categoriesRes] = await Promise.all([
    getAssessmentsNew({
      page: 1,
      limit: 10,
      sortBy: "updatedAt",
      sortDir: "DESC",
    }),
    getAssessmentCategory(),
  ]);

  const initialData = assessmentsRes?.success
    ? assessmentsRes.data
    : {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

  const categories = categoriesRes?.success ? categoriesRes.data || [] : [];

  return (
    <>
      <div className="fixed w-full top-0 z-10 bg-white">
        <Header />
      </div>

      <div className="flex">
        <div className="fixed">
          <Menu />
        </div>

        <div className="flex-grow ml-[220px]">
          <TestsPageClient
            initialData={initialData}
            initialCategories={categories}
          />
        </div>
      </div>
    </>
  );
}
