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

module.exports = {
  resetUserPassword,
};