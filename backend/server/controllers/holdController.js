const holdService = require("../services/holdService");
const { sendSuccess } = require("../lib/response");


async function createHold(req, res, next) {
    try {
        const data = await holdService.createHold(req.currentUser.id, req.body.bookId);
        sendSuccess(res, data, "Reservation successful");
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

        sendSuccess(res, data, "Operation successful");
    } catch (error) {
        next(error);
    }
}


async function cancelHold(req, res, next) {
    try {
        const holdId = req.params.id;

        const data = await holdService.cancelHold(req.currentUser.id, holdId);

        sendSuccess(res, data, "Reservation cancelled");
    } catch (error) {
        next(error);
    }
}

async function getLibrarianHolds(req, res, next) {
    try {
        const data = await holdService.getLibrarianHolds(req.query);

        sendSuccess(res, data, "Operation successful");
    } catch (error) {
        next(error);
    }
}

async function markHoldReady(req, res, next) {
    try {
        const data = await holdService.markHoldReady(req.params.id, req.currentUser.id);

        sendSuccess(res, data, "Reservation marked as ready");
    } catch (error) {
        next(error);
    }
}

async function cancelLibrarianHold(req, res, next) {
    try {
        const data = await holdService.cancelLibrarianHold(req.params.id, req.currentUser.id);

        sendSuccess(res, data, "Reservation cancelled");
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createHold,
    getHolds,
    cancelHold,
    getLibrarianHolds,
    markHoldReady,
    cancelLibrarianHold
};
