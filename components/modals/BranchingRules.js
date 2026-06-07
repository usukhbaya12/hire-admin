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

  const [targetQuestionId, setTargetQuestionId] = useState(null);
  const [dependsOnQuestionId, setDependsOnQuestionId] = useState(null);
  const [dependsOnAnswerId, setDependsOnAnswerId] = useState(null);

  // Бүх блокийн асуултыг нэг жагсаалт болгож хавтгайруулна.
  const flatQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.flatMap((block) =>
      (block.questions || []).map((q) => ({
        id: q.id,
        name: stripHtml(q.name) || `Асуулт #${q.id}`,
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
    setTargetQuestionId(null);
    setDependsOnQuestionId(null);
    setDependsOnAnswerId(null);
  };

  const handleAdd = async () => {
    if (!targetQuestionId || !dependsOnQuestionId) {
      messageApi.warning("Алгасах асуулт болон нөхцөлт асуултыг сонгоно уу.");
      return;
    }
    if (Number(targetQuestionId) === Number(dependsOnQuestionId)) {
      messageApi.warning("Асуултууд ялгаатай байх ёстой.");
      return;
    }
    setSaving(true);
    try {
      const res = await createQuestionRule({
        targetQuestionId: Number(targetQuestionId),
        dependsOnQuestionId: Number(dependsOnQuestionId),
        dependsOnAnswerId: dependsOnAnswerId ? Number(dependsOnAnswerId) : null,
        action: "skip",
      });
      if (res?.success) {
        messageApi.success("Дүрэм нэмэгдлээ.");
        resetForm();
        loadRules();
      } else {
        messageApi.error(res?.message || "Дүрэм нэмэхэд алдаа гарлаа.");
      }
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

  const columns = [
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
        <div className="flex flex-col md:flex-row gap-2">
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Алгасах асуулт"
            className="flex-1"
            value={targetQuestionId}
            onChange={setTargetQuestionId}
            options={flatQuestions.map((q) => ({ value: q.id, label: q.name }))}
          />
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Нөхцөлт асуулт"
            className="flex-1"
            value={dependsOnQuestionId}
            onChange={(v) => {
              setDependsOnQuestionId(v);
              setDependsOnAnswerId(null);
            }}
            options={flatQuestions.map((q) => ({ value: q.id, label: q.name }))}
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
      ) : rules.length ? (
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={rules}
          pagination={false}
        />
      ) : (
        <Empty description="Дүрэм алга" />
      )}
    </Modal>
  );
};

export default BranchingRules;
