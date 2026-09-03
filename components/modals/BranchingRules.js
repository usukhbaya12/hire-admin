import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Select,
  Button,
  Table,
  message,
  Popconfirm,
  Tag,
  Empty,
  Spin,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { TrashBinTrashBoldDuotone } from "solar-icons";
import {
  getQuestionRules,
  createQuestionRule,
  deleteQuestionRule,
} from "@/app/api/assessment";

// HTML таг агуулсан асуултын нэрийг цэвэр текст болгоно.
const stripHtml = (s) =>
  typeof s === "string" ? s.replace(/<[^>]*>/g, "").trim() : "";

// Нөхцөлт алгасах (branching) дүрмийг удирдах modal.
// Жишээ: "Тамхи татдаггүй" гэж А асуултад хариулбал тамхины Б асуултыг алгасна.
const BranchingRules = ({ visible, onClose, questions }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState([]);

  const [targetQuestionIds, setTargetQuestionIds] = useState([]);
  const [dependsOnQuestionId, setDependsOnQuestionId] = useState(null);
  const [dependsOnAnswerId, setDependsOnAnswerId] = useState(null);
  const [blockFilter, setBlockFilter] = useState(null);

  // Блок бүрийн нэрийг хадгална (сонголтын жагсаалт болон хүснэгтэд ашиглана).
  const blocks = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.map((block) => ({
      id: block.category?.id,
      name: block.category?.name || `Блок #${block.category?.id}`,
    }));
  }, [questions]);

  // Бүх блокийн асуултыг нэг жагсаалт болгож хавтгайруулна, гэхдээ аль
  // блокод хамаарахыг мартахгүй хадгална — блокоор хайх/шүүхэд хэрэглэнэ.
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

  // Select-үүдийн сонголтыг блокоор бүлэглэнэ (optgroup), нэрээр нь болон
  // блокийн нэрээр хайх боломжтой болгоно.
  const groupedQuestionOptions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions
      .filter((block) => !blockFilter || block.category?.id === blockFilter)
      .map((block) => ({
        label: block.category?.name || `Блок #${block.category?.id}`,
        title: block.category?.name,
        options: (block.questions || []).map((q) => ({
          value: q.id,
          label: stripHtml(q.name) || `Асуулт #${q.id}`,
          blockName: block.category?.name || "",
        })),
      }))
      .filter((g) => g.options.length > 0);
  }, [questions, blockFilter]);

  // Асуултын нэр эсвэл блокийн нэрээр тохирвол хайлтад тааруулна
  // (antd group-той Select дээр энэ функц дэд сонголт бүрд дуудагдана).
  const filterQuestionOption = (input, option) => {
    const search = input.toLowerCase();
    return (
      option?.label?.toLowerCase().includes(search) ||
      option?.blockName?.toLowerCase().includes(search)
    );
  };

  const questionById = useMemo(() => {
    const m = new Map();
    flatQuestions.forEach((q) => m.set(Number(q.id), q));
    return m;
  }, [flatQuestions]);

  const assessmentQuestionIds = useMemo(
    () => new Set(flatQuestions.map((q) => Number(q.id))),
    [flatQuestions]
  );

  const dependsAnswers = useMemo(() => {
    if (!dependsOnQuestionId) return [];
    return questionById.get(Number(dependsOnQuestionId))?.answers || [];
  }, [dependsOnQuestionId, questionById]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await getQuestionRules();
      if (res?.success && Array.isArray(res.data)) {
        // Зөвхөн энэ тестийн асуултад хамаарах дүрмийг харуулна.
        setRules(
          res.data.filter((r) =>
            assessmentQuestionIds.has(Number(r.targetQuestionId))
          )
        );
      } else {
        setRules([]);
      }
    } catch {
      messageApi.error("Дүрэм татахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, assessmentQuestionIds]);

  const resetForm = () => {
    setTargetQuestionIds([]);
    setDependsOnQuestionId(null);
    setDependsOnAnswerId(null);
  };

  // Нэг нөхцөлт асуултаас ХЭД ХЭДЭН асуулт зэрэг алгасуулахын тулд
  // "Алгасах асуулт" талбарыг олон сонголттой (multi-select) болгосон.
  // Сервер тал нэг дүрэм = нэг target асуулттай тул сонгосон target бүрд
  // тусад нь createQuestionRule дуудна (нэг dependsOn хослолоор олон мөр
  // үүснэ) — ингэснээр admin нэг нэгээр давтаж нэмэх шаардлагагүй болно.
  const handleAdd = async () => {
    if (!targetQuestionIds.length || !dependsOnQuestionId) {
      messageApi.warning("Алгасах асуулт(ууд) болон нөхцөлт асуултыг сонгоно уу.");
      return;
    }
    if (targetQuestionIds.some((id) => Number(id) === Number(dependsOnQuestionId))) {
      messageApi.warning("Алгасах асуулт нөхцөлт асуулттай адилхан байж болохгүй.");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        targetQuestionIds.map((targetId) =>
          createQuestionRule({
            targetQuestionId: Number(targetId),
            dependsOnQuestionId: Number(dependsOnQuestionId),
            dependsOnAnswerId: dependsOnAnswerId ? Number(dependsOnAnswerId) : null,
            action: "skip",
          }),
        ),
      );
      const failed = results.filter((res) => !res?.success);
      if (failed.length === 0) {
        messageApi.success(
          targetQuestionIds.length > 1
            ? `${targetQuestionIds.length} дүрэм нэмэгдлээ.`
            : "Дүрэм нэмэгдлээ.",
        );
        resetForm();
      } else if (failed.length < results.length) {
        messageApi.warning(
          `${results.length - failed.length} дүрэм нэмэгдлээ, ${failed.length} нэмэхэд алдаа гарлаа.`,
        );
        resetForm();
      } else {
        messageApi.error(failed[0]?.message || "Дүрэм нэмэхэд алдаа гарлаа.");
      }
      loadRules();
    } catch {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteQuestionRule(id);
      if (res?.success) {
        messageApi.success("Дүрэм устгагдлаа.");
        loadRules();
      } else {
        messageApi.error("Дүрэм устгахад алдаа гарлаа.");
      }
    } catch {
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    }
  };

  // Хүснэгтэд харуулах дүрмүүдийг сонгосон блокоор шүүнэ (алгасагдах
  // асуултын харьяалагдах блокоор).
  const visibleRules = useMemo(() => {
    if (!blockFilter) return rules;
    return rules.filter(
      (r) =>
        Number(questionById.get(Number(r.targetQuestionId))?.blockId) ===
        Number(blockFilter),
    );
  }, [rules, blockFilter, questionById]);

  const columns = [
    {
      title: "Блок",
      key: "block",
      width: 140,
      render: (_, r) => (
        <Tag>{questionById.get(Number(r.targetQuestionId))?.blockName || "—"}</Tag>
      ),
    },
    {
      title: "Алгасах асуулт",
      key: "target",
      render: (_, r) =>
        questionById.get(Number(r.targetQuestionId))?.name ||
        `#${r.targetQuestionId}`,
    },
    {
      title: "Нөхцөл",
      key: "cond",
      render: (_, r) => {
        const dq =
          questionById.get(Number(r.dependsOnQuestionId))?.name ||
          `#${r.dependsOnQuestionId}`;
        const ans = r.dependsOnAnswerId
          ? questionById
              .get(Number(r.dependsOnQuestionId))
              ?.answers.find((a) => Number(a.id) === Number(r.dependsOnAnswerId))
              ?.value
          : null;
        return (
          <span>
            <Tag color="orange">{dq}</Tag>
            {ans ? (
              <>
                → <Tag color="blue">{ans}</Tag>
              </>
            ) : (
              <span className="text-gray-400">(ямар ч хариулт)</span>
            )}
          </span>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 60,
      align: "center",
      render: (_, r) => (
        <Popconfirm
          title="Дүрмийг устгах уу?"
          onConfirm={() => handleDelete(r.id)}
          okText="Тийм"
          cancelText="Үгүй"
        >
          <button className="text-red-500 hover:text-red-700">
            <TrashBinTrashBoldDuotone width={18} />
          </button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
      title="Нөхцөлт алгасах дүрэм"
    >
      {contextHolder}
      <div className="text-sm text-gray-500 mb-3">
        Нөхцөлт асуултад тодорхой хариулт өгсөн үед алгасах асуултыг тохируулна.
      </div>

      <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3 mb-4">
        <Select
          allowClear
          placeholder="Блокоор шүүх"
          className="w-full md:w-64"
          value={blockFilter}
          onChange={setBlockFilter}
          options={blocks.map((b) => ({ value: b.id, label: b.name }))}
        />
        <div className="flex flex-col md:flex-row gap-2">
          <Select
            showSearch
            mode="multiple"
            allowClear
            placeholder="Алгасах асуулт(ууд) (олон сонгож болно)"
            className="flex-1"
            value={targetQuestionIds}
            onChange={setTargetQuestionIds}
            filterOption={filterQuestionOption}
            options={groupedQuestionOptions}
          />
          <Select
            showSearch
            placeholder="Нөхцөлт асуулт (нэр эсвэл блокоор хайх)"
            className="flex-1"
            value={dependsOnQuestionId}
            onChange={(v) => {
              setDependsOnQuestionId(v);
              setDependsOnAnswerId(null);
            }}
            filterOption={filterQuestionOption}
            options={groupedQuestionOptions}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Select
            allowClear
            placeholder="Хариулт (заавал биш)"
            className="flex-1"
            value={dependsOnAnswerId}
            onChange={setDependsOnAnswerId}
            disabled={!dependsOnQuestionId}
            options={dependsAnswers.map((a) => ({
              value: a.id,
              label: a.value,
            }))}
          />
          <Button
            type="primary"
            className="the-btn"
            loading={saving}
            onClick={handleAdd}
          >
            Нэмэх
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
        </div>
      ) : visibleRules.length ? (
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={visibleRules}
          pagination={false}
        />
      ) : (
        <Empty
          description={
            blockFilter ? "Энэ блокод дүрэм алга" : "Дүрэм алга"
          }
        />
      )}
    </Modal>
  );
};

export default BranchingRules;
