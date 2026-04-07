const prisma = require("../db/prisma");
const { formatDateTime } = require("../utils/date"); 
const { AppError } = require("../lib/errors");
const bcrypt = require("bcrypt"); // 记得确认项目 package.json 里有没有 bcrypt，没有需 npm install bcrypt

// DTO 转换：按照设计文档返回规范的 LibrarianDTO 格式
const toLibrarianDTO = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    staffId: user.studentId, 
    role: user.role,
    createdAt: formatDateTime(user.createdAt), 
  };
};

async function createLibrarian(operatorId, payload) {
  const { name, email, password, staffId } = payload;

  // 1. 基础校验
  if (!name || !email || !password || !staffId) {
    throw new AppError(400, "参数缺失/格式错误");
  }

  // 2. 校验邮箱唯一性
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    throw new AppError(400, "该 email 已被注册");
  }

  // 3. 校验工号唯一性 (注意：查的是 studentId 字段)
  const existingStaff = await prisma.user.findFirst({
    where: { studentId: staffId },
  });
  if (existingStaff) {
    throw new AppError(400, "该 staffId 已存在");
  }

  // 4. 密码加密
  const passwordHash = await bcrypt.hash(password, 10);

  // 5. 存入数据库
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      studentId: staffId,
      role: "LIBRARIAN",
    },
  });

  return toLibrarianDTO(newUser);
}

async function updateLibrarian(operatorId, librarianId, payload) {
  const { name, email, staffId } = payload;

  // 1. 查找是否存在且为 LIBRARIAN 角色
  const librarian = await prisma.user.findUnique({
    where: { id: librarianId },
  });

  if (!librarian || librarian.role !== "LIBRARIAN") {
    throw new AppError(404, "目标资源不存在");
  }

  // 2. 如果修改了 email，检查新 email 是否冲突
  if (email && email !== librarian.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new AppError(400, "新 email 已被使用");
    }
  }

  // 3. 如果修改了 staffId，检查新 staffId 是否冲突 (排除自身)
  if (staffId && staffId !== librarian.studentId) {
    const existingStaff = await prisma.user.findFirst({
      where: {
        studentId: staffId,
        NOT: { id: librarianId },
      },
    });
    if (existingStaff) {
      throw new AppError(400, "新 staffId 已被使用");
    }
  }

  // 4. 执行更新 (按照你们 userService.js 的高级解构写法)
  const updatedUser = await prisma.user.update({
    where: { id: librarianId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(staffId !== undefined ? { studentId: staffId } : {}),
    },
  });

  return toLibrarianDTO(updatedUser);
}

module.exports = {
  createLibrarian,
  updateLibrarian,
};