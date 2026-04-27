"use server";
import { api } from "@/utils/routes";
import { getAuthToken } from "@/utils/auth";

export const createAssessment = async (values) => {
  const token = await getAuthToken();
  if (!token) return { token: false };
  try {
    const body = {
      name: values.name,
      description: values.description,
      measure: values.measure,
      usage: values.usage,
      duration: values.duration,
      price: values.price,
      function: values.function,
      advice: values.advice,
      author: values.author,
      type: values.type,
      questionShuffle: values.questionShuffle,
      answerShuffle: values.answerShuffle,
      questionCount: values.questionCount,
      level: values.level,
      category: values.category,
      icons: values.icons,
      answerCategories: values.answerCategories,
      status: 20,
    };
    const res = await fetch(`${api}assessment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((d) => d.json());

    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const getAssessments = async ({
  limit = 10,
  page = 1,
  type,
  status,
  name,
  category,
  createdUser,
} = {}) => {
  const token = await getAuthToken();
  if (!token) return { token: false };

  try {
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("page", page);
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (name) params.append("name", name);
    if (category) params.append("category", category);
    if (createdUser) params.append("createdUser", createdUser);

    const res = await fetch(`${api}assessment/all?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).then((d) => d.json());

    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const getAssessmentsNew = async ({
  limit = 10,
  page = 1,
  type,
  status,
  name,
  category,
  createdUser,
  sortBy = "updatedAt",
  sortDir = "DESC",
} = {}) => {
  const token = await getAuthToken();
  if (!token) return { token: false };

  try {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("page", String(page));
    params.append("sortBy", sortBy);
    params.append("sortDir", sortDir);

    if (type) params.append("type", String(type));
    if (status) params.append("status", String(status));
    if (name) params.append("name", name);
    if (category) params.append("category", String(category));
    if (createdUser) params.append("createdUser", String(createdUser));

    const res = await fetch(`${api}assessment/new?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }).then((d) => d.json());

    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const getAssessmentCategory = async () => {
  try {
    const res = await fetch(`${api}assessmentCategory`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const deleteAssessmentById = async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { token: false };
    const res = await fetch(`${api}assessment/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const updateAssessmentById = async (id, values) => {
  const token = await getAuthToken();
  if (!token) return { token: false };

  try {
    const res = await fetch(`${api}assessment/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(values),
    }).then((d) => d.json());

    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const createNewCategory = async ({ name, parent }) => {
  try {
    const token = await getAuthToken();
    if (!token) return { token: false };

    const res = await fetch(`${api}assessmentCategory`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, parent }),
    }).then((d) => d.json());

    return {
      data: res.payload,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const getAssessmentById = async (id) => {
  const token = await getAuthToken();
  if (!token) return { token: false };
  try {
    const res = await fetch(`${api}assessment/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const getQuestionsByAssessmentId = async (id) => {
  const token = await getAuthToken();
  if (!token) return { token: false };

  try {
    const res = await fetch(`${api}question/assessment/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const createQuestionCategory = async (values) => {
  const token = await getAuthToken();
  if (!token) return { token: false };
  try {
    const body = {
      name: values.name,
      value: values.value,
      duration: values.duration,
      totalPrice: values.totalPrice,
      questionCount: values.questionCount,
      orderNumber: values.orderNumber,
      assessment: values.assessment,
    };
    const res = await fetch(`${api}question/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.payload?.message,
      status: res?.payload?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const createQuestion = async (values) => {
  const token = await getAuthToken();
  if (!token) return { token: false };
  try {
    const body = {
      category: values.category,
      type: values.type,
      question: values.question,
      answers: values.answers,
    };
    const res = await fetch(`${api}question/all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.payload?.message,
      status: res?.payload?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};
export const deleteQuestionCategoryById = async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { token: false };
    const res = await fetch(`${api}question/category/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const deleteQuestionById = async (id) => {
  try {
    const token = await getAuthToken();
    if (!token) return { token: false };
    const res = await fetch(`${api}question/question/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const updateQuestions = async (questionData) => {
  const token = await getAuthToken();
  if (!token) return { token: false };

  try {
    const res = await fetch(`${api}question/all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: questionData.id,
        category: questionData.category,
        type: questionData.type,
        question: questionData.question,
        answers: questionData.answers,
      }),
    }).then((d) => d.json());

    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const updateQuestionCategory = async (updates) => {
  const token = await getAuthToken();
  if (!token) return { token: false };

  try {
    const res = await fetch(`${api}question/category`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }).then((d) => d.json());

    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};
export const deleteAnswerById = async (dto, matrix) => {
  try {
    const token = await getAuthToken();
    if (!token) return { token: false };
    const m = matrix == false ? 0 : matrix;
    const res = await fetch(`${api}question/answer/${m}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: dto,
      }),
    }).then((d) => d.json());
    return {
      data: res.payload,
      token: true,
      message: res?.message,
      status: res?.status,
      success: res.succeed,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};

export const getReport = async (code) => {
  try {
    const token = await getAuthToken();
    if (!token) return { token: false };

    const response = await fetch(`${api}exam/pdf/${code}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const blob = await response.blob();

    return {
      data: blob,
      token: true,
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error.message || "Сервертэй холбогдоход алдаа гарлаа.",
    };
  }
};
