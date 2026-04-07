const adminUserService = require("../services/adminUserService");
const { sendSuccess } = require("../lib/response");

async function resetUserPassword(req, res, next) {
  try {
    const { id: targetUserId } = req.params;
    const payload = req.body || {};
    const data = await adminUserService.resetUserPassword(req.currentUser.id, targetUserId, payload);
    sendSuccess(res, data, "密码重置成功");
  } catch (error) {
    next(error);
  }
}

async function createLibrarian(req, res, next) {
  try {
    // 获取操作人 ID (假设中间件会注入 req.currentUser)
    const operatorId = req.currentUser ? req.currentUser.id : null;
    
    // 调用 service 处理业务
    const data = await adminUserService.createLibrarian(operatorId, req.body);
    
    // 按你们团队统一的格式返回成功响应
    sendSuccess(res, data);
  } catch (error) {
    next(error); // 抛出错误给统一的错误中间件
  }
}

async function updateLibrarian(req, res, next) {
  try {
    const operatorId = req.currentUser ? req.currentUser.id : null;
    const librarianId = req.params.id; // 从 URL 获取 :id
    
    const data = await adminUserService.updateLibrarian(operatorId, librarianId, req.body);
    
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createLibrarian,
  updateLibrarian,
  resetUserPassword,
};