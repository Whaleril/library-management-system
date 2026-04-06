const authService = require("../services/authService");
const { sendSuccess } = require("../lib/response");

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    sendSuccess(res, data, "注册成功");
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    sendSuccess(res, data, "登录成功");
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.authToken);
    sendSuccess(res, null, "已退出登录");
  } catch (error) {
    next(error);
  }
}

async function generateTempPassword(req, res, next) {
  try {
    const { email } = req.body;
    const data = await authService.generateTempPassword(email);
    sendSuccess(res, data, "临时密码生成成功");
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    const data = await authService.resetPassword(req.user.id, newPassword);
    sendSuccess(res, data, "密码重置成功");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  generateTempPassword,
  resetPassword,
};
