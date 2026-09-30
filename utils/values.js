import { Empty } from "antd";

export const AssessmentType = {
  TEST: 10,
  UNELGEE: 20,
};

export const QUESTION_TYPES = {
  SINGLE: 10,
  MULTIPLE: 20,
  TRUE_FALSE: 30,
  MATRIX: 40,
  CONSTANT_SUM: 50,
  TEXT: 60,
  SLIDER: 70,
  SLIDERSINGLE: 80,
  // Тоо оруулах: min/max, бутархай эсэх (question.settings). point = оруулсан тоо.
  NUMBER: 90,
  // Цаг/хугацаа (ЦЦ:ММ[:СС]): point = хугацаа settings.pointUnit нэгжээр (анхдагч минут).
  TIME: 100,
};

export const customLocale = {
  filterTitle: "Шүүлтүүр",
  filterConfirm: "Сонгох",
  filterReset: "Цэвэрлэх",
  // filterEmptyText: "Өгөгдөл олдсонгүй",
  filterCheckAll: "Бүгдийг сонгох",
  filterSearchPlaceholder: "Хайх",
  selectAll: "Энэ хуудсыг сонгох",
  selectInvert: "Сонголтыг эсрэгээр нь",
  selectNone: "Бүх сонгосныг арилгах",
  selectionAll: "Бүх өгөгдлийг сонгох",
  sortTitle: "Эрэмбэлэх",
  expand: "Мөр өргөтгөх",
  collapse: "Мөр хураах",
  triggerDesc: "Буурахаар эрэмбэлэх",
  triggerAsc: "Өсөхөөр эрэмбэлэх",
  cancelSort: "Эрэмбэлэлт цуцлах",
  emptyText: (
    <Empty
      description="Өгөгдөл олдсонгүй."
      className="py-6"
      image={Empty.PRESENTED_IMAGE_DEFAULT}
    />
  ),
};

export const getDefaultAnswers = (type, count = 4) => {
  if (type === QUESTION_TYPES.TRUE_FALSE) count = 2;
  if (
    type === QUESTION_TYPES.SLIDERSINGLE ||
    type === QUESTION_TYPES.NUMBER ||
    type === QUESTION_TYPES.TIME
  )
    count = 1;

  const templates = {
    [QUESTION_TYPES.SINGLE]: (i) => ({
      answer: {
        value: `Сонголт ${i + 1}`,
        point: 0,
        orderNumber: i,
        category: null,
        correct: false,
      },
    }),
    [QUESTION_TYPES.MULTIPLE]: (i) => ({
      answer: {
        value: `Сонголт ${i + 1}`,
        point: 0,
        orderNumber: i,
        category: null,
        correct: false,
      },
    }),
    [QUESTION_TYPES.TRUE_FALSE]: (i) => ({
      answer: {
        value: i === 0 ? "Үнэн" : "Худал",
        point: i === 0 ? 1 : 0,
        orderNumber: i,
        category: null,
      },
    }),
    [QUESTION_TYPES.MATRIX]: (i) => ({
      answer: {
        value: `Сонголт ${i + 1}`,
        point: 0,
        orderNumber: i,
        category: null,
      },
      matrix: Array.from({ length: count }, (_, j) => ({
        value: `Цэг ${j + 1}`,
        category: null,
        orderNumber: j,
      })),
    }),
    [QUESTION_TYPES.CONSTANT_SUM]: (i) => ({
      answer: {
        value: `Сонголт ${i + 1}`,
        orderNumber: i,
        category: null,
      },
    }),
    [QUESTION_TYPES.TEXT]: () => [],
    [QUESTION_TYPES.SLIDERSINGLE]: (i) => ({
      answer: {
        value: ``,
        orderNumber: i,
        category: null,
        point: 0,
      },
    }),
    // NUMBER / TIME: SLIDERSINGLE шиг ганц хариулт — зөвхөн хариултын ангилал тохируулахад.
    [QUESTION_TYPES.NUMBER]: (i) => ({
      answer: { value: ``, orderNumber: i, category: null, point: 0 },
    }),
    [QUESTION_TYPES.TIME]: (i) => ({
      answer: { value: ``, orderNumber: i, category: null, point: 0 },
    }),
    [QUESTION_TYPES.SLIDER]: (i) => ({
      answer: {
        value: `Сонголт ${i + 1}`,
        orderNumber: i,
        category: null,
        point: 0,
      },
    }),
  };

  if (type === QUESTION_TYPES.TEXT) return [];

  return Array.from({ length: count }, (_, i) => templates[type](i));
};

export const questionTypes = [
  { value: QUESTION_TYPES.SINGLE, label: "Нэг хариулттай" },
  { value: QUESTION_TYPES.MULTIPLE, label: "Олон хариулттай" },
  { value: QUESTION_TYPES.TRUE_FALSE, label: "Үнэн, худал" },
  { value: QUESTION_TYPES.TEXT, label: "Текст оруулах" },
  { value: QUESTION_TYPES.MATRIX, label: "Матриц" },
  { value: QUESTION_TYPES.CONSTANT_SUM, label: "Оноо байршуулах" },
  { value: QUESTION_TYPES.SLIDER, label: "Слайдер" },
  { value: QUESTION_TYPES.SLIDERSINGLE, label: "Сингл слайдер" },
  { value: QUESTION_TYPES.NUMBER, label: "Тоо оруулах" },
  { value: QUESTION_TYPES.TIME, label: "Цаг, хугацаа оруулах" },
];
