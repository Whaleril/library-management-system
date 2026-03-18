const crypto = require("crypto");

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const secret = process.env.AUTH_TOKEN_SECRET || "library-reader-secret";
const activeTokens = new Set();

function encode(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signSegment(segment) {
  return crypto.createHmac("sha256", secret).update(segment).digest("base64url");
}

function issueToken(payload) {
  const fullPayload = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const body = encode(fullPayload);
  const signature = signSegment(body);
  const token = `${body}.${signature}`;

  activeTokens.add(token);

  return token;
}

function verifyToken(token) {
  if (!token || !activeTokens.has(token)) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = signSegment(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = decode(body);
  if (!payload.exp || payload.exp < Date.now()) {
    activeTokens.delete(token);
    return null;
  }

  return payload;
}

function revokeToken(token) {
  activeTokens.delete(token);
}

module.exports = {
  issueToken,
  verifyToken,
  revokeToken,
};
