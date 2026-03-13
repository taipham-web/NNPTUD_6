const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

function getJwtConfig() {
  const privateKey = getPrivateKey();
  const publicKey = getPublicKey();

  return {
    algorithm: "RS256",
    privateKey,
    publicKey,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  };
}

function normalizeMultilineKey(value) {
  if (!value) return "";
  return value.replace(/\\n/g, "\n").trim();
}

function readKeyByPath(keyPath) {
  if (!keyPath) return "";
  const normalizedPath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(process.cwd(), keyPath);
  if (!fs.existsSync(normalizedPath)) return "";
  return fs.readFileSync(normalizedPath, "utf8").trim();
}

function getPrivateKey() {
  const keyFromEnv = normalizeMultilineKey(process.env.JWT_PRIVATE_KEY);
  if (keyFromEnv) return keyFromEnv;

  const keyFromPath = readKeyByPath(process.env.JWT_PRIVATE_KEY_PATH);
  if (keyFromPath) return keyFromPath;

  throw new Error(
    "Missing JWT private key. Set JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH.",
  );
}

function getPublicKey() {
  const keyFromEnv = normalizeMultilineKey(process.env.JWT_PUBLIC_KEY);
  if (keyFromEnv) return keyFromEnv;

  const keyFromPath = readKeyByPath(process.env.JWT_PUBLIC_KEY_PATH);
  if (keyFromPath) return keyFromPath;

  throw new Error(
    "Missing JWT public key. Set JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH.",
  );
}

module.exports = {
  RandomToken: function (length) {
    let result = "";
    let source =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let index = 0; index < length; index++) {
      let ran = Math.floor(Math.random() * source.length);
      result += source.charAt(ran);
    }
    return result;
  },

  CreateAccessToken: function (user) {
    const { privateKey, expiresIn, algorithm } = getJwtConfig();
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      tokenVersion: user.tokenVersion || 0,
    };
    return jwt.sign(payload, privateKey, {
      algorithm,
      expiresIn,
    });
  },

  VerifyAccessToken: function (token) {
    const { publicKey, algorithm } = getJwtConfig();
    return jwt.verify(token, publicKey, {
      algorithms: [algorithm],
    });
  },
};
