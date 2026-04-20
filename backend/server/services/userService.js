const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { toUserProfile } = require("./authService");

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return toUserProfile(user);
}

async function updateCurrentUser(userId, payload) {
  const { name, studentId } = payload || {};

  if (name === undefined && studentId === undefined) {
    throw new AppError(400, "Invalid parameters");
  }

  if (studentId) {
    const existingStudent = await prisma.user.findFirst({
      where: {
        studentId,
        NOT: { id: userId },
      },
    });

    if (existingStudent) {
      throw new AppError(400, "This student ID is already in use");
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
