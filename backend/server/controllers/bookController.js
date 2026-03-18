const bookService = require("../services/bookService");
const { sendSuccess } = require("../lib/response");

async function searchBooks(req, res, next) {
  try {
    const data = await bookService.searchBooks(req.query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function getBookDetail(req, res, next) {
  try {
    const data = await bookService.getBookDetail(req.params.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchBooks,
  getBookDetail,
};
