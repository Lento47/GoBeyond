const fs = require("node:fs/promises");
const path = require("node:path");

async function readJson(relativePath, fallbackValue) {
  const absolutePath = path.join(__dirname, "..", relativePath);

  try {
    const content = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeJson(relativePath, fallbackValue);
      return fallbackValue;
    }

    throw error;
  }
}

async function writeJson(relativePath, value) {
  const absolutePath = path.join(__dirname, "..", relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, JSON.stringify(value, null, 2));
  return value;
}

module.exports = {
  readJson,
  writeJson,
};
