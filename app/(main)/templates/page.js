"use client";

import React from "react";
import Menu from "@/components/Menu";
import MessageDrafts from "@/components/MessageDrafts";

export default function TemplatesPage() {
  return (
    <>
      <div className="flex">
        <div className="fixed">
          <Menu />
        </div>
        <div className="flex-grow ml-[220px]">
          <MessageDrafts />
        </div>
      </div>
    </>
  );
}
