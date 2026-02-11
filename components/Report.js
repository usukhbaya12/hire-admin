"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  message,
  Form,
  Switch,
  Select,
  Button,
  InputNumber,
  Card,
  Divider,
  Input,
  Upload,
  Radio,
} from "antd";
import { PlusIcon, DropdownIcon, MenuIcon } from "./Icons";
import { updateAssessmentById } from "@/app/api/assessment";
import {
  createNewFormula,
  getFormula,
  imageUploader,
} from "@/app/api/constant";
import FormulaExample from "./Formula";
import {
  CalculatorBoldDuotone,
  DatabaseBoldDuotone,
  FilterBoldDuotone,
  SettingsBoldDuotone,
  TagLineDuotone,
  TrashBin2BoldDuotone,
} from "solar-icons";
import { InboxOutlined } from "@ant-design/icons";
import { api } from "@/utils/routes";
import ResultConfiguration from "./Interval";
import { formatDemoResults, generateDemoData } from "./Demo";
const { Dragger } = Upload;

const Report = ({
  assessmentData,
  onUpdateAssessment,
  assessmentQuestions,
}) => {
  const [selected, setSelected] = useState("formula");
  const [form] = Form.useForm();
  const [aggregations, setAggregations] = useState([
    { field: "point", operation: "sum" },
  ]);
  const [filters, setFilters] = useState([{ field: "correct", value: true }]);
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitValue, setLimitValue] = useState(2);
  const [groupByEnabled, setGroupByEnabled] = useState([]);
  const [orderEnabled, setOrderEnabled] = useState(false);
  const [orderValue, setOrderValue] = useState("point");
  const [sortEnabled, setSortEnabled] = useState(false);
  const [sortValue, setSortValue] = useState("true");
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState(
    assessmentData?.data?.report || null,
  );
  const [hasFormula, setHasFormula] = useState(!!assessmentData?.data?.formule);
  const [resultConfig, setResultConfig] = useState(null);
  const [hasReport, setHasReport] = useState(
    !!assessmentData?.data?.exampleReport,
  );

  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    const fetchFormulaData = async () => {
      if (assessmentData?.data?.formule) {
        setHasFormula(true);
        setLoading(true);
        try {
          const response = await getFormula(assessmentData.data.formule);

          if (response.success && response.data) {
            if (
              response.data.aggregations &&
              response.data.aggregations.length > 0
            ) {
              setAggregations(
                response.data.aggregations.map((agg) => ({
                  field: agg.field,
                  operation: agg.operation.toLowerCase(),
                })),
              );
            } else {
              setAggregations([{ field: "point", operation: "sum" }]);
            }

            const filterEntries = Object.entries(response.data.filters);
            if (filterEntries.length > 0) {
              setFilters(
                filterEntries.map(([field, value]) => ({
                  field,
                  value,
                })),
              );
            } else {
              setFilters([]);
            }

            setLimitEnabled(!!response.data.limit);
            if (response.data.limit) setLimitValue(response.data.limit);

            setGroupByEnabled(response.data.groupBy);

            setOrderEnabled(!!response.data.order);
            if (response.data.order) setOrderValue(response.data.order);

            setSortEnabled(response.data.sort === true);
            setSortValue(response.data.sort === true ? "true" : "false");
          }
        } catch (error) {
          messageApi.error("Томьёоны мэдээлэл татаж чадсангүй.");
        } finally {
          setLoading(false);
        }
      } else {
        setHasFormula(false);
      }
    };

    fetchFormulaData();
  }, [assessmentData?.data?.formule]);

  useEffect(() => {
    setReportType(assessmentData?.data?.report || null);
  }, [assessmentData?.data?.report]);

  const demoData = useMemo(() => {
    const answerCategories = assessmentData?.data?.answerCategories || [];
    return generateDemoData(assessmentQuestions, answerCategories);
  }, [assessmentQuestions, assessmentData?.data?.answerCategories]);

  const formattedResults = useMemo(() => {
    if (!demoData) return null;
    return formatDemoResults(
      demoData,
      groupByEnabled,
      aggregations,
      sortEnabled,
      sortValue,
      limitEnabled,
      limitValue,
      assessmentQuestions,
    );
  }, [
    demoData,
    groupByEnabled,
    aggregations,
    sortEnabled,
    sortValue,
    limitEnabled,
    limitValue,
    assessmentQuestions,
  ]);

  console.log("for", formattedResults);

  const fieldOptions = [{ value: "point", label: "Оноо" }];
  const filterFieldOptions = [{ value: "correct", label: "Зөв хариулт" }];
  const filterValueOptions = [
    { value: true, label: "Тийм" },
    { value: false, label: "Үгүй" },
  ];
  const sortOptions = [
    { value: "true", label: "Өсөхөөр" },
    { value: "false", label: "Буурахаар" },
  ];
  const operationOptions = [
    { value: "sum", label: "Нийлбэр (sum)" },
    { value: "avg", label: "Дундаж (avg)" },
    { value: "count", label: "Тоолох (count)" },
  ];

  const addAggregation = () => {
    if (aggregations.length === 0) {
      setAggregations([{ field: "point", operation: "sum" }]);
    }
  };

  const removeAggregation = () => {
    setAggregations([]);
  };

  const handleFieldChange = (value, index) => {
    const newAggregations = [...aggregations];
    newAggregations[index].field = value;
    setAggregations(newAggregations);
  };

  const handleOperationChange = (value, index) => {
    const newAggregations = [...aggregations];
    newAggregations[index].operation = value;
    setAggregations(newAggregations);
  };

  const addFilter = () => {
    if (filters.length === 0) {
      setFilters([{ field: "correct", value: true }]);
    }
  };

  const removeFilter = () => {
    setFilters([]);
  };

  const handleFilterFieldChange = (value, index) => {
    const newFilters = [...filters];
    newFilters[index].field = value;
    setFilters(newFilters);
  };

  const handleFilterValueChange = (value, index) => {
    const newFilters = [...filters];
    newFilters[index].value = value;
    setFilters(newFilters);
  };

  const handleChange = async (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    setFileList(newFileList);

    if (info.file.status === "uploading") {
      setUploading(true);
      return;
    }

    if (info.file.status === "done") {
      try {
        if (!info.file.originFileObj) {
          throw new Error("No file found");
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (info.file.originFileObj.size > maxSize) {
          messageApi.error("Файлын хэмжээ 10MB-аас их байна.");
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("files", info.file.originFileObj);

        const res = await imageUploader(formData);

        if (res === false) {
          throw new Error("Upload failed on server");
        }

        if (res && Array.isArray(res) && res.length > 0) {
          const uploadedFile = res[0]; // First uploaded file

          if (assessmentData?.data?.id) {
            onUpdateAssessment({
              ...assessmentData,
              data: {
                ...assessmentData.data,
                exampleReport: uploadedFile, // Use the uploaded file object
              },
            });
            messageApi.success("Файл уншсан. Хадгалах товч дарна уу.");
          }
        } else if (res && res.length === 0) {
          throw new Error("No files were uploaded");
        } else {
          throw new Error("Invalid upload response format");
        }
      } catch (error) {
        console.error("Upload error:", error);
        messageApi.error(`Файл оруулахад алдаа гарлаа: ${error.message}`);
      } finally {
        setUploading(false);
      }
    }

    if (info.file.status === "error") {
      messageApi.error("Файл оруулахад алдаа гарлаа.");
      setUploading(false);
    }
  };

  const handleRemove = async (file) => {
    try {
      if (assessmentData?.data?.id) {
        const updateResponse = await updateAssessmentById(
          assessmentData.data.id,
          {
            exampleReport: null,
          },
        );

        if (updateResponse?.success) {
          setHasReport(false);

          onUpdateAssessment({
            ...assessmentData,
            data: {
              ...assessmentData.data,
              exampleReport: null,
            },
          });

          messageApi.success("Устсан. Хадгалах товч дарна уу.");
        } else {
          throw new Error("Failed to update assessment");
        }
      } else {
        setHasReport(false);
      }

      setFileList([]);
    } catch (error) {
      console.error("Remove error:", error);
      messageApi.error("Файл устгахад алдаа гарлаа.");
    }
  };

  useEffect(() => {
    if (assessmentData?.data?.exampleReport) {
      setHasReport(true);
      setFileList([
        {
          uid: "-1",
          name: assessmentData.data.exampleReport,
          status: "done",
          url: `${api}file/${assessmentData.data.exampleReport}`,
        },
      ]);
    } else {
      setHasReport(false);
      setFileList([]);
    }
  }, [assessmentData?.data?.exampleReport]);

  const beforeUpload = (file) => {
    const isPdf = file.type === "application/pdf";
    if (!isPdf) {
      messageApi.error("Зөвхөн PDF файл сонгоно уу.");
    }
    return isPdf || Upload.LIST_IGNORE;
  };

  const reportMapping = [
    { label: "Зөв хариулттай", value: 10 },
    { label: "DiSC", value: 20 },
    { label: "Белбин", value: 40 },
    { label: "MBTI", value: 30 },
    { label: "Genos", value: 50 },
    { label: "Нарциссистик", value: 60 },
    { label: "Сэтгэл гутрал", value: 70 },
    { label: "Эмпатик", value: 80 },
    { label: "Хар гурвал", value: 90 },
    { label: "Холланд", value: 100 },
    { label: "Burnout", value: 110 },
    { label: "Үндсэн 5", value: 120 },
    { label: "Үл ойлголцол", value: 130 },
    { label: "WHOQOL", value: 140 },
    { label: "HADS", value: 150 },
    { label: "CFS", value: 160 },
    { label: "BOS", value: 170 },
    { label: "PSI", value: 180 },
    { label: "Оффисын улс төр", value: 190 },
    { label: "Ёс зүй", value: 200 },
    { label: "Зохисгүй ажлын байр", value: 210 },
    { label: "Grit", value: 220 },
    { label: "Work-life balance", value: 230 },
    { label: "Сэтгэл түгшилт", value: 240 },
    { label: "Work stress", value: 250 },
    { label: "Mindset", value: 260 },
    { label: "Жирэмсэн", value: 270 },
    { label: "WHO-5", value: 280 },
    { label: "RSES", value: 290 },
    { label: "СЭМҮТ", value: 300 },
  ];

  const handleReportTypeChange = (value) => {
    setReportType(value);
  };

  const saveFormula = async () => {
    if (!reportType) {
      messageApi.error("Тайлангийн төрөл сонгоно уу.");
      return;
    }

    const formulaData = {
      name: assessmentData?.data?.name,
      formula: "string",
      variables: [],
      groupBy: groupByEnabled,
      aggregations: aggregations.map((agg) => ({
        field: agg.field,
        operation: agg.operation?.toUpperCase(),
      })),
      filters:
        assessmentData?.data?.type === 10
          ? filters.reduce((acc, filter) => {
              if (filter.field && filter.value !== undefined) {
                acc[filter.field] = filter.value;
              }
              return acc;
            }, {})
          : {},
      limit: limitEnabled ? limitValue : null,
      sort: sortEnabled ? sortValue === "true" : false,
      ...(orderEnabled && { order: orderValue }),
    };
    setLoading(true);
    try {
      const response = await createNewFormula(JSON.stringify(formulaData));

      if (response.success) {
        setHasFormula(true);

        if (assessmentData?.data?.id) {
          try {
            const updateResponse = await updateAssessmentById(
              assessmentData.data.id,
              {
                formule: response.data,
                report: reportType,
              },
            );

            if (updateResponse?.success) {
              messageApi.success("Томьёо амжилттай хадгалагдлаа.");

              onUpdateAssessment({
                ...assessmentData,
                data: {
                  ...assessmentData.data,
                  formule: response.data,
                  report: reportType,
                },
              });
            } else {
              messageApi.warning(
                "Томьёо үүссэн боловч хадгалахад алдаа гарлаа.",
              );
            }
          } catch (error) {
            console.error("Error saving to assessment:", error);
            messageApi.warning("Томьёо үүссэн боловч хадгалахад алдаа гарлаа.");
          }
        } else {
          messageApi.success("Томьёо амжилттай хадгалагдлаа.");

          onUpdateAssessment({
            ...assessmentData,
            data: {
              ...assessmentData.data,
              formule: response.data,
              report: reportType,
            },
          });
        }
      } else {
        messageApi.error(response.message || "Томьёо хадгалахад алдаа гарлаа.");
      }
    } catch (error) {
      console.error("Error in saveFormula:", error);
      messageApi.error("Томьёо хадгалахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  const showLimit = () => {
    if (!formattedResults?.aggregated) return false;

    const operation = Object.keys(formattedResults.aggregated)[0];
    if (!operation) return false;

    const values = formattedResults.aggregated[operation];
    const resultCount = Object.keys(values).length;

    // Only show if there are 2 or more results
    return resultCount > 1;
  };

  return (
    <div className="mt-[47px]">
      {contextHolder}
      <div className="border-r border-neutral py-3 w-1/5 fixed h-screen">
        <div className="px-8 font-extrabold text-menu flex items-center gap-2 mt-1 text-[#6a6d70] pb-3 border-b border-neutral">
          <SettingsBoldDuotone width={16} />
          Тооцоолол
        </div>
        <div
          onClick={() => setSelected("formula")}
          className={`px-8 py-3 hover:bg-gray-100 cursor-pointer ${
            selected === "formula" ? "bg-gray-100" : ""
          }`}
        >
          <div className="font-bold">Тестийн үр дүн бодох</div>
          <div className="text-[13px] pb-0.5">
            Үр дүн тооцоолох аргачлал тохируулах
          </div>
        </div>
        <div
          onClick={() => setSelected("example")}
          className={`px-8 py-3 hover:bg-gray-100 cursor-pointer ${
            selected === "example" ? "bg-gray-100" : ""
          }`}
        >
          <div className="font-bold">
            {assessmentData.data?.type === 10
              ? "Онооны тайлбар"
              : "Жишиг тайлан"}
          </div>
          <div className="text-[13px] pb-0.5">
            {assessmentData.data?.type === 10
              ? "Онооны тайлбар оруулах"
              : "Жишиг тайлан оруулах"}
          </div>
        </div>
      </div>

      <div className="ml-[20%]">
        <div className="p-6 px-7">
          <Form form={form}>
            <div className={selected === "formula" ? "" : "hidden"}>
              <div className="mb-4">
                <div className="font-bold text-xl rounded-md">
                  {assessmentData?.data?.name}
                </div>
                <div
                  className={`${
                    hasFormula ? "text-green-600" : "text-orange-500"
                  } font-bold`}
                >
                  {hasFormula
                    ? "Томьёо хадгалсан байна."
                    : "Томьёо хадгалаагүй байна."}
                </div>
                {assessmentData?.data?.answerCategories?.length > 0 && (
                  <div className="mt-4 pb-2! flex flex-wrap gap-2">
                    {assessmentData?.data?.answerCategories.map(
                      (category, index) => (
                        <div
                          key={index}
                          className="bg-blue-100 px-2.5 py-0.5 gap-2 rounded-full text-sm font-semibold flex items-center text-blue-800"
                        >
                          <TagLineDuotone width={14} />
                          {category.name}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-13 gap-6">
                <div className="space-y-5! col-span-4">
                  {(assessmentData?.data?.answerCategories?.length > 0 ||
                    assessmentData?.questionCategories?.length > 0) && (
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <MenuIcon width={15} />
                          <span>Бүлэглэлт</span>
                        </div>
                      }
                    >
                      {assessmentData?.data?.answerCategories?.length > 0 && (
                        <div className="flex items-center gap-2 mb-6">
                          <Switch
                            size="small"
                            checked={groupByEnabled.includes(
                              "answerCategoryId",
                            )}
                            disabled={groupByEnabled.includes(
                              "questionCategoryId",
                            )}
                            onChange={(checked) => {
                              setGroupByEnabled((prev) => {
                                if (checked) {
                                  return prev.includes("answerCategoryId")
                                    ? prev
                                    : [...prev, "answerCategoryId"];
                                } else {
                                  return prev.filter(
                                    (g) => g !== "answerCategoryId",
                                  );
                                }
                              });
                            }}
                          />
                          <span>Хариултын ангиллаар нь бүлэглэх</span>
                        </div>
                      )}
                      {assessmentData?.questionCategories?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Switch
                            size="small"
                            checked={groupByEnabled.includes(
                              "questionCategoryId",
                            )}
                            disabled={groupByEnabled.includes(
                              "answerCategoryId",
                            )}
                            onChange={(checked) => {
                              setGroupByEnabled((prev) => {
                                if (checked) {
                                  return prev.includes("questionCategoryId")
                                    ? prev
                                    : [...prev, "questionCategoryId"];
                                } else {
                                  return prev.filter(
                                    (g) => g !== "questionCategoryId",
                                  );
                                }
                              });
                            }}
                          />
                          <span>Асуултын ангиллаар нь бүлэглэх</span>
                        </div>
                      )}
                    </Card>
                  )}
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <CalculatorBoldDuotone width={17} />
                        <span>Тооцоолол</span>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      {aggregations.length > 0 ? (
                        aggregations.map((agg, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <Select
                              suffixIcon={
                                <DropdownIcon width={15} height={15} />
                              }
                              placeholder="Оноо"
                              value={agg.field}
                              onChange={(value) =>
                                handleFieldChange(value, index)
                              }
                              className="w-full"
                              options={fieldOptions}
                            />
                            <Select
                              suffixIcon={
                                <DropdownIcon width={15} height={15} />
                              }
                              placeholder="Үйлдэл"
                              value={agg.operation}
                              onChange={(value) =>
                                handleOperationChange(value, index)
                              }
                              className="w-full"
                              options={operationOptions}
                            />
                            <Button
                              type="text"
                              onClick={removeAggregation}
                              icon={<TrashBin2BoldDuotone width={18} />}
                              className="text-red-500! rounded-full! px-2! mt-1!"
                            />
                          </div>
                        ))
                      ) : (
                        <Button
                          onClick={addAggregation}
                          icon={<PlusIcon width={16} color="#000" />}
                          className="back-btn w-full"
                        >
                          Тооцоолол нэмэх
                        </Button>
                      )}
                    </div>
                  </Card>
                  {showLimit() && (
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <DatabaseBoldDuotone width={17} />
                          <span>Дараалал</span>
                        </div>
                      }
                    >
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            size="small"
                            checked={limitEnabled}
                            onChange={setLimitEnabled}
                          />
                          <span className="font-medium">
                            {`Эхний {n} үр дүнг авах`}
                          </span>
                        </div>
                        {limitEnabled && (
                          <div>
                            <InputNumber
                              min={1}
                              value={limitValue}
                              onChange={setLimitValue}
                              className="w-32"
                              placeholder="Хэдэн ширхэг"
                            />
                          </div>
                        )}
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            size="small"
                            checked={orderEnabled}
                            onChange={setOrderEnabled}
                          />
                          <span className="font-medium">Дугаарлах</span>
                        </div>
                        {orderEnabled && (
                          <div>
                            <Select
                              suffixIcon={
                                <DropdownIcon width={15} height={15} />
                              }
                              value={orderValue}
                              onChange={setOrderValue}
                              className="w-48"
                              options={fieldOptions}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            size="small"
                            checked={sortEnabled}
                            onChange={setSortEnabled}
                          />
                          <span className="font-medium">Эрэмбэлэх</span>
                        </div>
                        {sortEnabled && (
                          <div>
                            <Select
                              suffixIcon={
                                <DropdownIcon width={15} height={15} />
                              }
                              value={sortValue}
                              onChange={setSortValue}
                              className="w-48"
                              options={sortOptions}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-5! col-span-4">
                  {assessmentData?.data?.type === 10 && (
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <FilterBoldDuotone width={17} />
                          <span>Филтер</span>
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        {filters.length > 0 ? (
                          filters.map((filter, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4"
                            >
                              <Select
                                suffixIcon={
                                  <DropdownIcon width={15} height={15} />
                                }
                                placeholder="Филтер"
                                value={filter.field}
                                onChange={(value) =>
                                  handleFilterFieldChange(value, index)
                                }
                                className="w-full"
                                options={filterFieldOptions}
                              />
                              <Select
                                suffixIcon={
                                  <DropdownIcon width={15} height={15} />
                                }
                                placeholder="Утга"
                                value={filter.value}
                                onChange={(value) =>
                                  handleFilterValueChange(value, index)
                                }
                                className="w-full"
                                options={filterValueOptions}
                              />
                              <Button
                                type="text"
                                onClick={removeFilter}
                                icon={<TrashBin2BoldDuotone width={18} />}
                                className="text-red-500! rounded-full! px-2! mt-1!"
                              />
                            </div>
                          ))
                        ) : (
                          <Button
                            onClick={addFilter}
                            icon={<PlusIcon width={16} color="#000" />}
                            className="back-btn w-full"
                          >
                            Филтер нэмэх
                          </Button>
                        )}
                      </div>
                    </Card>
                  )}
                  <FormulaExample
                    demoData={demoData}
                    formattedResults={formattedResults}
                    aggregations={aggregations}
                    limitEnabled={limitEnabled}
                    limitValue={limitValue}
                    sortEnabled={sortEnabled}
                    sortValue={sortValue}
                    assessmentQuestions={assessmentQuestions}
                    resultConfig={resultConfig}
                  />
                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <MenuIcon width={15} />
                        <span>Тайлангийн төрөл</span>
                      </div>
                    }
                  >
                    <div>
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Select
                          className="w-full"
                          placeholder="Төрөл сонгох"
                          options={reportMapping}
                          value={reportType}
                          onChange={handleReportTypeChange}
                          suffixIcon={<DropdownIcon width={15} height={15} />}
                          status={!reportType ? "error" : ""}
                        />
                      </Form.Item>
                    </div>
                  </Card>
                  <Button
                    onClick={saveFormula}
                    className="the-btn w-full"
                    loading={loading}
                  >
                    Томьёо хадгалах
                  </Button>
                </div>
                <div className="space-y-5! col-span-5">
                  <ResultConfiguration
                    assessmentQuestions={assessmentQuestions}
                    demoData={demoData}
                    formattedResults={formattedResults}
                    groupByEnabled={groupByEnabled}
                    aggregations={aggregations}
                    setResultConfig={setResultConfig}
                  />
                </div>
              </div>
            </div>
            <div className={selected === "example" ? "" : "hidden"}>
              <div className="mb-4">
                <div className="font-bold text-xl rounded-md">
                  {assessmentData?.data?.name}
                </div>
                <div
                  className={`${
                    hasReport ? "text-green-600" : "text-orange-500"
                  } font-bold`}
                >
                  {hasReport
                    ? `${
                        assessmentData.data?.type === 10
                          ? "Онооны тайлбар"
                          : "Жишиг тайлан"
                      } оруулсан байна.`
                    : `${
                        assessmentData.data?.type === 10
                          ? "Онооны тайлбар"
                          : "Жишиг тайлан"
                      } оруулаагүй байна.`}
                </div>
                <div className="mt-4 w-1/2">
                  <Dragger
                    beforeUpload={beforeUpload}
                    accept=".pdf"
                    maxCount={1}
                    showUploadList={{
                      showRemoveIcon: true,
                      showDownloadIcon: true,
                    }}
                    fileList={fileList}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    disabled={uploading}
                    style={{ marginBottom: 16, borderRadius: "16px" }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="font-semibold">
                      {uploading
                        ? "Уншиж байна..."
                        : `${
                            assessmentData.data?.type === 10
                              ? "Онооны тайлбар"
                              : "Жишиг тайлан"
                          } оруулах`}
                    </p>
                    <p className="ant-upload-hint text-sm leading-4 mt-2">
                      Зөвхөн PDF өргөтгөлтэй файлыг энд дарж эсвэл чирж оруулна
                      уу.
                    </p>
                  </Dragger>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Report;
