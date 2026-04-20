const { readJson, writeJson } = require("./stores/jsonStore");

const usersPath = "store/users.json";

async function readUsers() {
  return readJson(usersPath, []);
}

async function writeUsers(users) {
  return writeJson(usersPath, users);
}

async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find((user) => user.email === email) ?? null;
}

async function findUserById(id) {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
}

async function createUser(user) {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  return user;
}

async function hasAdminUser() {
  const users = await readUsers();
  return users.some((user) => user.role === "admin");
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  hasAdminUser,
};
