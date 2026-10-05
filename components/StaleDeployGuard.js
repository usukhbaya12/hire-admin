"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { isStaleActionResponse } from "@/utils/staleAction";

// Admin шинээр deploy хийгдсэний дараа хуучин tab-аас Server Action дуудахад (зураг оруулах,
// хадгалах …) "An unexpected response was received from the server." гардаг — шалтгааныг
// utils/staleAction.js-ээс үз. Энд fetch-ийг зөвхөн АЖИГЛАЖ (хариуг өөрчлөхгүй), тийм хариу
// ирвэл хуудсаа дахин ачаалахыг санал болгоно. Хадгалаагүй өөрчлөлт алдагдахгүйн тулд автоматаар
// reload хийхгүй.
export default function StaleDeployGuard() {
  useEffect(() => {
    if (typeof window === "undefined" || window.__hireStaleGuard) return;
    window.__hireStaleGuard = true;
    const original = window.fetch;
    let shown = false;
    window.fetch = async (input, init) => {
      const res = await original(input, init);
      try {
        if (!shown && isStaleActionResponse(init, res)) {
          shown = true;
          toast.warning("Админы шинэ хувилбар суусан байна", {
            description:
              "Үйлдэл хийгдсэнгүй. Хуудсаа дахин ачаалаад дахин оролдоно уу (хадгалаагүй өөрчлөлтөө хуулж аваарай).",
            duration: Infinity,
            action: {
              label: "Дахин ачаалах",
              onClick: () => window.location.reload(),
            },
          });
        }
      } catch {
        // ажиглалт — ямар ч тохиолдолд хариуг саатуулахгүй
      }
      return res;
    };
  }, []);
  return null;
}
