const loanService = require("../services/loanService");
const { sendSuccess } = require("../lib/response");

async function getCurrentLoans(req, res, next) {
  try {
    const data = await loanService.getCurrentLoans(req.currentUser.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function createLoan(req, res, next) {
  try {
    const data = await loanService.createLoan(req.currentUser.id, req.body);
    sendSuccess(res, data, "借阅成功");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentLoans,
  createLoan,
};
