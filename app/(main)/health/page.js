"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Result, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Menu from "@/components/Menu";
import SystemHealth from "@/components/SystemHealth";

export default function HealthPage() {
  const { data: session, status } = useSession();

  return (
    <div className="flex">
      <div className="fixed">
        <Menu />
      </div>
      <div className="flex-grow ml-[220px]">
        {status === "loading" ? (
          <div className="flex justify-center items-center h-64">
            <Spin
              size="large"
              indicator={
                <LoadingOutlined style={{ color: "#f26522", fontSize: 32 }} spin />
              }
            />
          </div>
        ) : session?.user?.role !== 10 ? (
          <Result
            status="403"
            title="Хандах эрхгүй"
            subTitle="Энэ хэсэг зөвхөн супер админд (role=10) нээлттэй."
          />
        ) : (
          <SystemHealth />
        )}
      </div>
    </div>
  );
}
