"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { handlePasswordChange } from "@/app/api/constant";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../ui/field";
import { Spinner } from "../ui/spinner";

const formSchema = z
  .object({
    oldPassword: z.string().min(1, "Одоогийн нууц үгээ оруулна уу."),
    newPassword: z
      .string()
      .min(1, "Шинэ нууц үгээ оруулна уу.")
      .min(6, "Багадаа 6 тэмдэгт оруулна уу."),
    confirmPassword: z.string().min(1, "Нууц үгээ давтан оруулна уу."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Нууц үг тохирохгүй байна.",
    path: ["confirmPassword"],
  });

const PasswordModal = ({ isOpen, onClose }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!isOpen) {
      reset();
      clearErrors();
    }
  }, [isOpen, reset, clearErrors]);

  const onSubmit = async (values) => {
    try {
      clearErrors("root");

      const requestData = JSON.stringify({
        oldPassword: values.oldPassword,
        password: values.newPassword,
      });

      const result = await handlePasswordChange(requestData);

      if (result.success) {
        toast.success("Нууц үг амжилттай солигдсон.");
        reset();
        onClose();
        return;
      }

      const message = result.message || "Алдаа гарлаа.";
      setError("root", {
        type: "server",
        message: result.message || "Алдаа гарлаа.",
      });
      toast.error(message);
    } catch (error) {
      console.error("Password change error:", error);

      const message = "Сервертэй холбогдоход алдаа гарлаа.";

      setError("root", {
        type: "server",
        message,
      });

      toast.error(message);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нууц үг солих</DialogTitle>
          <DialogDescription>Багадаа 6 тэмдэгт оруулна уу.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="oldPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password-old">
                    Одоогийн нууц үг
                  </FieldLabel>
                  <Input
                    {...field}
                    id="password-old"
                    type="password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="newPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div>
                    <FieldLabel htmlFor="password-new">Шинэ нууц үг</FieldLabel>
                  </div>

                  <Input
                    {...field}
                    id="password-new"
                    type="password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password-confirm">
                    Шинэ нууц үгээ давтах
                  </FieldLabel>
                  <Input
                    {...field}
                    id="password-confirm"
                    type="password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Буцах
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Нууц үг солих
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModal;
