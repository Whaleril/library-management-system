const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { formatDateTime } = require("../utils/date");

async function createHold(userId, bookId) {
    // 1. Check whether the book exists.
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
        throw new AppError(404, "Book not found");
    }

    // 2. Validate inventory: reservation is allowed only when the book is currently unavailable.
    if (book.availableCopies > 0) {
        throw new AppError(400, "This book is currently available; please borrow it directly, or you have already reserved it"); // Original wording from the spec.
    }

    // 3. Validate loan status.
    const currentLoan = await prisma.loan.findFirst({
        where: {
            userId: userId,
            bookId: bookId,
            status: 'Borrowing'
        }
    });
    if (currentLoan) {
        throw new AppError(400, "You are currently borrowing this book and cannot reserve it before returning it");
    }


    const existingHold = await prisma.hold.findFirst({
        where: {
            userId: userId,
            bookId: bookId,
            status: { in: ['WAITING', 'READY'] }
        }
    });
    if (existingHold) {
        throw new AppError(400, "This book is currently available; please borrow it directly, or you have already reserved it");
    }

    // 5. Insert record.
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
 * 2.5 Cancel reservation.
 */
async function cancelHold(userId, holdId) {
    const hold = await prisma.hold.findUnique({
        where: { id: holdId }
    });

    // Validate ownership.
    if (!hold || hold.userId !== userId) {
        throw new AppError(404, "Reservation record not found or does not belong to the current user");
    }

    // Only reservations in Waiting and Ready status can be cancelled.
    const allowedStatus = ['WAITING', 'READY'];
    if (!allowedStatus.includes(hold.status)) {
        throw new AppError(404, "This reservation record has already been cancelled or fulfilled");
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
