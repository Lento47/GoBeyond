const fs = require("node:fs/promises");
const path = require("node:path");

const auditPath = path.join(__dirname, "store", "audit-log.ndjson");

async function appendAuditEvent(event) {
  await fs.mkdir(path.dirname(auditPath), { recursive: true });
  await fs.appendFile(auditPath, `${JSON.stringify(event)}\n`);
}

module.exports = {
  appendAuditEvent,
};
