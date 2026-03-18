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

module.exports = {
  register,
  login,
  logout,
};
