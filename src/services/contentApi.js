const API_BASE_URL = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    method: options.method ?? "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseText = await response.text();
  let payload = {};

  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const fallbackMessage =
      responseText && !responseText.trim().startsWith("<")
        ? responseText
        : `Error de red (${response.status}).`;
    throw new Error(payload.error || fallbackMessage);
  }

  return payload;
}

export async function fetchPublicContent() {
  return request("/public/content");
}

export async function submitPublicTestimonial(payload) {
  return request("/public/testimonials", {
    method: "POST",
    body: payload,
  });
}

export async function fetchAdminContent(token) {
  return request("/admin/content", { token });
}

export async function updateAdminSection(token, section, value) {
  return request(`/admin/content/${section}`, {
    method: "PUT",
    token,
    body: value,
  });
}

export async function createAdminCollectionItem(token, section, item) {
  return request(`/admin/collections/${section}`, {
    method: "POST",
    token,
    body: item,
  });
}

export async function uploadAdminAsset(token, file, purpose) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);

  const response = await fetch(`${API_BASE_URL}/admin/uploads`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo subir el archivo.");
  }

  return payload;
}

export async function deleteAdminCollectionItem(token, section, id) {
  return request(`/admin/collections/${section}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

export async function updateAdminCollectionItem(token, section, id, item) {
  return request(`/admin/collections/${section}?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: item,
  });
}

export async function bootstrapAdmin(payload) {
  return request("/auth/bootstrap", {
    method: "POST",
    body: payload,
  });
}

export async function loginAdmin(payload) {
  return request("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerStudent(payload) {
  return request("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function requestPasswordReset(payload) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export async function requestEmailVerification(payload) {
  return request("/auth/send-verification", {
    method: "POST",
    body: payload,
  });
}

export async function resetPassword(payload) {
  return request("/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}

export async function verifyEmail(payload) {
  return request("/auth/verify-email", {
    method: "POST",
    body: payload,
  });
}

export async function fetchCurrentUser(token) {
  return request("/auth/me", {
    token,
  });
}

export async function logoutAdmin(token) {
  return request("/auth/logout", {
    method: "POST",
    token,
  });
}

export async function fetchStudentDashboard(token) {
  return request("/student/dashboard", {
    token,
  });
}

export async function askStudentAssistant(token, payload) {
  return request("/student/chat", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function createStudentTicket(token, payload) {
  return request("/student/tickets", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function createStudentCourseRequest(token, payload) {
  return request("/student/course-requests", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function fetchStudentCommunity(token) {
  return request("/student/community", {
    token,
  });
}

export async function createStudentCommunityThread(token, payload) {
  return request("/student/community", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateStudentCommunityThread(token, threadId, payload) {
  return request(`/student/community/${encodeURIComponent(threadId)}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function createStudentCommunityReply(token, threadId, payload) {
  return request(`/student/community/${encodeURIComponent(threadId)}`, {
    method: "PUT",
    token,
    body: {
      ...payload,
      action: "reply",
    },
  });
}

export async function fetchAdminUsers(token) {
  return request("/admin/users", { token });
}

export async function createAdminUser(token, payload) {
  return request("/admin/users", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateAdminUser(token, userId, payload) {
  return request(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function deleteAdminUser(token, userId) {
  return request(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    token,
  });
}

export async function setAdminUserPassword(token, userId, payload) {
  return request(`/admin/users/${encodeURIComponent(userId)}/password`, {
    method: "POST",
    token,
    body: payload,
  });
}

export async function sendAdminUserPasswordReset(token, userId) {
  return request(`/admin/users/${encodeURIComponent(userId)}/password-reset`, {
    method: "POST",
    token,
  });
}

export async function sendAdminUserVerification(token, userId) {
  return request(`/admin/users/${encodeURIComponent(userId)}/verification`, {
    method: "POST",
    token,
  });
}

export async function fetchAdminEnrollments(token) {
  return request("/admin/enrollments", { token });
}

export async function createAdminEnrollment(token, payload) {
  return request("/admin/enrollments", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateAdminEnrollment(token, enrollmentId, payload) {
  return request(`/admin/enrollments/${encodeURIComponent(enrollmentId)}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function deleteAdminEnrollment(token, enrollmentId) {
  return request(`/admin/enrollments/${encodeURIComponent(enrollmentId)}`, {
    method: "DELETE",
    token,
  });
}
