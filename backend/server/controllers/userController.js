const userService = require("../services/userService");
const { sendSuccess } = require("../lib/response");

async function getCurrentUser(req, res, next) {
  try {
    const data = await userService.getCurrentUser(req.currentUser.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function updateCurrentUser(req, res, next) {
  try {
    const data = await userService.updateCurrentUser(req.currentUser.id, req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};
