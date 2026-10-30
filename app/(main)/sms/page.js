"use client";

import React from "react";
import Menu from "@/components/Menu";
import BulkSms from "@/components/BulkSms";

export default function SmsPage() {
  return (
    <>
      <div className="flex">
        <div className="fixed">
          <Menu />
        </div>
        <div className="flex-grow ml-[220px]">
          <BulkSms />
        </div>
      </div>
    </>
  );
}
