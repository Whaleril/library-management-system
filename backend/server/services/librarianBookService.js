const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const { formatDateTime } = require("../utils/date");

function parsePagination(query) {
  const page = Number(query.page || 1);
  const size = Number(query.size || 10);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1) {
    throw new AppError(400, "参数错误");
  }

  return { page, size };
}

function parseAvailability(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = String(value).toUpperCase();

  if (["TRUE", "1", "AVAILABLE"].includes(normalized)) {
    return true;
  }

  if (["FALSE", "0", "UNAVAILABLE"].includes(normalized)) {
    return false;
  }

  throw new AppError(400, "参数错误");
}

function toInventoryBook(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    genre: book.genre,
    language: book.language,
    shelfLocation: book.shelfLocation,
    available: book.available,
    availableCopies: book.availableCopies,
    totalCopies: book.totalCopies,
    isArchived: book.isArchived,
    archivedAt: book.archivedAt ? formatDateTime(book.archivedAt) : null,
    createdAt: formatDateTime(book.createdAt),
    updatedAt: formatDateTime(book.updatedAt),
  };
}

function validateCopies(totalCopies, availableCopies) {
  if (!Number.isInteger(totalCopies) || totalCopies < 0) {
    throw new AppError(400, "参数错误");
  }

  if (!Number.isInteger(availableCopies) || availableCopies < 0) {
    throw new AppError(400, "参数错误");
  }

  if (availableCopies > totalCopies) {
    throw new AppError(400, "参数错误");
  }
}

async function listInventory(query) {
  const { page, size } = parsePagination(query || {});
  const availability = parseAvailability(query?.availability);

  const where = {
    ...(query?.genre ? { genre: query.genre } : {}),
    ...(availability !== undefined ? { available: availability } : {}),
    ...(query?.archived === "true" ? {} : { isArchived: false }),
  };

  const [total, books] = await prisma.$transaction([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * size,
      take: size,
    }),
  ]);

  return {
    total,
    page,
    size,
    list: books.map(toInventoryBook),
  };
}

async function createBook(payload) {
  const {
    title,
    author,
    isbn,
    genre,
    language,
    shelfLocation,
    cover,
    description,
    totalCopies,
    availableCopies,
  } = payload || {};

  if (!title || !author || !isbn || !genre || !language || !shelfLocation) {
    throw new AppError(400, "参数错误");
  }

  const normalizedTotalCopies = Number(totalCopies);
  const normalizedAvailableCopies = availableCopies === undefined ? normalizedTotalCopies : Number(availableCopies);
  validateCopies(normalizedTotalCopies, normalizedAvailableCopies);

  const existingIsbn = await prisma.book.findUnique({ where: { isbn } });
  if (existingIsbn) {
    throw new AppError(400, "ISBN 已存在");
  }

  const created = await prisma.book.create({
    data: {
      title,
      author,
      isbn,
      genre,
      language,
      shelfLocation,
      cover: cover || null,
      description: description || null,
      totalCopies: normalizedTotalCopies,
      availableCopies: normalizedAvailableCopies,
      available: normalizedAvailableCopies > 0,
    },
  });

  return toInventoryBook(created);
}

async function updateBook(bookId, payload) {
  if (!bookId) {
    throw new AppError(400, "参数错误");
  }

  const existing = await prisma.book.findUnique({ where: { id: bookId } });
  if (!existing || existing.isArchived) {
    throw new AppError(404, "图书不存在");
  }

  const nextTotalCopies = payload?.totalCopies === undefined ? existing.totalCopies : Number(payload.totalCopies);
  const nextAvailableCopies = payload?.availableCopies === undefined ? existing.availableCopies : Number(payload.availableCopies);
  validateCopies(nextTotalCopies, nextAvailableCopies);

  if (payload?.isbn && payload.isbn !== existing.isbn) {
    const duplicate = await prisma.book.findUnique({ where: { isbn: payload.isbn } });
    if (duplicate) {
      throw new AppError(400, "ISBN 已存在");
    }
  }

  const updated = await prisma.book.update({
    where: { id: bookId },
    data: {
      ...(payload?.title !== undefined ? { title: payload.title } : {}),
      ...(payload?.author !== undefined ? { author: payload.author } : {}),
      ...(payload?.isbn !== undefined ? { isbn: payload.isbn } : {}),
      ...(payload?.genre !== undefined ? { genre: payload.genre } : {}),
      ...(payload?.language !== undefined ? { language: payload.language } : {}),
      ...(payload?.shelfLocation !== undefined ? { shelfLocation: payload.shelfLocation } : {}),
      ...(payload?.cover !== undefined ? { cover: payload.cover } : {}),
      ...(payload?.description !== undefined ? { description: payload.description } : {}),
      totalCopies: nextTotalCopies,
      availableCopies: nextAvailableCopies,
      available: nextAvailableCopies > 0,
    },
  });

  return toInventoryBook(updated);
}

async function archiveBook(bookId, operatorId) {
  if (!bookId) {
    throw new AppError(400, "参数错误");
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book || book.isArchived) {
    throw new AppError(404, "图书不存在");
  }

  const activeLoans = await prisma.loan.count({
    where: {
      bookId,
      returnDate: null,
      status: { in: ["Borrowing", "Overdue"] },
    },
  });

  if (activeLoans > 0) {
    throw new AppError(400, "存在未归还借阅，无法归档");
  }

  const archived = await prisma.$transaction(async (tx) => {
    const updated = await tx.book.update({
      where: { id: bookId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        available: false,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: operatorId || null,
        action: "BOOK_ARCHIVED",
        entity: "Book",
        entityId: bookId,
        detail: JSON.stringify({ title: updated.title }),
      },
    });

    return updated;
  });

  return toInventoryBook(archived);
}

module.exports = {
  listInventory,
  createBook,
  updateBook,
  archiveBook,
};
