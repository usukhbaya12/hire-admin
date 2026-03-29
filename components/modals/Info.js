"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { ShieldBoldDuotone, TrashBin2BoldDuotone } from "solar-icons";

const InfoModal = ({ open, onOk, onCancel, text, title }) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <TrashBin2BoldDuotone />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" onClick={onCancel}>
            Буцах
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onOk}>
            Устгах
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InfoModal;
