const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");

const RANKING_LIMIT = 10;
const RANKING_RANGES = new Set(["month", "3months", "year"]);

function normalizeRange(range) {
  if (!range) {
    return "month";
  }

  if (!RANKING_RANGES.has(range)) {
    throw new AppError(400, "参数错误");
  }

  return range;
}

function getStartDate(range) {
  const now = new Date();

  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (range === "3months") {
    const date = new Date(now);
    date.setMonth(date.getMonth() - 3);
    return date;
  }

  const date = new Date(now);
  date.setFullYear(date.getFullYear() - 1);
  return date;
}

function toRankingItem(ranking, rank) {
  return {
    rank,
    bookId: ranking.bookId,
    bookTitle: ranking.bookTitle,
    bookAuthor: ranking.bookAuthor,
    cover: ranking.cover,
    loanCount: Number(ranking.loanCount),
  };
}

async function getRanking(query) {
  const range = normalizeRange(query?.range);
  const startDate = getStartDate(range);
  const rankings = await prisma.$queryRaw`
    SELECT
      l.bookId AS bookId,
      b.title AS bookTitle,
      b.author AS bookAuthor,
      b.cover AS cover,
      COUNT(l.id) AS loanCount
    FROM "Loan" l
    INNER JOIN "Book" b ON b.id = l.bookId
    WHERE l.checkoutDate >= ${startDate}
    GROUP BY l.bookId, b.title, b.author, b.cover
    ORDER BY loanCount DESC, b.title ASC, l.bookId ASC
    LIMIT ${RANKING_LIMIT}
  `;

  if (rankings.length === 0) {
    return { list: [] };
  }

  return {
    list: rankings.map((ranking, index) => toRankingItem(ranking, index + 1)),
  };
}

module.exports = {
  getRanking,
};
