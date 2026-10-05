"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Menu from "@/components/Menu";
import Cleanup from "@/components/Cleanup";

// Зөвхөн super admin (role 10). Жинхэнэ хаалт нь core `/ops/*` (OpsGuard) ба middleware.js.
export default function CleanupPage() {
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
      <div className="flex-grow ml-[220px]">{isSuper ? <Cleanup /> : null}</div>
    </div>
  );
}
