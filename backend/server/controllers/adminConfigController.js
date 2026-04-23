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

module.exports = {
  getConfig,
  updateConfig,
};
