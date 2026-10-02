"use client";

import { Toaster as Sonner } from "sonner";
import {
  InfoIcon,
  TriangleAlertIcon,
  Loader2Icon,
} from "lucide-react";
import { CheckCircleBoldDuotone, CloseCircleBoldDuotone } from "solar-icons";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CheckCircleBoldDuotone className="text-green-500" width={18} />
        ),
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <CloseCircleBoldDuotone className="text-red-500" width={18} />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast text-base!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
