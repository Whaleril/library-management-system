const holdService = require("../services/holdService");
const { sendSuccess } = require("../lib/response");


async function createHold(req, res, next) {
    try {
        const data = await holdService.createHold(req.currentUser.id, req.body.bookId);
        sendSuccess(res, data, "预约成功");
    } catch (error) {
        next(error);
    }
}


async function getHolds(req, res, next) {
    try {
        const { status, page, size } = req.query;

        const data = await holdService.getHolds(
            req.currentUser.id,
            status,
            page || 1,
            size || 10
        );

        sendSuccess(res, data, "操作成功");
    } catch (error) {
        next(error);
    }
}


async function cancelHold(req, res, next) {
    try {
        const holdId = req.params.id;

        await holdService.cancelHold(req.currentUser.id, holdId);

        sendSuccess(res, null, "已取消预约");
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createHold,
    getHolds,
    cancelHold
};