// Дэд бүлэг (хариултын ангилал, questionAnswerCategory)-ийн ДУГААР — Studio / тайлангийн
// {{answerCategory[i].…}}, {{i-р дэд бүлгийн …}}, {{custom.x[i]}}-тэй ИЖИЛ: id-аар эрэмбэлж
// 1-ээс дугаарлана (hire_report loadAnswerCategories ORDER BY id, studio useTestCategories).

export const sortedAnswerCategories = (list) =>
  [...(list || [])].sort((a, b) => Number(a?.id) - Number(b?.id));

export const answerCategoryNumber = (list, id) => {
  if (id == null) return null;
  const want = Number(typeof id === "object" ? id?.id : id);
  const i = sortedAnswerCategories(list).findIndex((c) => Number(c?.id) === want);
  return i >= 0 ? i + 1 : null;
};

// "3. Ажил — өндөр эрчим" — дугаар олдохгүй бол нэр л.
export const answerCategoryLabel = (list, id, name) => {
  const n = answerCategoryNumber(list, id);
  return n ? `${n}. ${name ?? ""}` : name ?? "";
};
