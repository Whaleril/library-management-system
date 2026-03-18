const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { verifyToken } = require("../lib/token");

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      throw new AppError(401, "未登录或 token 无效");
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      throw new AppError(401, "未登录或 token 无效");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError(401, "未登录或 token 无效");
    }

    req.authToken = token;
    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
};
