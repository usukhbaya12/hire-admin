"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Menu from "@/components/Menu";
import Monitor from "@/components/Monitor";

// Зөвхөн super admin (role 10). Жинхэнэ хаалт нь core `/monitor/*` (403) ба
// middleware.js; энд цэс / хуудсанд харагдуулахгүй байх давхар хамгаалалт.
export default function MonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isSuper = session?.user?.role === 10;

  useEffect(() => {
    if (status === "authenticated" && !isSuper) router.replace("/");
  }, [status, isSuper, router]);

  return (
    <div className="flex">
      <div className="fixed">
        <Menu />
      </div>
      <div className="flex-grow ml-[220px]">{isSuper ? <Monitor /> : null}</div>
    </div>
  );
}
