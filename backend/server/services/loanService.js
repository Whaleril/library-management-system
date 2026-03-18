const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { formatDateTime, addDays } = require("../utils/date");

const DEFAULT_LOAN_DAYS = 30;

function toCurrentLoan(loan) {
  return {
    id: loan.id,
    bookId: loan.bookId,
    bookTitle: loan.book.title,
    bookAuthor: loan.book.author,
    checkoutDate: formatDateTime(loan.checkoutDate),
    dueDate: formatDateTime(loan.dueDate),
    renewalCount: loan.renewalCount || 0,
    status: loan.status,
  };
}

async function getCurrentLoans(userId) {
  const loans = await prisma.loan.findMany({
    where: {
      userId,
      status: "Borrowing",
    },
    include: {
      book: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return {
    list: loans.map(toCurrentLoan),
  };
}

async function ensureBorrowAllowed(userId, bookId) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new AppError(404, "图书不存在");
  }

  if (!book.available || book.availableCopies <= 0) {
    throw new AppError(400, "该书当前不可借或您有未缴清罚款");
  }

  const unpaidFineLoan = await prisma.loan.findFirst({
    where: {
      userId,
      fineAmount: { gt: 0 },
      finePaid: false,
      fineForgiven: false,
    },
  });

  if (unpaidFineLoan) {
    throw new AppError(400, "该书当前不可借或您有未缴清罚款");
  }

  return book;
}

async function createLoan(userId, payload) {
  const { bookId } = payload || {};

  if (!bookId) {
    throw new AppError(400, "参数错误");
  }

  const book = await ensureBorrowAllowed(userId, bookId);
  const checkoutDate = new Date();
  const dueDate = addDays(checkoutDate, DEFAULT_LOAN_DAYS);

  const loan = await prisma.$transaction(async (tx) => {
    const createdLoan = await tx.loan.create({
      data: {
        userId,
        bookId: book.id,
        checkoutDate,
        dueDate,
        renewalCount: 0,
        status: "Borrowing",
      },
      include: {
        book: true,
      },
    });

    const nextAvailableCopies = book.availableCopies - 1;

    await tx.book.update({
      where: { id: book.id },
      data: {
        availableCopies: nextAvailableCopies,
        available: nextAvailableCopies > 0,
      },
    });

    return createdLoan;
  });

  return {
    loanId: loan.id,
    bookId: loan.bookId,
    bookTitle: loan.book.title,
    checkoutDate: formatDateTime(loan.checkoutDate),
    dueDate: formatDateTime(loan.dueDate),
  };
}

module.exports = {
  getCurrentLoans,
  createLoan,
};
