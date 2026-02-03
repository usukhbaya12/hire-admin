import React, { useState, useEffect } from "react";
import {
  Card,
  Radio,
  Button,
  Input,
  Switch,
  InputNumber,
  Divider,
  Alert,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { calculateMinMaxValues } from "./Demo";
import { PlusIcon } from "./Icons";
import {
  GlobalBoldDuotone,
  InfoCircleBoldDuotone,
  TrashBin2BoldDuotone,
} from "solar-icons";

const ResultConfiguration = ({
  assessmentData,
  assessmentQuestions,
  demoData,
  formattedResults,
  groupByEnabled,
  aggregations,
  resultConfig,
  setResultConfig,
  limitEnabled,
  limitValue,
}) => {
  const [configurationType, setConfigurationType] = useState("none");
  const [intervals, setIntervals] = useState([]);
  const [groupIntervals, setGroupIntervals] = useState({});
  const [useUniformIntervals, setUseUniformIntervals] = useState(false);

  const groupingType = groupByEnabled?.[0] || "none";
  const isSingleResult = groupingType === "none";
  const isGroupedResult = groupingType !== "none" && groupByEnabled?.length > 0;

  useEffect(() => {
    if (
      isSingleResult &&
      (configurationType === "grouped" || configurationType === "byCategory")
    ) {
      setConfigurationType("none");
    }
    if (isGroupedResult && configurationType === "single") {
      setConfigurationType("none");
    }

    // Auto-reset if intervals cannot be created
    if (configurationType === "single" && !canCreateIntervals()) {
      setConfigurationType("none");
    }
    if (configurationType === "grouped" && !canCreateGroupedIntervals()) {
      setConfigurationType("none");
    }
  }, [isSingleResult, isGroupedResult, configurationType]);

  const getMinMaxForAssessment = () => {
    return calculateMinMaxValues(
      assessmentQuestions,
      groupByEnabled,
      null,
      aggregations
    );
  };

  const getMinMaxForGroup = (groupName) => {
    return calculateMinMaxValues(
      assessmentQuestions,
      groupByEnabled,
      groupName,
      aggregations
    );
  };

  // Check if intervals can be created (min != max)
  const canCreateIntervals = () => {
    const { min, max } = getMinMaxForAssessment();
    return min !== max;
  };

  // Check if grouped intervals can be created
  const canCreateGroupedIntervals = () => {
    if (!isGroupedResult || !formattedResults?.grouped) return false;

    const groups = Object.keys(formattedResults.grouped);
    // Check if at least one group has different min/max
    return groups.some((groupName) => {
      const { min, max } = getMinMaxForGroup(groupName);
      return min !== max;
    });
  };

  const canUseUniformIntervals = () => {
    if (!isGroupedResult || !formattedResults?.grouped) return false;

    const groups = Object.keys(formattedResults.grouped);
    if (groups.length <= 1) return true;

    const firstGroupMinMax = getMinMaxForGroup(groups[0]);

    const allSame = groups.every((group) => {
      const minMax = getMinMaxForGroup(group);
      return (
        minMax.min === firstGroupMinMax.min &&
        minMax.max === firstGroupMinMax.max
      );
    });

    return allSame;
  };

  useEffect(() => {
    if (configurationType === "single") {
      const { min, max } = getMinMaxForAssessment();
      const mid = Math.floor((max - min) / 2) + min;
      setIntervals([
        { start: min, end: mid, label: "", shortLabel: null },
        { start: mid + 0.1, end: max, label: "", shortLabel: null },
      ]);
    } else if (configurationType === "grouped" && formattedResults?.grouped) {
      const newGroupIntervals = {};
      const groups = Object.keys(formattedResults.grouped);

      if (useUniformIntervals && groups.length > 0) {
        const { min, max } = getMinMaxForGroup(groups[0]);
        const mid = Math.floor((max - min) / 2) + min;
        const uniformInterval = [
          { start: min, end: mid, label: "", shortLabel: null },
          { start: mid + 0.1, end: max, label: "", shortLabel: null },
        ];
        groups.forEach((groupName) => {
          newGroupIntervals[groupName] = JSON.parse(
            JSON.stringify(uniformInterval)
          );
        });
      } else {
        groups.forEach((groupName) => {
          const { min, max } = getMinMaxForGroup(groupName);
          const mid = Math.floor((max - min) / 2) + min;
          newGroupIntervals[groupName] = [
            { start: min, end: mid, label: "", shortLabel: null },
            { start: mid + 0.1, end: max, label: "", shortLabel: null },
          ];
        });
      }
      setGroupIntervals(newGroupIntervals);
    }
  }, [configurationType, formattedResults, useUniformIntervals]);

  const addInterval = (groupName = null) => {
    if (groupName) {
      const currentIntervals = [...(groupIntervals[groupName] || [])];
      const { min, max } = getMinMaxForGroup(groupName);

      if (currentIntervals.length > 0) {
        const lastInterval = currentIntervals[currentIntervals.length - 1];
        const newSplit = Math.floor((lastInterval.start + max) / 2);

        currentIntervals[currentIntervals.length - 1] = {
          ...lastInterval,
          end: newSplit,
        };

        currentIntervals.push({
          start: newSplit + 0.1,
          end: max,
          label: "",
          shortLabel: null,
        });
      } else {
        currentIntervals.push({
          start: min,
          end: max,
          label: "",
          shortLabel: null,
        });
      }

      setGroupIntervals({
        ...groupIntervals,
        [groupName]: currentIntervals,
      });
    } else {
      const currentIntervals = [...intervals];
      const { min, max } = getMinMaxForAssessment();

      if (currentIntervals.length > 0) {
        const lastInterval = currentIntervals[currentIntervals.length - 1];
        const newSplit = Math.floor((lastInterval.start + max) / 2);

        currentIntervals[currentIntervals.length - 1] = {
          ...lastInterval,
          end: newSplit,
        };

        currentIntervals.push({
          start: newSplit + 0.1,
          end: max,
          label: "",
          shortLabel: null,
        });
      } else {
        currentIntervals.push({
          start: min,
          end: max,
          label: "",
          shortLabel: null,
        });
      }

      setIntervals(currentIntervals);
    }
  };

  const removeInterval = (index, groupName = null) => {
    if (groupName) {
      const currentIntervals = groupIntervals[groupName] || [];
      if (currentIntervals.length <= 2) return;

      const newIntervals = currentIntervals.filter((_, i) => i !== index);

      if (index === 0 && newIntervals.length > 0) {
        const { min } = getMinMaxForGroup(groupName);
        newIntervals[0].start = min;
      }

      if (index === currentIntervals.length - 1 && newIntervals.length > 0) {
        const { max } = getMinMaxForGroup(groupName);
        newIntervals[newIntervals.length - 1].end = max;
      }

      setGroupIntervals({
        ...groupIntervals,
        [groupName]: newIntervals,
      });
    } else {
      if (intervals.length <= 2) return;

      const newIntervals = intervals.filter((_, i) => i !== index);

      if (index === 0 && newIntervals.length > 0) {
        const { min } = getMinMaxForAssessment();
        newIntervals[0].start = min;
      }

      if (index === intervals.length - 1 && newIntervals.length > 0) {
        const { max } = getMinMaxForAssessment();
        newIntervals[newIntervals.length - 1].end = max;
      }

      setIntervals(newIntervals);
    }
  };

  const updateInterval = (index, field, value, groupName = null) => {
    if (useUniformIntervals && groupName) {
      const updatedGroupIntervals = { ...groupIntervals };
      Object.keys(updatedGroupIntervals).forEach((gName) => {
        const currentIntervals = [...updatedGroupIntervals[gName]];
        const { min, max } = getMinMaxForGroup(gName);

        if (field === "start" && index === 0) return;
        if (field === "end" && index === currentIntervals.length - 1) return;

        if (field === "end") {
          const currentInterval = currentIntervals[index];
          if (value <= currentInterval.start) return;
          if (index < currentIntervals.length - 1 && value >= max) return;
        }

        // Update interval with shortLabel as null
        currentIntervals[index] = {
          ...currentIntervals[index],
          [field]: value,
          shortLabel: null,
        };

        if (field === "end" && index < currentIntervals.length - 1) {
          currentIntervals[index + 1] = {
            ...currentIntervals[index + 1],
            start: parseFloat(value) + 0.1,
          };
        }

        updatedGroupIntervals[gName] = currentIntervals;
      });
      setGroupIntervals(updatedGroupIntervals);
    } else if (groupName) {
      const currentIntervals = [...(groupIntervals[groupName] || [])];
      const { min, max } = getMinMaxForGroup(groupName);

      if (field === "start" && index === 0) return;
      if (field === "end" && index === currentIntervals.length - 1) return;

      if (field === "end") {
        const currentInterval = currentIntervals[index];
        if (value <= currentInterval.start) return;
        if (index < currentIntervals.length - 1 && value >= max) return;
      }

      // Update interval with shortLabel as null
      currentIntervals[index] = {
        ...currentIntervals[index],
        [field]: value,
        shortLabel: null,
      };

      if (field === "end" && index < currentIntervals.length - 1) {
        currentIntervals[index + 1] = {
          ...currentIntervals[index + 1],
          start: parseFloat(value) + 0.1,
        };
      }

      setGroupIntervals({
        ...groupIntervals,
        [groupName]: currentIntervals,
      });
    } else {
      const newIntervals = [...intervals];
      const { min, max } = getMinMaxForAssessment();

      if (field === "start" && index === 0) return;
      if (field === "end" && index === newIntervals.length - 1) return;

      if (field === "end") {
        const currentInterval = newIntervals[index];
        if (value <= currentInterval.start) return;
        if (index < newIntervals.length - 1 && value >= max) return;
      }

      // Update interval with shortLabel as null
      newIntervals[index] = {
        ...newIntervals[index],
        [field]: value,
        shortLabel: null,
      };

      if (field === "end" && index < newIntervals.length - 1) {
        newIntervals[index + 1] = {
          ...newIntervals[index + 1],
          start: parseFloat(value) + 0.1,
        };
      }

      setIntervals(newIntervals);
    }
  };

  const saveConfiguration = () => {
    setResultConfig({
      type: configurationType,
      intervals: configurationType === "single" ? intervals : null,
      groupIntervals: configurationType === "grouped" ? groupIntervals : null,
      useUniformIntervals,
    });
  };

  const validateIntervals = (intervalsToCheck) => {
    if (!intervalsToCheck || intervalsToCheck.length === 0) return false;

    return intervalsToCheck.every((interval, index) => {
      if (!interval.label) return false;
      if (interval.end <= interval.start) return false;

      if (index < intervalsToCheck.length - 1) {
        const nextInterval = intervalsToCheck[index + 1];
        if (nextInterval.start <= interval.end) return false;
      }

      return true;
    });
  };

  const isValid =
    configurationType === "none" ||
    configurationType === "byCategory" ||
    (configurationType === "single" && validateIntervals(intervals)) ||
    (configurationType === "grouped" &&
      Object.values(groupIntervals).every(validateIntervals));

  const getPreviewValue = (groupName = null) => {
    if (!formattedResults?.aggregated) return null;

    const operation = Object.keys(formattedResults.aggregated)[0];
    if (!operation) return null;

    const values = formattedResults.aggregated[operation];

    if (groupName) {
      return values[groupName];
    } else {
      return values["Нийт"];
    }
  };

  const classifyValue = (value, intervalsToUse) => {
    const interval = intervalsToUse.find(
      (i) => value >= i.start && value <= i.end
    );
    return interval
      ? { label: interval.label, short: interval.shortLabel }
      : null;
  };

  // Get all groups with values for byCategory display
  const getAllGroupsWithValues = () => {
    if (!formattedResults?.aggregated) return [];

    const operation = Object.keys(formattedResults.aggregated)[0];
    if (!operation) return [];

    const allValues = formattedResults.aggregated[operation];
    const limit = limitValue ? parseInt(limitValue) : null;

    return Object.entries(allValues).map(([groupName, value], index) => ({
      groupName,
      value,
      isInLimit: !limitEnabled || !limit || index < limit,
    }));
  };

  if (!demoData || !formattedResults) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <GlobalBoldDuotone width={15} />
            <span>Үр дүн тохируулах</span>
          </div>
        }
        className="mb-4"
      >
        <Alert message="Жишээ өгөгдөл байхгүй байна" type="warning" showIcon />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <GlobalBoldDuotone width={15} />
          <span>Үр дүн тохируулах</span>
        </div>
      }
      className="mb-4"
    >
      <div className="space-y-4">
        <div>
          <Radio.Group
            value={configurationType}
            onChange={(e) => setConfigurationType(e.target.value)}
          >
            <div className="flex flex-col gap-2">
              <Radio value="none">Зөв хариулттай</Radio>
              {isSingleResult && (
                <Radio value="single" disabled={!canCreateIntervals()}>
                  Интервалд хуваах
                  {!canCreateIntervals() && (
                    <span className="text-xs text-gray-400 ml-2">
                      (min = max)
                    </span>
                  )}
                </Radio>
              )}
              {isGroupedResult && (
                <>
                  <Radio value="byCategory">Ангилал тус бүрээр</Radio>
                  <Radio
                    value="grouped"
                    disabled={!canCreateGroupedIntervals()}
                  >
                    Бүлгээр нь интервалд хуваах
                    {!canCreateGroupedIntervals() && (
                      <span className="text-xs text-gray-400 ml-2">
                        (min = max)
                      </span>
                    )}
                  </Radio>
                </>
              )}
            </div>
          </Radio.Group>
        </div>

        {/* Single Interval Configuration */}
        {configurationType === "single" && (
          <Card>
            <div className="flex justify-between items-center mb-3">
              <div className="font-medium">
                <span className="text-main font-bold">
                  {getMinMaxForAssessment().min}
                </span>
                -с{" "}
                <span className="text-main font-bold">
                  {getMinMaxForAssessment().max}
                </span>{" "}
                оноог хуваах
              </div>

              <Button
                onClick={() => addInterval()}
                className="the-btn -mt-1!"
                icon={<PlusIcon width={18} height={18} color={"#f36421"} />}
              ></Button>
            </div>

            <div className="space-y-2">
              {intervals.map((interval, index) => {
                const { min, max } = getMinMaxForAssessment();
                return (
                  <div key={index} className="flex gap-2 items-center">
                    <InputNumber
                      controls={false}
                      value={interval.start}
                      onChange={(value) =>
                        updateInterval(index, "start", value)
                      }
                      placeholder="0"
                      className="w-22!"
                      disabled={true}
                      min={min}
                      max={max}
                    />
                    <span className="-ml-2">-с </span>
                    <InputNumber
                      controls={false}
                      value={interval.end}
                      onChange={(value) => updateInterval(index, "end", value)}
                      placeholder="0"
                      className="w-22!"
                      disabled={index === intervals.length - 1}
                      min={min}
                      max={max}
                    />
                    <Input
                      value={interval.label}
                      onChange={(e) =>
                        updateInterval(index, "label", e.target.value)
                      }
                      placeholder="Ангилал"
                    />
                    {intervals.length > 2 && (
                      <Button
                        type="text"
                        onClick={() => removeInterval(index)}
                        icon={<TrashBin2BoldDuotone width={18} />}
                        className="text-red-500! rounded-full! px-2! mt-1!"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* {configurationType === "byCategory" && (
          <Card>
            <div className="font-medium mb-3">Ангилал тус бүрээр үр дүн</div>
            <div className="space-y-1">
              {getAllGroupsWithValues().map(
                ({ groupName, value, isInLimit }) => (
                  <div key={groupName} className="flex justify-between">
                    <span className={isInLimit ? "font-bold" : ""}>
                      {groupName}:
                    </span>
                    <span className={isInLimit ? "font-bold text-main" : ""}>
                      {value}
                    </span>
                  </div>
                )
              )}
            </div>
          </Card>
        )} */}

        {/* Grouped Interval Configuration */}
        {configurationType === "grouped" && formattedResults?.grouped && (
          <Card>
            <div className="flex justify-between items-center mb-3 -mt-1">
              <div className="font-medium">Бүлгээр хуваах</div>
              {canUseUniformIntervals() && (
                <div className="flex items-center gap-2">
                  <Switch
                    size="small"
                    checked={useUniformIntervals}
                    onChange={(checked) => setUseUniformIntervals(checked)}
                  />
                  <span>Бүгд ижил</span>
                </div>
              )}
            </div>

            {!canUseUniformIntervals() && (
              <div className="bg-yellow-100 p-3 pl-2/5 pr-5 rounded-xl border border-yellow-400 mb-3 flex gap-2">
                <InfoCircleBoldDuotone
                  width={18}
                  height={18}
                  className="text-yellow-600 min-w-[18px] mt-0.5"
                />
                Бүлгүүд нь өөр өөр их, бага утгатай байгаа тул тус бүрд нь
                интервалд хуваана уу.
              </div>
            )}

            {useUniformIntervals ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="font-medium">
                    <span className="text-main font-bold">
                      {
                        getMinMaxForGroup(
                          Object.keys(formattedResults.grouped)[0]
                        ).min
                      }
                    </span>
                    -с{" "}
                    <span className="text-main font-bold">
                      {
                        getMinMaxForGroup(
                          Object.keys(formattedResults.grouped)[0]
                        ).max
                      }
                    </span>{" "}
                    оноог хуваах
                  </div>

                  <Button
                    onClick={() => {
                      const firstGroup = Object.keys(
                        formattedResults.grouped
                      )[0];
                      addInterval(firstGroup);
                    }}
                    className="the-btn -mt-1!"
                    icon={<PlusIcon width={18} height={18} color={"#f36421"} />}
                  ></Button>
                </div>

                <div className="space-y-2">
                  {(
                    groupIntervals[Object.keys(formattedResults.grouped)[0]] ||
                    []
                  ).map((interval, index) => {
                    const firstGroup = Object.keys(formattedResults.grouped)[0];
                    const { min, max } = getMinMaxForGroup(firstGroup);
                    return (
                      <div key={index} className="flex gap-2 items-center">
                        <InputNumber
                          value={interval.start}
                          onChange={(value) =>
                            updateInterval(index, "start", value, firstGroup)
                          }
                          placeholder="0"
                          className="w-22!"
                          disabled={true}
                          min={min}
                          max={max}
                        />
                        <span className="-ml-2">-с </span>
                        <InputNumber
                          value={interval.end}
                          onChange={(value) =>
                            updateInterval(index, "end", value, firstGroup)
                          }
                          placeholder="0"
                          className="w-22!"
                          disabled={
                            index ===
                            (groupIntervals[firstGroup] || []).length - 1
                          }
                          min={min}
                          max={max}
                        />
                        <Input
                          value={interval.label}
                          onChange={(e) =>
                            updateInterval(
                              index,
                              "label",
                              e.target.value,
                              firstGroup
                            )
                          }
                          placeholder="Ангилал"
                        />
                        {(groupIntervals[firstGroup] || []).length > 2 && (
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeInterval(index, firstGroup)}
                            size="small"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(formattedResults.grouped).map((groupName) => {
                  const { min, max } = getMinMaxForGroup(groupName);
                  return (
                    <div key={groupName}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          <span className="font-bold">{groupName}: </span>
                          <span className="text-main font-bold">{min}</span>
                          -с <span className="text-main font-bold">
                            {max}
                          </span>{" "}
                          оноог хуваах
                        </div>

                        <Button
                          onClick={() => addInterval(groupName)}
                          className="the-btn -mt-1!"
                          icon={
                            <PlusIcon
                              width={18}
                              height={18}
                              color={"#f36421"}
                            />
                          }
                        ></Button>
                      </div>

                      <div className="space-y-2">
                        {(groupIntervals[groupName] || []).map(
                          (interval, index) => (
                            <div
                              key={index}
                              className="flex gap-2 items-center"
                            >
                              <InputNumber
                                value={interval.start}
                                onChange={(value) =>
                                  updateInterval(
                                    index,
                                    "start",
                                    value,
                                    groupName
                                  )
                                }
                                placeholder="0"
                                className="w-22!"
                                disabled={true}
                                min={min}
                                max={max}
                              />
                              <span className="-ml-2">-с </span>

                              <InputNumber
                                value={interval.end}
                                onChange={(value) =>
                                  updateInterval(index, "end", value, groupName)
                                }
                                placeholder="0"
                                className="w-22!"
                                disabled={
                                  index ===
                                  (groupIntervals[groupName] || []).length - 1
                                }
                                min={min}
                                max={max}
                              />
                              <Input
                                value={interval.label}
                                onChange={(e) =>
                                  updateInterval(
                                    index,
                                    "label",
                                    e.target.value,
                                    groupName
                                  )
                                }
                                placeholder="Ангилал"
                              />
                              {(groupIntervals[groupName] || []).length > 2 && (
                                <Button
                                  type="text"
                                  onClick={() =>
                                    removeInterval(index, groupName)
                                  }
                                  icon={<TrashBin2BoldDuotone width={18} />}
                                  className="text-red-500! rounded-full! px-2! mt-1!"
                                />
                              )}
                            </div>
                          )
                        )}
                      </div>
                      {Object.keys(formattedResults.grouped).indexOf(
                        groupName
                      ) <
                        Object.keys(formattedResults.grouped).length - 1 && (
                        <Divider className="mt-6!" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          {resultConfig && resultConfig.type !== "none" && (
            <Button
              onClick={() => {
                setResultConfig(null);
                setConfigurationType("none");
                setIntervals([]);
                setGroupIntervals({});
              }}
              danger
            >
              Устгах
            </Button>
          )}
          <Button
            type="primary"
            onClick={saveConfiguration}
            disabled={!isValid || configurationType === "none"}
            className="the-btn"
          >
            Хадгалах
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ResultConfiguration;
