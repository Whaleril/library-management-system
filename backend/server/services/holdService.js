const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { formatDateTime } = require("../utils/date");

async function createHold(userId, bookId) {
    // 1. 检查图书是否存在
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
        throw new AppError(404, "图书不存在");
    }

    // 2. 校验库存：仅图书当前不可借时才允许预约
    if (book.availableCopies > 0) {
        throw new AppError(400, "该书当前可借，请直接借阅；或您已预约过该书"); // 文档原话
    }

    // 3. 校验借阅状态
    const currentLoan = await prisma.loan.findFirst({
        where: {
            userId: userId,
            bookId: bookId,
            status: 'Borrowing'
        }
    });
    if (currentLoan) {
        throw new AppError(400, "您当前正借阅该书，在归还前无法预约");
    }


    const existingHold = await prisma.hold.findFirst({
        where: {
            userId: userId,
            bookId: bookId,
            status: { in: ['WAITING', 'READY'] }
        }
    });
    if (existingHold) {
        throw new AppError(400, "该书当前可借，请直接借阅；或您已预约过该书");
    }

    // 5. 插入记录
    const newHold = await prisma.hold.create({
        data: {
            userId: userId,
            bookId: bookId,
            status: 'WAITING'
        }
    });

    return {
        id: newHold.id,
        bookId: book.id,
        bookTitle: book.title,
        status: newHold.status,
        createdAt: formatDateTime(newHold.createdAt)
    };
}

async function getHolds(userId, status, page = 1, size = 10) {
    const whereClause = { userId: userId };

    if (status) {
        whereClause.status = status;
    }

    const [total, holds] = await Promise.all([
        prisma.hold.count({ where: whereClause }),
        prisma.hold.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { book: true },
            skip: (Number(page) - 1) * Number(size),
            take: Number(size)
        })
    ]);

    const list = holds.map(hold => ({
        id: hold.id,
        bookId: hold.bookId,
        bookTitle: hold.book.title,
        bookAuthor: hold.book.author,
        status: hold.status,
        createdAt: formatDateTime(hold.createdAt)
    }));

    return {
        total,
        page: Number(page),
        size: Number(size),
        list
    };
}

/**
 * 2.5 取消预约
 */
async function cancelHold(userId, holdId) {
    const hold = await prisma.hold.findUnique({
        where: { id: holdId }
    });

    // 校验归属权
    if (!hold || hold.userId !== userId) {
        throw new AppError(404, "预约记录不存在或非当前用户");
    }

    // 仅 Waiting 和 Ready 状态允许取消
    const allowedStatus = ['WAITING', 'READY'];
    if (!allowedStatus.includes(hold.status)) {
        throw new AppError(404, "该预约记录已取消或已完成");
    }

    await prisma.hold.update({
        where: { id: holdId },
        data: { status: 'CANCELLED' }
    });

    return null;
}

module.exports = {
    createHold,
    getHolds,
    cancelHold
};