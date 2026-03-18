const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { toUserProfile } = require("./authService");

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "用户不存在");
  }

  return toUserProfile(user);
}

async function updateCurrentUser(userId, payload) {
  const { name, studentId } = payload || {};

  if (name === undefined && studentId === undefined) {
    throw new AppError(400, "参数错误");
  }

  if (studentId) {
    const existingStudent = await prisma.user.findFirst({
      where: {
        studentId,
        NOT: { id: userId },
      },
    });

    if (existingStudent) {
      throw new AppError(400, "该学号已被使用");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(studentId !== undefined ? { studentId } : {}),
    },
  });

  return toUserProfile(user);
}

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};
