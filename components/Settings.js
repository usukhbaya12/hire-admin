"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Divider,
  InputNumber,
  Upload,
  Switch,
  message,
  Button,
  Breadcrumb,
} from "antd";
import { DropdownIcon } from "./Icons";
import { PlusOutlined } from "@ant-design/icons";
import { imageUploader } from "@/app/api/constant";
import { api } from "@/utils/routes";
import { TestName } from "./test-ui/TestName";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import Underline from "@tiptap/extension-underline";
import {
  AlarmBoldDuotone,
  BookBookmarkBoldDuotone,
  BookmarkBoldDuotone,
  CaseRoundMinimalisticBoldDuotone,
  ClipboardTextBoldDuotone,
  ClockCircleBoldDuotone,
  DatabaseBoldDuotone,
  EyeBoldDuotone,
  Flag2BoldDuotone,
  FolderCloudBoldDuotone,
  NotesBoldDuotone,
  QuestionCircleBoldDuotone,
  SettingsBoldDuotone,
  SquareArrowRightDownBoldDuotone,
  TagLineDuotone,
  TextBoldCircleBoldDuotone,
  TextItalicCircleBoldDuotone,
  TextUnderlineCircleBoldDuotone,
} from "solar-icons";
import CharacterCount from "@tiptap/extension-character-count";

