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

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Error de red.");
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
