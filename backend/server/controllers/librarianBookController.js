const librarianBookService = require("../services/librarianBookService");
const { sendSuccess } = require("../lib/response");

async function createBook(req, res, next) {
  try {
    const data = await librarianBookService.createBook(req.body);
    sendSuccess(res, data, "图书创建成功");
  } catch (error) {
    next(error);
  }
}

async function updateBook(req, res, next) {
  try {
    const data = await librarianBookService.updateBook(req.params.id, req.body);
    sendSuccess(res, data, "图书更新成功");
  } catch (error) {
    next(error);
  }
}

async function listInventory(req, res, next) {
  try {
    const data = await librarianBookService.listInventory(req.query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function archiveBook(req, res, next) {
  try {
    const data = await librarianBookService.archiveBook(req.params.id, req.currentUser?.id);
    sendSuccess(res, data, "图书归档成功");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBook,
  updateBook,
  listInventory,
  archiveBook,
};
