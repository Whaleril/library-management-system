const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const bcrypt = require("bcrypt");

function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function validatePassword(password) {
  if (!password || password.length < 8 || password.length > 32) {
    throw new AppError(400, "密码长度必须在8-32之间");
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new AppError(400, "密码必须至少包含字母和数字");
  }
}

async function resetUserPassword(operatorId, targetUserId, payload) {
  if (!operatorId || !targetUserId) {
    throw new AppError(400, "参数错误");
  }

  const operator = await prisma.user.findUnique({
    where: { id: operatorId },
  });

  if (!operator) {
    throw new AppError(404, "操作人不存在");
  }

  if (operator.role !== "ADMIN") {
    throw new AppError(403, "无权限执行此操作");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AppError(404, "用户不存在");
  }

  let newPassword;
  let tempPassword = null;
  
  if (payload.newPassword) {
    validatePassword(payload.newPassword);
    newPassword = payload.newPassword;
  } else {
    newPassword = generateRandomPassword();
    tempPassword = newPassword;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash },
  });

  return {
    userId: targetUser.id,
    tempPassword,
  };
}

module.exports = {
  resetUserPassword,
};