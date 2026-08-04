"use client";

import React from "react";
import Menu from "@/components/Menu";
import ResultsNew from "@/components/Results";

export default function ResultsPage() {
  return (
    <>
      <div className="flex">
        <div className="fixed">
          <Menu />
        </div>
        <div className="flex-grow ml-[220px]">
          <ResultsNew />
        </div>
      </div>
    </>
  );
}
