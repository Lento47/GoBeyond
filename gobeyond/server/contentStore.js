const fs = require("node:fs/promises");
const path = require("node:path");

const storePath = path.join(__dirname, "store", "content-store.json");

async function readContent() {
  const content = await fs.readFile(storePath, "utf8");
  return JSON.parse(content);
}

async function writeContent(nextContent) {
  await fs.writeFile(storePath, JSON.stringify(nextContent, null, 2));
  return nextContent;
}

async function updateSection(section, value) {
  const current = await readContent();
  const next = {
    ...current,
    [section]: value,
  };

  return writeContent(next);
}

async function appendItem(section, item) {
  const current = await readContent();
  const next = {
    ...current,
    [section]: [...(current[section] ?? []), item],
  };

  return writeContent(next);
}

async function removeItem(section, id) {
  const current = await readContent();
  const next = {
    ...current,
    [section]: (current[section] ?? []).filter((item) => item.id !== id),
  };

  return writeContent(next);
}

module.exports = {
  appendItem,
  readContent,
  removeItem,
  updateSection,
};
