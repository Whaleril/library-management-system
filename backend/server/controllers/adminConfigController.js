const adminConfigService = require("../services/adminConfigService");
const { sendSuccess } = require("../lib/response");

async function getConfig(req, res, next) {
  try {
    const data = await adminConfigService.getConfig();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function updateConfig(req, res, next) {
  try {
    const operatorId = req.currentUser ? req.currentUser.id : null;
    const data = await adminConfigService.updateConfig(operatorId, req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

// ==================== R2 新增接口 ====================
async function getDashboardMenu(req, res) {
  sendSuccess(res, [
    { key: "overview", label: "Overview" },
    { key: "user-manage", label: "User Manage" },
    { key: "librarian-manage", label: "Librarian Manage" },
    { key: "role-permission", label: "Role Permission" },
    { key: "system-config", label: "System Config" },
    { key: "audit-logs", label: "Audit Logs" }
  ]);
}

async function getSystemConfig(req, res) {
  sendSuccess(res, {
    borrowRules: { maxBorrowDays: 30, maxBorrowBooks: 5 },
    fineRules: { dailyFineRate: 1.00 }
  });
}

async function updateBorrowRules(req, res) {
  sendSuccess(res, { success: true, data: req.body });
}

async function updateFineRate(req, res) {
  sendSuccess(res, { success: true, data: req.body });
}

module.exports = {
  getConfig,
  updateConfig,
  getDashboardMenu,
  getSystemConfig,
  updateBorrowRules,
  updateFineRate
};