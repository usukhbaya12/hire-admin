"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { ShieldBoldDuotone } from "solar-icons";

const OkModal = ({ open, onOk, text, title = "Мэдэгдэл" }) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-main/10 text-main">
            <ShieldBoldDuotone />
          </AlertDialogMedia>

          <AlertDialogTitle>{title}</AlertDialogTitle>

          <AlertDialogDescription>{text}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter single>
          <AlertDialogAction onClick={onOk}>Ойлголоо</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OkModal;
