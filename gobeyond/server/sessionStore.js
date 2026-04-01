const { readJson, writeJson } = require("./stores/jsonStore");

const sessionsPath = "store/sessions.json";

async function readSessions() {
  return readJson(sessionsPath, []);
}

async function writeSessions(sessions) {
  return writeJson(sessionsPath, sessions);
}

async function createSession(session) {
  const sessions = await readSessions();
  sessions.push(session);
  await writeSessions(sessions);
  return session;
}

async function findSessionByHash(tokenHash) {
  const sessions = await readSessions();
  return sessions.find((session) => session.tokenHash === tokenHash) ?? null;
}

async function deleteSessionByHash(tokenHash) {
  const sessions = await readSessions();
  const nextSessions = sessions.filter((session) => session.tokenHash !== tokenHash);
  await writeSessions(nextSessions);
}

module.exports = {
  createSession,
  deleteSessionByHash,
  findSessionByHash,
};
