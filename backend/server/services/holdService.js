const prisma = require("../db/prisma");

async function createHold(userId, bookId) {
    // 1. 检查图书是否存在
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
        throw new Error("图书不存在");
    }

    // 2. 校验库存：仅图书当前不可借时才允许预约
    if (book.availableCopies > 0) {
        throw new Error("该书当前有可借副本，请直接办理借阅，无需预约");
    }

    // 3. 校验借阅状态：若读者当前已借到该书，不能再预约该书
    const currentLoan = await prisma.loan.findFirst({
        where: {
            userId: userId,
            bookId: bookId,
            status: 'Borrowing' // 注意：请根据你项目中实际的借阅中状态名修改（如 'OUT' 或 'Borrowing'）
        }
    });
    if (currentLoan) {
        throw new Error("您当前正借阅该书，在归还前无法预约");
    }

    // 4. 校验预约状态：同一读者不能重复预约同一本书（针对排队中的）
    const existingHold = await prisma.hold.findFirst({
        where: {
            userId: userId,
            bookId: bookId,
            status: { in: ['WAITING', 'READY'] }
        }
    });
    if (existingHold) {
        throw new Error("您已在预约队列中，请勿重复操作");
    }

    // 5. 插入记录：系统生成预约记录，并赋予时间戳（Prisma自动生成createdAt）
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
        createdAt: newHold.createdAt
    };
}


async function getHolds(userId, status, page = 1, size = 10) {
    const whereClause = { userId: userId };

    // 支持按状态筛选
    if (status) {
        whereClause.status = status;
    }

    // 执行分页查询和总数统计
    const [total, holds] = await Promise.all([
        prisma.hold.count({ where: whereClause }),
        prisma.hold.findMany({
            where: whereClause,
            // 默认按预约创建时间倒序
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
        createdAt: hold.createdAt
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
        throw new Error("预约记录不存在或无权操作");
    }

    // 仅 Waiting 和 Ready 状态允许取消
    const allowedStatus = ['WAITING', 'READY'];
    if (!allowedStatus.includes(hold.status)) {
        throw new Error(`当前状态为 ${hold.status}，无法执行取消操作`);
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