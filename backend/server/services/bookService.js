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

async function getAverageRatings(bookIds) {
  if (!bookIds.length) {
    return new Map();
  }

  const grouped = await prisma.rating.groupBy({
    by: ["bookId"],
    where: {
      bookId: { in: bookIds },
    },
    _avg: {
      stars: true,
    },
  });

  return new Map(
    grouped.map((item) => [item.bookId, item._avg.stars === null ? null : Number(item._avg.stars.toFixed(1))]),
  );
}

function toBookSummary(book, ratingMap) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    genre: book.genre,
    cover: book.cover,
    available: book.available,
    availableCopies: book.availableCopies,
    createdAt: formatDateTime(book.createdAt),
    ...(ratingMap.has(book.id) ? { averageRating: ratingMap.get(book.id) } : {}),
  };
}

async function searchBooks(query) {
  const { keyword, type } = query || {};
  const { page, size } = parsePagination(query || {});

  if (!keyword || typeof keyword !== "string") {
    throw new AppError(400, "缺少 keyword 或参数错误");
  }

  if (type && !["title", "author"].includes(type)) {
    throw new AppError(400, "参数错误");
  }

  const searchConditions =
    type === "title"
      ? [{ title: { contains: keyword } }]
      : type === "author"
        ? [{ author: { contains: keyword } }]
        : [{ title: { contains: keyword } }, { author: { contains: keyword } }];

  const where = {
    OR: searchConditions,
  };

  const [total, books] = await prisma.$transaction([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ratingMap = await getAverageRatings(books.map((book) => book.id));

  return {
    total,
    page,
    size,
    list: books.map((book) => toBookSummary(book, ratingMap)),
  };
}

async function getBookDetail(bookId) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new AppError(404, "图书不存在");
  }

  const average = await prisma.rating.aggregate({
    where: { bookId },
    _avg: {
      stars: true,
    },
  });

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    genre: book.genre,
    cover: book.cover,
    description: book.description,
    language: book.language,
    shelfLocation: book.shelfLocation,
    available: book.available,
    availableCopies: book.availableCopies,
    createdAt: formatDateTime(book.createdAt),
    averageRating: average._avg.stars === null ? null : Number(average._avg.stars.toFixed(1)),
  };
}

module.exports = {
  searchBooks,
  getBookDetail,
};
