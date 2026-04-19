const prisma = require("../db/prisma");

async function notifyHoldReady(user, book, holdId) {
  const message = `您预订的《${book.title}》已可借阅，请尽快领取。`;

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "HOLD_READY_NOTIFICATION",
      entity: "Hold",
      entityId: holdId,
      detail: JSON.stringify({
        channel: "IN_APP",
        message,
        bookId: book.id,
        bookTitle: book.title,
      }),
    },
  });

  return {
    channel: "IN_APP",
    message,
  };
}

module.exports = {
  notifyHoldReady,
};
