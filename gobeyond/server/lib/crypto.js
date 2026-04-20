const crypto = require("node:crypto");

async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key.toString("hex"));
    });
  });

  return `${salt}:${derivedKey}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const candidateHash = await hashPassword(password, salt);
  const [, actualHash] = candidateHash.split(":");

  return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(actualHash, "hex"));
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token, signingKey) {
  return crypto.createHmac("sha256", signingKey).update(token).digest("hex");
}

module.exports = {
  createOpaqueToken,
  hashPassword,
  hashToken,
  verifyPassword,
};
