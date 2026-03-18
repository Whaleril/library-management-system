const bcrypt = require("bcrypt");

const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { issueToken, revokeToken } = require("../lib/token");
const { formatDateTime } = require("../utils/date");

function toUserProfile(user) {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    role: user.role,
    createdAt: formatDateTime(user.createdAt),
  };
}

async function register(payload) {
  const { name, email, password, studentId } = payload || {};

  if (!name || !email || !password) {
    throw new AppError(400, "参数错误");
  }

  const existingEmailUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmailUser) {
    throw new AppError(400, "该邮箱已被注册");
  }

  if (studentId) {
    const existingStudent = await prisma.user.findFirst({
      where: { studentId },
    });
    if (existingStudent) {
      throw new AppError(400, "该学号已被使用");
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      studentId: studentId || null,
      role: "STUDENT",
    },
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function login(payload) {
  const { userName, password } = payload || {};

  if (!userName || !password) {
    throw new AppError(400, "参数错误");
  }

  const user = await prisma.user.findUnique({
    where: { email: userName },
  });

  if (!user) {
    throw new AppError(401, "用户名或密码错误");
  }

  const passwordMatched = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatched) {
    throw new AppError(401, "用户名或密码错误");
  }

  const token = issueToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    userId: user.id,
    userName: user.email,
    role: user.role,
  };
}

async function logout(token) {
  if (!token) {
    throw new AppError(401, "未登录或 token 无效");
  }

  revokeToken(token);
}

module.exports = {
  register,
  login,
  logout,
  toUserProfile,
};