const SortableBlock = ({
  block,
  blockDurations,
  blockQuestionCounts,
  showDuration,
  showQuestionCount,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border border-neutral rounded-3xl p-4 px-8 mb-3 cursor-move"
    >
      <div>
        <div className="flex items-center gap-3">
          <NotesBoldDuotone width={19} />
          <h3 className="font-bold">{block.name}</h3>
          <div className="text-gray-500">{block.questions.length} Aсуулт</div>
        </div>
        {(showDuration || showQuestionCount) && (
          <>
            <Divider />
            <div className="flex items-center gap-2">
              {showDuration && (
                <>
                  <div className="text-[13px]">
                    Хугацаа: {blockDurations[block.id] || 0} мин
                  </div>
                  {showQuestionCount && <span>•</span>}
                </>
              )}
              {showQuestionCount && (
                <div className="text-[13px]">
                  Асуулт:{" "}
                  {blockQuestionCounts[block.id] || block.questions.length}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const { TextArea } = Input;

const BlurImage = ({ src, alt }) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-gray-200 max-h-[220px] min-h-[220px] w-full">
      <Image
        src={src}
        alt={alt}
        fill
        loading="lazy"
        className={`
         object-cover
         duration-700 ease-in-out
         ${isLoading ? "scale-110 blur-lg" : "scale-100 blur-0"}
         transform transition-transform duration-500 group-hover:scale-110
         max-h-[220px] min-h-[220px]
       `}
        onLoadingComplete={() => setLoading(false)}
      />
    </div>
  );
};

const Settings = ({
  blocks,
  setBlocks,
  assessmentData,
  onUpdateAssessment,
  assessmentCategories,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState("general");
  const [form] = Form.useForm();

  const [imageUrl, setImageUrl] = useState(assessmentData?.data?.icons || null);
  const [loading, setLoading] = useState(false);
  const [blockDurationEnabled, setBlockDurationEnabled] = useState(false);
  const [testEndsOnTimeout, setTestEndsOnTimeout] = useState(
    assessmentData?.data?.timeout
  );
  const [blockDurations, setBlockDurations] = useState({});
  const [questionCountEnabled, setQuestionCountEnabled] = useState(false);
  const [blockQuestionCounts, setBlockQuestionCounts] = useState({});
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (assessmentData?.category?.parent) {
      return {
        id: assessmentData.category.parent.id,
        name: assessmentData.category.parent.name,
      };
    }
    return assessmentData?.category
      ? {
          id: assessmentData.category.id,
          name: assessmentData.category.name,
        }
      : null;
  });

  const limit = 1000;

  const editor = useEditor({
    extensions: [
      CharacterCount.configure({
        limit,
      }),
      Underline,
      ListItem.configure({
        HTMLAttributes: {
          class: "list-disc ml-4",
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-4",
        },
        inputRegex: /^\s*([-*])\s$/,
      }),
      StarterKit.configure({
        table: false,
        bulletList: false,
        listItem: false,
      }),
    ],
    content: assessmentData?.data?.advice || "",
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[500px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      handleFieldChange("advice", editor.getHTML());
    },
  });

  const FloatingMenu = () => {
    if (!editor) return null;

    const handleFormat = (e, type) => {
      e.preventDefault();
      e.stopPropagation();

      switch (type) {
        case "bold":
          editor.commands.toggleBold();
          break;
        case "italic":
          editor.commands.toggleItalic();
          break;
        case "underline":
          editor.commands.toggleUnderline();
          break;
      }
    };

    return (
      <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border text-gray-400">
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "bold")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("bold") ? "text-main" : ""
          }`}
        >
          <TextBoldCircleBoldDuotone />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "italic")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("italic") ? "text-main" : ""
          }`}
        >
          <TextItalicCircleBoldDuotone />
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleFormat(e, "underline")}
          className={`p-1 rounded hover:text-gray-600 ${
            editor.isActive("underline") ? "text-main" : ""
          }`}
        >
          <TextUnderlineCircleBoldDuotone />
        </button>
      </div>
    );
  };

  const availableSubCategories = selectedCategory
    ? assessmentCategories.find((cat) => cat.id === selectedCategory.id)
        ?.subcategories || []
    : [];

  const [selectedSubCategory, setSelectedSubCategory] = useState(() => {
    return assessmentData?.category?.parent
      ? {
          id: assessmentData.category.id,
          name: assessmentData.category.name,
        }
      : null;
  });

  useEffect(() => {
    if (assessmentData) {
      form.setFieldsValue({
        name: assessmentData.data.name,
        category: assessmentData.data.category,
        description: assessmentData.data.description,
        price: assessmentData.data.price,
        author: assessmentData.data.author,
        level: assessmentData.data.level,
        usage: assessmentData.data.usage,
        measure: assessmentData.data.measure,
        duration: assessmentData.data.duration,
        questionShuffle: assessmentData.data.questionShuffle,
        answerShuffle: assessmentData.data.answerShuffle,
        categoryShuffle: assessmentData.data.categoryShuffle,
      });
    }
  }, [assessmentData, form]);

  useEffect(() => {
    if (blocks) {
      const initialDurations = { ...blockDurations };
      const initialQuestionCounts = { ...blockQuestionCounts };
      let durationsUpdated = false;
      let questionCountsUpdated = false;

      const hasExistingDurations = blocks.some((block) => block.duration > 0);
      const hasSlicedBlocks = blocks.some((block) => block.sliced === true);

      setBlockDurationEnabled(hasExistingDurations);
      setQuestionCountEnabled(hasSlicedBlocks);

      blocks.forEach((block) => {
        if (initialDurations[block.id] === undefined) {
          initialDurations[block.id] = block.duration || 0;
          durationsUpdated = true;
        }

        if (initialQuestionCounts[block.id] === undefined) {
          initialQuestionCounts[block.id] =
            block.questionCount || block.questions.length;
          questionCountsUpdated = true;
        }
      });

      if (durationsUpdated) {
        setBlockDurations(initialDurations);
      }

      if (questionCountsUpdated) {
        setBlockQuestionCounts(initialQuestionCounts);
      }
    }
  }, [blocks]);

  const handleBlockDurationToggle = (checked) => {
    setBlockDurationEnabled(checked);

    if (!checked) {
      setBlocks((prevBlocks) =>
        prevBlocks.map((block) => ({
          ...block,
          duration: 0,
        }))
      );

      const resetDurations = {};
      blocks?.forEach((block) => {
        resetDurations[block.id] = 0;
      });
      setBlockDurations(resetDurations);

      const updatedBlocks = blocks.map((block) => ({
        ...block,
        duration: 0,
      }));

      handleFieldChange("duration", 0, updatedBlocks);
    }
  };

  const handleBlockDurationChange = (blockId, value) => {
    const duration = parseInt(value) || 0;

    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === blockId ? { ...block, duration } : block
      )
    );

    setBlockDurations((prev) => ({
      ...prev,
      [blockId]: duration,
    }));

    if (blockDurationEnabled) {
      const updatedDurations = {
        ...blockDurations,
        [blockId]: duration,
      };

      const totalDuration = blocks.reduce(
        (sum, block) => sum + (updatedDurations[block.id] || 0),
        0
      );

      const updatedBlocks = blocks.map((block) =>
        block.id === blockId ? { ...block, duration } : block
      );

      handleFieldChange("duration", totalDuration, updatedBlocks);
    }
  };

  const handleQuestionCountToggle = (checked) => {
    setQuestionCountEnabled(checked);

    const newBlocks = blocks.map((block) => ({
      ...block,
      sliced: checked,
      questionCount: !checked ? block.questions.length : block.questionCount,
    }));

    setBlocks(newBlocks);

    const newCounts = {};
    blocks.forEach((block) => {
      newCounts[block.id] = !checked
        ? block.questions.length
        : block.questionCount;
    });
    setBlockQuestionCounts(newCounts);

    let totalCount = 0;
    if (checked) {
      newBlocks.forEach((block) => {
        totalCount += block.questionCount;
      });
    } else {
      newBlocks.forEach((block) => {
        totalCount += block.questions.length;
      });
    }

    handleFieldChange("questionCount", totalCount, newBlocks);
  };

  const handleBlockQuestionCountChange = (blockId, value) => {
    const questionCount = parseInt(value) || 0;

    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === blockId ? { ...block, questionCount, sliced: true } : block
      )
    );

    setBlockQuestionCounts((prev) => ({
      ...prev,
      [blockId]: questionCount,
    }));

    const updatedBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, questionCount, sliced: true } : block
    );
    const totalCount = updatedBlocks.reduce(
      (total, block) => total + block.questionCount,
      0
    );

    handleFieldChange("questionCount", totalCount, updatedBlocks);
  };

  const handleDurationChange = (value) => {
    onUpdateAssessment({
      ...assessmentData,
      data: {
        ...assessmentData.data,
        duration: value || 0,
      },
    });
  };

  const handleFieldChange = (field, value, blocksToUpdate = null) => {
    if (onUpdateAssessment) {
      const updateObject = {
        ...assessmentData,
        data: {
          ...assessmentData.data,
          [field]: value,
        },
      };

      if (blocksToUpdate) {
        updateObject.blocks = blocksToUpdate;
      }

      onUpdateAssessment(updateObject);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map(
        (block, index) => ({
          ...block,
          order: index + 1,
        })
      );

      setBlocks(newBlocks);
    }
  };

  const renderGeneral = () => {
    const handleChange = async (info) => {
      if (info.file.status === "uploading") {
        setLoading(true);
        return;
      }

      if (info.file.status === "done") {
        try {
          const formData = new FormData();
          formData.append("files", info.file.originFileObj);
          const res = await imageUploader(formData);

          if (res && res[0]) {
            setImageUrl(res[0]);
            handleFieldChange("icons", res[0]);
          }
        } catch (error) {
          messageApi.error("Зураг хуулахад алдаа гарлаа");
        } finally {
          setLoading(false);
        }
      }
    };

    return (
      <div className="px-6 py-5 w-1/2">
        <div className="pr-36">
          <div className="px-1 pb-1">Тестийн нэр</div>
          <TestName
            testName={assessmentData?.data.name || ""}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setTestName={(value) => handleFieldChange("name", value)}
          />
        </div>
        <Divider />
        <div className="pr-36 pt-1">
          <div className="px-1 pb-2"> Тестийн ангилал</div>
          <div className="flex gap-4 pb-2">
            <Select
              value={selectedCategory?.id}
              options={assessmentCategories
                .filter((cate) => cate.parent == null)
                .map((cate) => ({
                  label: cate.name,
                  value: cate.id,
                }))}
              placeholder="Тестийн ангилал"
              suffixIcon={<DropdownIcon width={15} height={15} />}
              onChange={(value) => {
                const selectedCate = assessmentCategories.find(
                  (c) => c.id === value
                );
                setSelectedCategory({
                  id: selectedCate.id,
                  name: selectedCate.name,
                });
                setSelectedSubCategory(null);
                handleFieldChange("category", selectedCate);
              }}
            />
            <Select
              value={selectedSubCategory?.id}
              options={availableSubCategories.map((cate) => ({
                label: cate.name,
                value: cate.id,
              }))}
              placeholder="Дэд ангилал"
              suffixIcon={<DropdownIcon width={15} height={15} />}
              disabled={
                !selectedCategory || availableSubCategories.length === 0
              }
              onChange={(value) => {
                const selectedCate = availableSubCategories.find(
                  (c) => c.id === value
                );
                setSelectedSubCategory({
                  id: selectedCate.id,
                  name: selectedCate.name,
                });
                handleFieldChange("category", selectedCate);
              }}
            />
          </div>
        </div>
        <Divider />
        <div className="pr-36 pb-2">
          <div className="px-1 pb-2">Тестийн зураг</div>
          <div className="max-w-[300px]">
            <Upload
              beforeUpload={beforeUpload}
              accept="image/*"
              listType="picture"
              maxCount={1}
              onChange={handleChange}
              defaultFileList={
                imageUrl
                  ? [
                      {
                        uid: "-1",
                        name: "Тестийн зураг",
                        status: "done",
                        url: `${api}file/${imageUrl}`,
                      },
                    ]
                  : []
              }
              onRemove={() => {
                setImageUrl(null);
                handleFieldChange("icons", null);
              }}
            >
              {!assessmentData?.data?.icons && (
                <Button icon={<PlusOutlined />} className="the-btn">
                  Зураг оруулах
                </Button>
              )}
            </Upload>
          </div>
        </div>
        <Divider />
        <div className="pr-36 pb-2">
          <div className="px-1 pb-2">Тайлбар</div>
          <Form.Item
            name="description"
            validateTrigger={["onBlur", "onChange"]}
            rules={[
              {
                min: 140,
                message: "140-с дээш тэмдэгт оруулна уу.",
              },
            ]}
          >
            <TextArea
              rows={4}
              maxLength={240}
              showCount
              onChange={(e) => {
                const value = e.target.value;
                if (value.length >= 140) {
                  form.setFieldsValue({ description: value });
                  handleFieldChange("description", value);
                }
              }}
            />
          </Form.Item>

          {/* <TextArea
            rows={4}
            value={assessmentData?.data.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
          /> */}
        </div>
        <Divider />
        <div className="pr-36 pt-1">
          <div className="px-1 pb-2">Тестийн үнэ</div>
          <Form.Item name="price" validateTrigger={["onBlur", "onChange"]}>
            <InputNumber
              addonAfter="₮"
              className="w-[120px]!"
              min={0}
              onChange={(value) => {
                form.setFieldsValue({ price: value });
                handleFieldChange("price", value);
              }}
            />
          </Form.Item>
        </div>
      </div>
    );
  };

  const renderMore = () => (
    <div className="px-6 py-5 w-1/2">
      <div className="pr-36">
        <div className="px-1 pb-2">Тест зохиогч</div>
        <Form.Item name="author" validateTrigger={["onBlur", "onChange"]}>
          <Input
            className="w-[250px]!"
            onChange={(e) => {
              form.setFieldsValue({ author: e.target.value });
              handleFieldChange("author", e.target.value);
            }}
          />
        </Form.Item>
      </div>
      <Divider />
      <div className="pr-36 pb-6">
        <div className="px-1 pb-2">Хэрэглээ</div>
        <TextArea
          value={assessmentData?.data?.usage}
          rows={4}
          maxLength={240}
          showCount
          onChange={(e) => {
            form.setFieldsValue({ usage: e.target.value });
            handleFieldChange("usage", e.target.value);
          }}
        />
      </div>
      <Divider />
      <div className="pr-36 pb-2">
        <div className="px-1 pb-2">Хэмжих зүйлс</div>
        <TextArea
          value={assessmentData?.data?.measure}
          rows={4}
          maxLength={240}
          showCount
          onChange={(e) => {
            form.setFieldsValue({ measure: e.target.value });
            handleFieldChange("measure", e.target.value);
          }}
        />
      </div>
    </div>
  );

  const beforeUpload = (file) => {
    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      messageApi.error("1MB-c доош хэмжээтэй зураг оруулна уу.");
    }
    return isLt1M || Upload.LIST_IGNORE;
  };

  const renderOthers = () => {
    if (selected !== "others") return null;

    return (
      <div className="px-6 py-5 flex">
        {contextHolder}
        <div className="pr-36 w-1/2">
          <div className="px-1">Асуумжид хариулах заавар</div>

          <div className="border border-[#d9d9d9] rounded-3xl overflow-hidden relative mt-3">
            {editor && (
              <>
                <BubbleMenu
                  editor={editor}
                  tippyOptions={{ duration: 100 }}
                  shouldShow={({ editor, state }) => {
                    const { selection } = state;
                    return !selection.empty;
                  }}
                  className="bg-white"
                >
                  <FloatingMenu editor={editor} />
                </BubbleMenu>
                <div className="border-b border-neutral py-2 px-4 bg-neutral/20 flex justify-end">
                  <div className="text-gray-500 text-sm">
                    {editor.storage.characterCount.characters()}/1000 тэмдэгт •{" "}
                    {editor.storage.characterCount.words()} үг
                  </div>
                </div>
                <EditorContent editor={editor} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderShuffle = () => (
    <div className="px-7 py-5 w-3/5">
      <div className="pr-36">
        <div className="text-base font-bold">Асуулт холих</div>
        <div className="my-4">
          <div className="flex items-center gap-2">
            <Switch
              size="small"
              checked={assessmentData?.data.questionShuffle}
              onChange={(checked) =>
                handleFieldChange("questionShuffle", checked)
              }
            />
            <span>Блок харгалзахгүй бүх асуултуудыг холих</span>
          </div>
        </div>
        <Divider />
        <div className="flex items-center gap-2 mb-4">
          <Switch
            size="small"
            checked={assessmentData?.data.categoryShuffle}
            onChange={(checked) =>
              handleFieldChange("categoryShuffle", checked)
            }
          />
          <span>Зөвхөн блок доторх асуултууд холих</span>
        </div>
        <Divider />
        <div className="flex items-center gap-2 mb-4">
          <Switch
            size="small"
            checked={assessmentData?.data.answerShuffle}
            onChange={(checked) => handleFieldChange("answerShuffle", checked)}
          />
          <span>Хариултууд холих</span>
        </div>
        <Divider />
        <div className="text-base font-bold mt-4 mb-4">Блок хоорондын шилжилт</div>
        <div className="flex items-center gap-2 mb-4">
          <Switch
            size="small"
            checked={assessmentData?.data.blockNavigation ?? false}
            onChange={(checked) =>
              handleFieldChange("blockNavigation", checked)
            }
          />
          <span>Шалгуулагч блокуудын хооронд чөлөөтэй шилжих боломжтой</span>
        </div>
        <Divider />
        <div className="text-base font-bold mt-4 mb-4">Дүн харуулах</div>
        <div className="flex items-center gap-2 mb-4">
          <Switch
            size="small"
            checked={assessmentData?.data.showResultOnComplete ?? false}
            onChange={(checked) =>
              handleFieldChange("showResultOnComplete", checked)
            }
          />
          <span>Шалгалт дуусмагц шалгуулагч өөрийн хариуг харах боломжтой</span>
        </div>
      </div>
    </div>
  );

  const renderBlocks = () => (
    <div className="px-7 py-5 w-4/5">
      <div className="text-base font-bold">Блокууд</div>
      <div className="flex gap-6">
        <div className="w-full">
          <div className="pt-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    blockDurations={blockDurations}
                    blockQuestionCounts={blockQuestionCounts}
                    showDuration={blockDurationEnabled}
                    showQuestionCount={questionCountEnabled}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
        <div className="w-3/5 pt-4">
          <div className="border border-neutral rounded-3xl p-5 px-8 mb-4">
            <h4 className="font-bold mb-4">Хугацаа</h4>
            <div className="flex items-center gap-2 mb-4">
              <InputNumber
                disabled={blockDurationEnabled}
                value={
                  blockDurationEnabled
                    ? Object.values(blockDurations).reduce((a, b) => a + b, 0)
                    : assessmentData?.data.duration
                }
                onChange={handleDurationChange}
              />
              <span>минут</span>
            </div>
            <Divider />
            <div className="flex items-center gap-2">
              <Switch
                size="small"
                checked={testEndsOnTimeout}
                onChange={(checked) => {
                  setTestEndsOnTimeout(checked);
                  handleFieldChange("timeout", checked);
                }}
              />
              <span>Хугацаа дуусахад тест дуусна</span>
            </div>
            <Divider />
            <div className="flex items-center gap-2">
              <Switch
                size="small"
                checked={blockDurationEnabled}
                onChange={handleBlockDurationToggle}
              />
              <span>Блок тус бүр хугацаатай</span>
            </div>
            {blockDurationEnabled && blocks && blocks.length > 0 && (
              <div className="mt-4 space-y-3">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="justify-between flex items-center gap-2"
                  >
                    <span>{block.name}</span>
                    <div className="flex items-center gap-2">
                      <InputNumber
                        value={blockDurations[block.id] || 0}
                        onChange={(value) =>
                          handleBlockDurationChange(block.id, value)
                        }
                      />
                      <span>минут</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-neutral rounded-3xl p-5 px-8">
            <h4 className="font-bold mb-4">Асуултын тоо</h4>
            <div className="flex items-center gap-2">
              <Switch
                size="small"
                checked={questionCountEnabled}
                onChange={() =>
                  handleQuestionCountToggle(!questionCountEnabled)
                }
              />
              <span>Асуулт хэсэгчлэх</span>
            </div>
            {questionCountEnabled && blocks && blocks.length > 0 && (
              <div className="space-y-3 mt-4">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex justify-between items-center gap-2"
                  >
                    <span>{block.name}</span>
                    <div className="flex items-center gap-2">
                      <InputNumber
                        max={block.questions.length}
                        value={
                          blockQuestionCounts[block.id] ||
                          block.questions.length
                        }
                        onChange={(value) =>
                          handleBlockQuestionCountChange(block.id, value)
                        }
                      />
                      <span>асуулт</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const stats = [
    {
      icon: <AlarmBoldDuotone width={36} height={36} />,
      label: "Хугацаа",
      value:
        assessmentData.data?.duration > 0
          ? assessmentData.data?.duration + " " + "минут"
          : "Хугацаагүй",
    },
    {
      icon: <Flag2BoldDuotone width={36} height={36} />,
      label: "Түвшин",
      value: assessmentData.data?.level || "Хамаарахгүй",
    },
    {
      icon: <FolderCloudBoldDuotone width={36} height={36} />,
      label: "Тест банк",
      value: assessmentData.count,
    },
    {
      icon: <QuestionCircleBoldDuotone width={36} height={36} />,
      label: "Асуултын тоо",
      value: assessmentData.data?.questionCount,
    },
  ];

  const renderPreview = () => (
    <div className="p-5 gap-12">
      <div className="w-full">
        <div className="bg-gray-100 rounded-3xl border-neutral">
          <div className="relative overflow-hidden">
            <div className="-mt-2 absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-0 -right-10 sm:-right-8 lg:right-0 xl:right-[20px] 2xl:right-[150px] w-[600px] sm:w-[520px] md:w-[600px] lg:w-[600px] xl:w-[820px] 2xl:w-[880px] 3xl:w-[1000px] flex items-center justify-center">
                <div className="relative w-full pb-[50%]">
                  <Image
                    src="/halfcircle.png"
                    alt="Half circle"
                    fill
                    className="object-contain opacity-50 sm:opacity-100 z-[1]"
                    priority
                  />
                  <div className="absolute top-1 inset-x-0 h-[200px] sm:h-[150px] md:h-[150px] xl:h-[200px] 2xl:h-[250px] flex items-start justify-center overflow-hidden">
                    <Image
                      src={`${api}file/${assessmentData.data.icons}`}
                      alt="Assessment Icon"
                      width={600}
                      height={200}
                      className="w-[250px] sm:w-[250px] md:w-[320px] lg:w-[320px] xl:w-[420px] 2xl:w-[480px] object-top object-cover hidden sm:block"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative 2xl:px-48 lg:px-16 md:px-12 px-6 pt-5 pb-11 z-[3]">
              <div className="flex flex-col sm:flex-row gap-3 pt-12">
                <div className="text-main hidden sm:block -mt-0.5">
                  <SquareArrowRightDownBoldDuotone />
                </div>
                <div className="w-full sm:w-2/3">
                  <Breadcrumb
                    className="mb-3"
                    items={[
                      {
                        title: "Тестүүд",
                      },
                      {
                        title: assessmentData.category.name,
                      },
                    ]}
                  />

                  <h1 className="text-4xl font-black mb-4 w-3/4 w-3/4 xl:w-[80%] 2xl:w-[90%] bg-gradient-to-r from-main to-secondary bg-clip-text text-transparent">
                    {assessmentData.data.name}
                  </h1>
                  <div className="text-gray-700 mb-8 flex items-center gap-2">
                    <div className="text-main">
                      <BookBookmarkBoldDuotone width={18} height={18} />
                    </div>
                    {assessmentData.data.author || "Тест зохиогч"}
                    <div>•</div>
                    <div className="text-black font-bold">
                      {assessmentData.data.price > 0 ? (
                        <span>
                          {assessmentData.data.price.toLocaleString()}₮
                        </span>
                      ) : (
                        "Үнэгүй"
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 shadow shadow-slate-200 backdrop-blur-md rounded-3xl sm:rounded-full px-4 sm:px-14 py-6 inline-flex flex-wrap gap-7 sm:gap-10 justify-around w-fit relative overflow-hidden">
                <div className="absolute top-28 -right-8 sm:top-6 sm:right-0 w-[300px] sm:w-[220px] h-[220px]">
                  <Image
                    src="/brain-home.png"
                    alt="Brain icon"
                    fill
                    className="object-contain opacity-10 sm:opacity-20"
                    priority
                    draggable={false}
                  />
                </div>
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center min-w-[100px] relative z-10"
                  >
                    <div className="mb-2 text-main transition-transform hover:rotate-180 duration-700">
                      {stat.icon}
                    </div>
                    <div className="text-sm text-gray-700">{stat.label}</div>
                    <div className="font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>
              <div
                className={`w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-8`}
              >
                {[
                  {
                    icon: <ClipboardTextBoldDuotone width={18} />,
                    title: "Товч тайлбар",
                    content: assessmentData.data.description,
                  },
                  {
                    icon: <EyeBoldDuotone width={18} />,
                    title: "Хэмжих зүйлс",
                    content: assessmentData.data.measure,
                  },
                  {
                    icon: <CaseRoundMinimalisticBoldDuotone width={18} />,
                    title: "Хэрэглээ",
                    content: assessmentData.data.usage,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white/70 shadow shadow-slate-200 backdrop-blur-md rounded-3xl px-9 py-6 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute -right-12 -top-12 w-24 h-24 bg-main/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                    <div className="absolute right-20 -bottom-12 w-32 h-32 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative">
                      <h3 className="text-base font-extrabold mb-2 flex items-center gap-2 text-gray-700">
                        <p className="text-main">{item.icon}</p>
                        {item.title}
                      </h3>
                      <p className="text-gray-700 leading-5 relative z-10 text-justify line-clamp-6">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-12 hidden sm:flex">
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-main/50 to-main/70 rounded-full blur opacity-30 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-gradient-to-br from-main/30 to-secondary/20 rounded-full flex items-center justify-center border border-main/10">
                    <div className="font-extrabold bg-gradient-to-br from-main to-secondary bg-clip-text text-transparent py-2 px-7">
                      Худалдаж авах
                    </div>
                  </div>
                </div>
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-gray-600/50 to-gray-700/70 rounded-full blur opacity-30 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-gradient-to-br from-gray-400/30 to-gray-200/20 rounded-full flex items-center justify-center border border-gray-900/10">
                    <div className="font-extrabold bg-gradient-to-br from-gray-600 to-gray-700 bg-clip-text text-transparent py-2 px-7">
                      Жишиг тайлан харах
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-[47px]">
      {contextHolder}
      <div className="border-r border-neutral py-3 w-1/5 fixed h-screen">
        <div className="px-8 font-extrabold text-menu flex items-center gap-2 mt-1 text-[#6a6d70] pb-3 border-b border-neutral">
          <SettingsBoldDuotone width={16} />
          Ерөнхий мэдээлэл
        </div>
        {/* <Divider /> */}
        <div
          className={`px-8 py-3 hover:bg-gray-100 cursor-pointer ${
            selected === "general" ? "bg-gray-100" : ""
          }`}
          onClick={() => setSelected("general")}
        >
          <div className="font-bold">Ерөнхий мэдээлэл</div>
          <div className="text-[13px] pb-0.5">Тестийн нэр, тайлбар, төрөл</div>
        </div>
        <div
          className={`px-8 py-3 hover:bg-gray-100 border-t border-neutral cursor-pointer ${
            selected === "more" ? "bg-gray-100" : ""
          }`}
          onClick={() => setSelected("more")}
        >
          <div className="font-bold">Дэлгэрэнгүй мэдээлэл</div>
          <div className="text-[13px] pb-0.5">
            Хэмжих зүйлс, хэрэглээ, түвшин
          </div>
        </div>
        <div
          className={`px-8 py-3 hover:bg-gray-100 border-t border-neutral cursor-pointer ${
            selected === "others" ? "bg-gray-100" : ""
          }`}
          onClick={() => setSelected("others")}
        >
          <div className="font-bold">Заавар</div>
          <div className="text-[13px] pb-0.5">Асуумжид хариулах заавар</div>
        </div>
        <div
          className={`px-8 py-3 hover:bg-gray-100 border-t border-neutral cursor-pointer ${
            selected === "shuffle" ? "bg-gray-100" : ""
          }`}
          onClick={() => setSelected("shuffle")}
        >
          <div className="font-bold">Асуулт холих</div>
          <div className="text-[13px] pb-0.5">
            Асуулт, хариулт холих нөхцөлүүд
          </div>
        </div>
        <div
          className={`px-8 py-3 hover:bg-gray-100 border-t border-neutral cursor-pointer ${
            selected === "blocks" ? "bg-gray-100" : ""
          }`}
          onClick={() => setSelected("blocks")}
        >
          <div className="font-bold">Блокууд</div>
          <div className="text-[13px] pb-0.5">
            Дараалал, хугацаа, асуултын тоо
          </div>
        </div>
        <div
          className={`px-8 py-3 hover:bg-gray-100 border-t border-neutral cursor-pointer ${
            selected === "preview" ? "bg-gray-100" : ""
          }`}
          onClick={() => setSelected("preview")}
        >
          <div className="font-bold">Тестийн тойм</div>
          <div className="text-[13px] pb-0.5">Харагдах байдал</div>
        </div>
      </div>
      <div className="ml-[20%]">
        <Form form={form}>
          <div className={selected === "general" ? "" : "hidden"}>
            {renderGeneral()}
          </div>
          <div className={selected === "more" ? "" : "hidden"}>
            {renderMore()}
          </div>
          <div className={selected === "others" ? "" : "hidden"}>
            {renderOthers()}
          </div>
          <div className={selected === "shuffle" ? "" : "hidden"}>
            {renderShuffle()}
          </div>
          <div className={selected === "blocks" ? "" : "hidden"}>
            {renderBlocks()}
          </div>
          <div className={selected === "preview" ? "" : "hidden"}>
            {renderPreview()}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Settings;
