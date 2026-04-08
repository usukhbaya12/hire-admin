"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createNewCategory } from "@/app/api/assessment";
import { PlusIcon } from "../Icons";
import { PenLineDuotone, TagLineDuotone } from "solar-icons";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "../ui/field";
import { Spinner } from "../ui/spinner";

const ASSESSMENT_TYPE = {
  TEST: 10,
  SURVEY: 20,
};

const NewAssessment = ({
  isModalOpen,
  assessmentCategories = [],
  handleOk,
  handleCancel,
  onCategoryCreate,
}) => {
  const form = useForm({
    defaultValues: {
      testName: "",
      category: "",
      assessmentType: String(ASSESSMENT_TYPE.SURVEY),
      answerCategoriesInput: "",
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = form;

  const [isEditing, setIsEditing] = useState(false);
  const [isCategorySwitchOn, setCategorySwitchOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedMainCategoryId, setSelectedMainCategoryId] =
    useState(undefined);

  const [isMainCategoryDialogOpen, setIsMainCategoryDialogOpen] =
    useState(false);
  const [isSubCategoryDialogOpen, setIsSubCategoryDialogOpen] = useState(false);

  const [newMainCategoryName, setNewMainCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [creatingMainCategory, setCreatingMainCategory] = useState(false);
  const [creatingSubCategory, setCreatingSubCategory] = useState(false);

  const testName = watch("testName");
  const assessmentType = Number(watch("assessmentType"));
  const category = watch("category");
  const answerCategoriesInput = watch("answerCategoriesInput");

  useEffect(() => {
    if (isModalOpen) {
      reset({
        testName: "",
        category: "",
        assessmentType: String(ASSESSMENT_TYPE.SURVEY),
        answerCategoriesInput: "",
      });
      setIsEditing(false);
      setCategorySwitchOn(false);
      setSelectedMainCategoryId(undefined);
      setIsSubmitting(false);
      setIsMainCategoryDialogOpen(false);
      setIsSubCategoryDialogOpen(false);
      setNewMainCategoryName("");
      setNewSubCategoryName("");
      clearErrors();
    }
  }, [isModalOpen, reset, clearErrors]);

  useEffect(() => {
    if (assessmentType === ASSESSMENT_TYPE.TEST) {
      setCategorySwitchOn(false);
      setValue("answerCategoriesInput", "");
      clearErrors("answerCategoriesInput");
    }
  }, [assessmentType, setValue, clearErrors]);

  const handleEditClick = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => setIsEditing(false), []);

  const answerCategoriesArray = useMemo(() => {
    if (!isCategorySwitchOn || !answerCategoriesInput?.trim()) return [];

    return answerCategoriesInput
      .split(";")
      .map((categoryName) => categoryName.trim())
      .filter(Boolean);
  }, [isCategorySwitchOn, answerCategoriesInput]);

  const mainCategoryOptions = useMemo(() => {
    return assessmentCategories
      .filter((cate) => cate.parent == null)
      .map((cate) => ({
        label: cate.name,
        value: String(cate.id),
      }));
  }, [assessmentCategories]);

  const subCategoryOptions = useMemo(() => {
    if (!selectedMainCategoryId) return [];

    return assessmentCategories
      .filter((cate) => cate.parent?.id === selectedMainCategoryId)
      .map((cate) => ({
        label: cate.name,
        value: String(cate.id),
      }));
  }, [assessmentCategories, selectedMainCategoryId]);

  const validateBeforeSubmit = useCallback(
    (values) => {
      let hasError = false;

      if (!values.testName?.trim()) {
        setError("testName", {
          type: "required",
          message: "Тестийн нэр оруулна уу.",
        });
        hasError = true;
      }

      if (!values.category) {
        setError("category", {
          type: "required",
          message: "Тестийн ангилал сонгоно уу.",
        });
        hasError = true;
      }

      if (!values.assessmentType) {
        setError("assessmentType", {
          type: "required",
          message: "Тестийн төрөл сонгоно уу.",
        });
        hasError = true;
      }

      if (isCategorySwitchOn && !values.answerCategoriesInput?.trim()) {
        setError("answerCategoriesInput", {
          type: "required",
          message: "Хариултын ангиллуудыг оруулна уу.",
        });
        hasError = true;
      }

      return !hasError;
    },
    [isCategorySwitchOn, setError],
  );

  const handleCreateMainCategory = useCallback(async () => {
    if (!newMainCategoryName.trim()) {
      toast.error("Ангиллын нэр оруулна уу.");
      return;
    }

    setCreatingMainCategory(true);

    try {
      const response = await createNewCategory({
        name: newMainCategoryName.trim(),
        parent: null,
      });

      if (response.success) {
        const newCategoryId = response.data;
        toast.success("Ангилал үүссэн.");

        if (onCategoryCreate) {
          await onCategoryCreate();
        }

        setSelectedMainCategoryId(newCategoryId);
        setValue("category", String(newCategoryId));
        clearErrors("category");
        setNewMainCategoryName("");
        setIsMainCategoryDialogOpen(false);
      } else {
        toast.error(response.message || "Алдаа гарлаа.");
      }
    } catch (error) {
      console.error("Create main category error:", error);
      toast.error("Серверт холбогдоход алдаа гарлаа.");
    } finally {
      setCreatingMainCategory(false);
    }
  }, [newMainCategoryName, onCategoryCreate, setValue, clearErrors]);

  const handleCreateSubCategory = useCallback(async () => {
    if (!newSubCategoryName.trim()) {
      toast.error("Ангиллын нэр оруулна уу.");
      return;
    }

    if (!selectedMainCategoryId) {
      toast.error("Эхлээд үндсэн ангилал сонгоно уу.");
      return;
    }

    setCreatingSubCategory(true);

    try {
      const response = await createNewCategory({
        name: newSubCategoryName.trim(),
        parent: selectedMainCategoryId,
      });

      if (response.success) {
        const newCategoryId = response.data;
        toast.success("Ангилал үүссэн.");

        if (onCategoryCreate) {
          await onCategoryCreate();
        }

        setValue("category", String(newCategoryId));
        clearErrors("category");
        setNewSubCategoryName("");
        setIsSubCategoryDialogOpen(false);
      } else {
        toast.error(response.message || "Алдаа гарлаа.");
      }
    } catch (error) {
      console.error("Create sub category error:", error);
      toast.error("Серверт холбогдоход алдаа гарлаа.");
    } finally {
      setCreatingSubCategory(false);
    }
  }, [
    newSubCategoryName,
    selectedMainCategoryId,
    onCategoryCreate,
    setValue,
    clearErrors,
  ]);

  const onSubmit = useCallback(
    async (values) => {
      if (!validateBeforeSubmit(values)) return;

      setIsSubmitting(true);

      try {
        const formData = {
          testName: values.testName,
          hasAnswerCategory: isCategorySwitchOn,
          categories: answerCategoriesArray,
          type: Number(values.assessmentType),
          assessmentCategory: Number(values.category),
        };

        await handleOk(formData);
      } catch (error) {
        console.error("Validation Failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateBeforeSubmit, isCategorySwitchOn, answerCategoriesArray, handleOk],
  );

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Шинээр тест үүсгэх</DialogTitle>
          <DialogDescription>
            Тест үүсгэсний дараа хариултын ангилал нэмэх боломжгүй.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="testName"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  {/* <FieldLabel>Тестийн нэр</FieldLabel> */}
                  {isEditing ? (
                    <input
                      className="outline-none py-[2.5px] w-full"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={() => {
                        handleBlur();
                        field.onBlur();
                      }}
                      autoFocus
                      style={{ fontWeight: "bold", fontSize: "18px" }}
                    />
                  ) : (
                    <div
                      className="cursor-pointer font-bold text-[18px] hover:bg-neutral flex items-center gap-1.5 leading-6 py-1 border-b border-neutral w-fit"
                      onClick={handleEditClick}
                    >
                      {field.value || "Тестийн нэр"}
                      <PenLineDuotone
                        width={16}
                        className="text-main min-w-[14px]"
                      />
                    </div>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Тестийн ангилал сонгох</FieldLabel>

                  <div className="flex gap-4 w-full">
                    <div className="w-1/2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={
                            selectedMainCategoryId
                              ? String(selectedMainCategoryId)
                              : undefined
                          }
                          onValueChange={(value) => {
                            const id = Number(value);
                            setSelectedMainCategoryId(id);
                            field.onChange(value);
                            clearErrors("category");
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Үндсэн ангилал" />
                          </SelectTrigger>
                          <SelectContent>
                            {mainCategoryOptions.map((item, index) => (
                              <SelectItem
                                key={item.value + index}
                                value={item.value}
                              >
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Dialog
                          open={isMainCategoryDialogOpen}
                          onOpenChange={setIsMainCategoryDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button type="button" variant="" size="icon">
                              <PlusIcon width={16} height={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Үндсэн ангилал нэмэх</DialogTitle>
                              <DialogDescription>
                                Кирилээр бичнэ үү.
                              </DialogDescription>
                            </DialogHeader>

                            <Input
                              id="new-main-category"
                              value={newMainCategoryName}
                              onChange={(e) =>
                                setNewMainCategoryName(e.target.value)
                              }
                              placeholder="Ангиллын нэр"
                            />

                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsMainCategoryDialogOpen(false);
                                  setNewMainCategoryName("");
                                }}
                              >
                                Буцах
                              </Button>
                              <Button
                                type="button"
                                onClick={handleCreateMainCategory}
                                disabled={creatingMainCategory}
                              >
                                {creatingMainCategory && (
                                  <Spinner data-icon="inline-start" />
                                )}
                                Нэмэх
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="w-1/2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={
                            subCategoryOptions.some(
                              (item) => item.value === field.value,
                            )
                              ? field.value
                              : undefined
                          }
                          onValueChange={(value) => {
                            field.onChange(value);
                            clearErrors("category");
                          }}
                          disabled={!selectedMainCategoryId}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Дэд ангилал" />
                          </SelectTrigger>
                          <SelectContent>
                            {subCategoryOptions.map((item, index) => (
                              <SelectItem
                                key={item.value + index}
                                value={item.value}
                              >
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Dialog
                          open={isSubCategoryDialogOpen}
                          onOpenChange={setIsSubCategoryDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant=""
                              size="icon"
                              disabled={!selectedMainCategoryId}
                            >
                              <PlusIcon width={16} height={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Дэд ангилал нэмэх</DialogTitle>
                              <DialogDescription>
                                Кирилээр бичнэ үү.
                              </DialogDescription>
                            </DialogHeader>

                            <Input
                              id="new-sub-category"
                              value={newSubCategoryName}
                              onChange={(e) =>
                                setNewSubCategoryName(e.target.value)
                              }
                              placeholder="Ангиллын нэр"
                            />

                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsSubCategoryDialogOpen(false);
                                  setNewSubCategoryName("");
                                }}
                              >
                                Буцах
                              </Button>
                              <Button
                                type="button"
                                onClick={handleCreateSubCategory}
                                disabled={creatingSubCategory}
                              >
                                {creatingSubCategory && (
                                  <Spinner data-icon="inline-start" />
                                )}
                                Нэмэх
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Separator />

            <Controller
              name="assessmentType"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Тестийн төрөл сонгох</FieldLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      clearErrors("assessmentType");
                    }}
                  >
                    <div className="flex gap-4">
                      <FieldLabel htmlFor="assessmentType-survey">
                        <Field orientation="horizontal">
                          <FieldContent>
                            <FieldTitle>Үнэлгээ</FieldTitle>
                            <FieldDescription>
                              Зан төлөвийн тест, өөрийн үнэлгээ
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value={String(ASSESSMENT_TYPE.SURVEY)}
                            id="assessmentType-survey"
                          />
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor="assessmentType-test">
                        <Field orientation="horizontal">
                          <FieldContent>
                            <FieldTitle>Зөв хариулттай</FieldTitle>
                            <FieldDescription>
                              Зөв хариулт сонгож, оноо авах тест
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value={String(ASSESSMENT_TYPE.TEST)}
                            id="assessmentType-test"
                          />
                        </Field>
                      </FieldLabel>
                    </div>
                  </RadioGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Separator />

            <div className="gap-2 flex items-center">
              <Switch
                checked={isCategorySwitchOn}
                onCheckedChange={(checked) => {
                  setCategorySwitchOn(checked);
                  if (!checked) {
                    setValue("answerCategoriesInput", "");
                    clearErrors("answerCategoriesInput");
                  }
                }}
                disabled={assessmentType === ASSESSMENT_TYPE.TEST}
              />
              <div>Хариулт нь ангилалтай байх уу?</div>
            </div>

            {isCategorySwitchOn && (
              <Controller
                name="answerCategoriesInput"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Хариултын ангиллууд</FieldLabel>
                    <Input
                      {...field}
                      placeholder="Цэгтэй таслалаар хязгаарлан оруулна уу. Жишээ нь: D;I;S;C"
                      className="category"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}

                    {answerCategoriesArray.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {answerCategoriesArray.map((categoryName, index) => (
                          <div
                            key={index}
                            className="bg-blue-100 px-2.5 py-0.5 gap-2 rounded-md text-sm font-semibold flex items-center text-blue-800"
                          >
                            <TagLineDuotone
                              width={14}
                              className="text-blue-800 min-w-[14px]"
                            />
                            {categoryName}
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                )}
              />
            )}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Буцах
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Үүсгэх
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAssessment;
