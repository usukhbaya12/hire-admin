import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Select,
  Button,
  message,
  Empty,
  Spin,
} from "antd";
import {
  LoadingOutlined,
  PlusOutlined,
  RightOutlined,
  ArrowDownOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { TrashBinTrashBoldDuotone } from "solar-icons";
import {
  getQuestionRules,
  createQuestionRule,
  deleteQuestionRule,
} from "@/app/api/assessment";

// HTML таг агуулсан асуултын нэрийг цэвэр текст болгоно.
const stripHtml = (s) =>
  typeof s === "string" ? s.replace(/<[^>]*>/g, "").trim() : "";

let cardKeySeq = 0;
const newCardKey = () => `card-${Date.now()}-${cardKeySeq++}`;

// Нөхцөлт алгасах (branching) дүрмийг удирдах modal.
// Жишээ: "Тамхи татдаггүй" гэж А асуултад хариулбал тамхины Б асуултыг алгасна.
//
// UX: дүрэм бүрийг "ХЭРЭВ (нөхцөл) → ТЭГВЭЛ (алгасах асуултууд)" гэсэн
// картаар харуулна. Хэрэглэгч хэдэн ч дүрмийн карт нэмж/өөрчилж, эцэст нь
// "Хадгалах" дарахад бодит зөрүүг (нэмэгдсэн/устгагдсан мөр) сервертэй
// нэг мөсөн тааруулна ("Цуцлах" бол ямар ч өөрчлөлт хийхгүй хаана).
const BranchingRules = ({ visible, onClose, questions }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState([]); // серверээс ирсэн түүхий (flat) мөрүүд
  const [ruleCards, setRuleCards] = useState([]); // дэлгэц дээрх ноорог карт бүр
  const [addingTargetFor, setAddingTargetFor] = useState(null); // тухайн картад "Асуулт нэмэх" select нээлттэй эсэх

  // Бүх блокийн асуултыг нэг жагсаалт болгож хавтгайруулна, гэхдээ аль
  // блокод хамаарахыг мартахгүй хадгална.
  const flatQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.flatMap((block) =>
      (block.questions || []).map((q) => ({
        id: q.id,
        name: stripHtml(q.name) || `Асуулт #${q.id}`,
        blockId: block.category?.id,
        blockName: block.category?.name || `Блок #${block.category?.id}`,
        answers: (q.answers || []).map((a) => ({
          id: a.id,
          value: stripHtml(a.value) || `Хариулт #${a.id}`,
        })),
      }))
    );
  }, [questions]);

  const questionById = useMemo(() => {
    const m = new Map();
    flatQuestions.forEach((q) => m.set(Number(q.id), q));
    return m;
  }, [flatQuestions]);

  const assessmentQuestionIds = useMemo(
    () => new Set(flatQuestions.map((q) => Number(q.id))),
    [flatQuestions]
  );

  // Select-үүдийн сонголтыг блокоор бүлэглэнэ (optgroup); excludeIds-д
  // орсон асуултуудыг сонголтоос хасна (жишээ нь: тухайн картын нөхцөл
  // асуулт болон аль хэдийн нэмэгдсэн алгасах асуултуудыг давхардуулахгүй).
  const buildGroupedOptions = (excludeIds) => {
    if (!Array.isArray(questions)) return [];
    return questions
      .map((block) => ({
        label: block.category?.name || `Блок #${block.category?.id}`,
        title: block.category?.name,
        options: (block.questions || [])
          .filter((q) => !excludeIds || !excludeIds.has(Number(q.id)))
          .map((q) => ({
            value: q.id,
            label: stripHtml(q.name) || `Асуулт #${q.id}`,
            blockName: block.category?.name || "",
          })),
      }))
      .filter((g) => g.options.length > 0);
  };

  const conditionQuestionOptions = useMemo(
    () => buildGroupedOptions(new Set()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions]
  );

  // Асуултын нэр эсвэл блокийн нэрээр тохирвол хайлтад тааруулна.
  const filterQuestionOption = (input, option) => {
    const search = input.toLowerCase();
    return (
      option?.label?.toLowerCase().includes(search) ||
      option?.blockName?.toLowerCase().includes(search)
    );
  };

  // Flat DB мөрүүдийг (ижил dependsOnQuestionId + dependsOnAnswerId) картаар бүлэглэнэ.
  const buildCardsFromRules = (flatRules) => {
    const map = new Map();
    flatRules.forEach((r) => {
      const key = `${r.dependsOnQuestionId}|${r.dependsOnAnswerId ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          key: newCardKey(),
          dependsOnQuestionId: r.dependsOnQuestionId ?? null,
          dependsOnAnswerId: r.dependsOnAnswerId ?? null,
          targetQuestionIds: [],
        });
      }
      map.get(key).targetQuestionIds.push(Number(r.targetQuestionId));
    });
    return Array.from(map.values());
  };

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await getQuestionRules();
      const filtered =
        res?.success && Array.isArray(res.data)
          ? res.data.filter((r) =>
              assessmentQuestionIds.has(Number(r.targetQuestionId))
            )
          : [];
      setRules(filtered);
      setRuleCards(buildCardsFromRules(filtered));
    } catch {
      messageApi.error("Дүрэм татахад алдаа гарлаа.");
      setRules([]);
      setRuleCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadRules();
    } else {
      setAddingTargetFor(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, assessmentQuestionIds]);

  const addCard = () => {
    setRuleCards((prev) => [
      ...prev,
      {
        key: newCardKey(),
        dependsOnQuestionId: null,
        dependsOnAnswerId: null,
        targetQuestionIds: [],
      },
    ]);
  };

  const removeCard = (key) => {
    setRuleCards((prev) => prev.filter((c) => c.key !== key));
    setAddingTargetFor((prev) => (prev === key ? null : prev));
  };

  const setCardDependsOn = (key, questionId) => {
    setRuleCards((prev) =>
      prev.map((c) =>
        c.key === key
          ? {
              ...c,
              dependsOnQuestionId: questionId,
              dependsOnAnswerId: null,
              // шинээр сонгосон нөхцөл асуулт нь өөрөө алгасах жагсаалтад
              // байвал давхардлыг арилгана.
              targetQuestionIds: c.targetQuestionIds.filter(
                (id) => Number(id) !== Number(questionId)
              ),
            }
          : c
      )
    );
  };

  const setCardDependsAnswer = (key, answerId) => {
    setRuleCards((prev) =>
      prev.map((c) => (c.key === key ? { ...c, dependsOnAnswerId: answerId } : c))
    );
  };

  const addTargetQuestion = (key, questionId) => {
    if (!questionId) return;
    setRuleCards((prev) =>
      prev.map((c) =>
        c.key === key && !c.targetQuestionIds.includes(Number(questionId))
          ? { ...c, targetQuestionIds: [...c.targetQuestionIds, Number(questionId)] }
          : c
      )
    );
    setAddingTargetFor(null);
  };

  const removeTargetQuestion = (key, questionId) => {
    setRuleCards((prev) =>
      prev.map((c) =>
        c.key === key
          ? {
              ...c,
              targetQuestionIds: c.targetQuestionIds.filter(
                (id) => Number(id) !== Number(questionId)
              ),
            }
          : c
      )
    );
  };

  // "Хадгалах" дарахад бүх карт дахь дүрмийг сервер дээрх одоогийн
  // мөрүүдтэй харьцуулж, зөвхөн зөрүүг (нэмэх/устгах) илгээнэ.
  const handleSaveAll = async () => {
    const incomplete = ruleCards.some(
      (c) => c.dependsOnQuestionId && c.targetQuestionIds.length === 0
    );
    if (incomplete) {
      messageApi.warning(
        "Дутуу дүрэм байна: нөхцөл сонгосон боловч алгасах асуулт нэмээгүй байна."
      );
      return;
    }

    const desired = [];
    ruleCards.forEach((c) => {
      if (!c.dependsOnQuestionId || !c.targetQuestionIds.length) return;
      c.targetQuestionIds.forEach((targetId) => {
        desired.push({
          targetQuestionId: Number(targetId),
          dependsOnQuestionId: Number(c.dependsOnQuestionId),
          dependsOnAnswerId: c.dependsOnAnswerId ? Number(c.dependsOnAnswerId) : null,
        });
      });
    });

    const rowKey = (r) =>
      `${r.targetQuestionId}|${r.dependsOnQuestionId}|${r.dependsOnAnswerId ?? ""}`;
    const desiredKeys = new Set(desired.map(rowKey));
    const currentByKey = new Map(
      rules.map((r) => [
        rowKey({
          targetQuestionId: Number(r.targetQuestionId),
          dependsOnQuestionId: Number(r.dependsOnQuestionId),
          dependsOnAnswerId: r.dependsOnAnswerId ?? null,
        }),
        r.id,
      ])
    );

    const toCreate = desired.filter((r) => !currentByKey.has(rowKey(r)));
    const toDeleteIds = [...currentByKey.entries()]
      .filter(([key]) => !desiredKeys.has(key))
      .map(([, id]) => id);

    if (!toCreate.length && !toDeleteIds.length) {
      messageApi.info("Өөрчлөлт алга.");
      onClose?.();
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.all([
        ...toCreate.map((r) => createQuestionRule({ ...r, action: "skip" })),
        ...toDeleteIds.map((id) => deleteQuestionRule(id)),
      ]);
      const failed = results.filter((res) => !res?.success);
      if (failed.length) {
        messageApi.warning("Зарим өөрчлөлт хадгалагдсангүй, дахин оролдоно уу.");
      } else {
        messageApi.success("Дүрэм хадгалагдлаа.");
      }
      await loadRules();
      if (!failed.length) onClose?.();
    } catch {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose?.();
  };

  const configuredCount = ruleCards.filter(
    (c) => c.dependsOnQuestionId && c.targetQuestionIds.length
  ).length;

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={560}
      title="Нөхцөлт алгасах дүрэм"
      destroyOnClose
    >
      {contextHolder}
      <div className="text-sm text-gray-500 mb-3">
        Тодорхой хариулт өгсөн үед дараах асуултуудыг алгасахаар тохируулна.
      </div>

      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-400 mb-4">
        <span className="font-semibold text-gray-600">ХЭРЭВ</span>
        <RightOutlined style={{ fontSize: 9 }} />
        <span>НӨХЦӨЛ</span>
        <RightOutlined style={{ fontSize: 9 }} />
        <span className="font-semibold text-gray-600">ТЭГВЭЛ</span>
        <RightOutlined style={{ fontSize: 9 }} />
        <span>АЛГАСАХ АСУУЛТУУД</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {ruleCards.length === 0 && (
            <Empty description="Дүрэм алга" />
          )}

          {ruleCards.map((card, idx) => {
            const dependsQuestion = questionById.get(Number(card.dependsOnQuestionId));
            const answerOptions = (dependsQuestion?.answers || []).map((a) => ({
              value: a.id,
              label: a.value,
            }));
            const excludeIds = new Set([
              Number(card.dependsOnQuestionId),
              ...card.targetQuestionIds.map(Number),
            ]);
            const skipOptions = buildGroupedOptions(excludeIds);

            return (
              <div key={card.key} className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Дүрэм #{idx + 1}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    onClick={() => removeCard(card.key)}
                  >
                    <TrashBinTrashBoldDuotone width={15} />
                    Устгах
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    ХЭРЭВ
                  </span>
                  <span className="text-xs text-gray-400">нөхцөл тохиолдол</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Select
                    showSearch
                    placeholder="Асуулт сонгох..."
                    className="w-full"
                    value={card.dependsOnQuestionId || undefined}
                    onChange={(v) => setCardDependsOn(card.key, v)}
                    filterOption={filterQuestionOption}
                    options={conditionQuestionOptions}
                  />
                  <Select
                    allowClear
                    placeholder={
                      card.dependsOnQuestionId
                        ? "Хариулт (заавал биш)"
                        : "Эхлээд асуулт сонгоно уу"
                    }
                    className="w-full"
                    value={card.dependsOnAnswerId || undefined}
                    onChange={(v) => setCardDependsAnswer(card.key, v)}
                    disabled={!card.dependsOnQuestionId}
                    options={answerOptions}
                  />
                </div>

                <div className="flex flex-col items-center py-2 text-gray-300">
                  <ArrowDownOutlined />
                  <span className="text-[11px] text-gray-400 mt-0.5">
                    дараа асуултуудыг алгасана
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    ТЭГВЭЛ
                  </span>
                  <span className="text-xs text-gray-400">алгасах асуултууд</span>
                </div>

                {card.targetQuestionIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {card.targetQuestionIds.map((tid) => (
                      <span
                        key={tid}
                        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 rounded-full pl-2.5 pr-1.5 py-1"
                      >
                        {questionById.get(Number(tid))?.name || `#${tid}`}
                        <button
                          type="button"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => removeTargetQuestion(card.key, tid)}
                        >
                          <CloseOutlined style={{ fontSize: 10 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {addingTargetFor === card.key ? (
                  <Select
                    autoFocus
                    defaultOpen
                    showSearch
                    placeholder="Асуулт сонгох..."
                    className="w-full"
                    value={undefined}
                    onChange={(v) => addTargetQuestion(card.key, v)}
                    onBlur={() => setAddingTargetFor(null)}
                    filterOption={filterQuestionOption}
                    options={skipOptions}
                  />
                ) : (
                  <>
                    {card.targetQuestionIds.length === 0 && (
                      <div className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center py-3 mb-2">
                        Алгасах асуулт нэмэгдээгүй байна
                      </div>
                    )}
                    <Button
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      disabled={!card.dependsOnQuestionId}
                      onClick={() => setAddingTargetFor(card.key)}
                    >
                      Асуулт нэмэх
                    </Button>
                  </>
                )}
              </div>
            );
          })}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={addCard}>
            Дүрэм нэмэх
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{configuredCount} дүрэм тохируулсан</span>
        <div className="flex gap-2">
          <Button onClick={handleCancel}>Цуцлах</Button>
          <Button type="primary" className="the-btn" loading={saving} onClick={handleSaveAll}>
            Хадгалах
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BranchingRules;
