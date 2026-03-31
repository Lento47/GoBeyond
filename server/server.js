const http = require("node:http");
const { URL } = require("node:url");
const { appendAuditEvent } = require("./auditStore");
const { authenticateRequest, bootstrapAdmin, login, logout, requireRole, sanitizeUser } = require("./authService");
const { config } = require("./config");
const { appendItem, readContent, removeItem, updateSection } = require("./contentStore");
const { assertOrigin, enforceRateLimit, getIpAddress, readBody, sendJson } = require("./lib/http");
const { validateRequiredString } = require("./lib/validation");

function projectPublicContent(content) {
  return {
    brand: content.brand,
    hero: content.hero,
    benefits: content.benefits,
    liveSessions: content.liveSessions,
    learningPath: content.learningPath,
    accessTimeline: content.accessTimeline,
    subscription: content.subscription,
    communityStats: content.communityStats,
  };
}

function validateContentSection(section, value) {
  switch (section) {
    case "brand":
      return {
        name: validateRequiredString(value.name, "Brand name", 120),
        tagline: validateRequiredString(value.tagline, "Brand tagline", 255),
        description: validateRequiredString(value.description, "Brand description", 1200),
      };
    case "hero":
      return {
        eyebrow: validateRequiredString(value.eyebrow, "Hero eyebrow", 120),
        title: validateRequiredString(value.title, "Hero title", 255),
        description: validateRequiredString(value.description, "Hero description", 1200),
        metrics: Array.isArray(value.metrics) ? value.metrics : [],
      };
    default:
      return value;
  }
}

function validateCollectionItem(section, item) {
  if (section === "liveSessions") {
    return {
      id: item.id,
      title: validateRequiredString(item.title, "Titulo", 255),
      date: validateRequiredString(item.date, "Fecha", 255),
      format: validateRequiredString(item.format, "Formato", 64),
    };
  }

  if (section === "learningPath") {
    return {
      id: item.id,
      title: validateRequiredString(item.title, "Titulo", 255),
      type: validateRequiredString(item.type, "Tipo", 64),
      status: validateRequiredString(item.status, "Estado", 128),
    };
  }

  return item;
}

async function handleAuthenticatedAdmin(request, response, url) {
  const ipAddress = getIpAddress(request);
  const auth = await authenticateRequest(request);
  requireRole(auth.user, ["admin"]);

  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    sendJson(response, 200, {
      user: sanitizeUser(auth.user),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    await logout(auth.rawToken, auth.user.id, ipAddress);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/content") {
    const content = await readContent();
    sendJson(response, 200, content);
    return;
  }

  if (request.method === "PUT" && url.pathname.startsWith("/api/admin/content/")) {
    const section = url.pathname.replace("/api/admin/content/", "");
    const body = await readBody(request);
    const safeValue = validateContentSection(section, body);
    const content = await updateSection(section, safeValue);

    await appendAuditEvent({
      type: "content.update_section",
      actorUserId: auth.user.id,
      ipAddress,
      section,
      createdAt: new Date().toISOString(),
    });

    sendJson(response, 200, content);
    return;
  }

  if (request.method === "POST" && url.pathname.startsWith("/api/admin/collections/")) {
    const section = url.pathname.replace("/api/admin/collections/", "");
    const body = await readBody(request);
    const safeItem = validateCollectionItem(section, body);
    const content = await appendItem(section, safeItem);

    await appendAuditEvent({
      type: "content.create_item",
      actorUserId: auth.user.id,
      ipAddress,
      section,
      createdAt: new Date().toISOString(),
    });

    sendJson(response, 201, content);
    return;
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/api/admin/collections/")) {
    const section = url.pathname.replace("/api/admin/collections/", "");
    const id = url.searchParams.get("id");

    if (!id) {
      sendJson(response, 400, { error: "Falta el id." });
      return;
    }

    const content = await removeItem(section, id);

    await appendAuditEvent({
      type: "content.delete_item",
      actorUserId: auth.user.id,
      ipAddress,
      section,
      entityId: id,
      createdAt: new Date().toISOString(),
    });

    sendJson(response, 200, content);
    return;
  }

  sendJson(response, 404, { error: "Ruta no encontrada." });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${config.port}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  try {
    assertOrigin(request);
    enforceRateLimit(request);
    const ipAddress = getIpAddress(request);

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/public/content") {
      const content = await readContent();
      sendJson(response, 200, projectPublicContent(content));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/bootstrap") {
      const body = await readBody(request);
      const user = await bootstrapAdmin({
        email: body.email,
        password: body.password,
        fullName: body.fullName,
        setupSecret: body.setupSecret,
        ipAddress,
      });
      sendJson(response, 201, { user });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(request);
      const session = await login({
        email: body.email,
        password: body.password,
        ipAddress,
      });
      sendJson(response, 200, session);
      return;
    }

    if (
      url.pathname.startsWith("/api/admin/") ||
      url.pathname === "/api/auth/me" ||
      url.pathname === "/api/auth/logout"
    ) {
      await handleAuthenticatedAdmin(request, response, url);
      return;
    }

    sendJson(response, 404, { error: "Ruta no encontrada." });
  } catch (error) {
    sendJson(response, error.statusCode ?? 500, {
      error: error.message || "Error interno del servidor.",
    });
  }
});

server.listen(config.port, () => {
  console.log(`GoBeyond API escuchando en http://localhost:${config.port}`);
});
