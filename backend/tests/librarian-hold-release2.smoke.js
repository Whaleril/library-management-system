const assert = require("node:assert/strict");

const app = require("../server/app");
const prisma = require("../server/db/prisma");

let server;
let baseUrl;
let librarianToken;
const createdBookIds = [];
const createdHoldIds = [];
const createdUserIds = [];
const uniqueSuffix = Date.now();

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function loginByEmail(email, password) {
  return request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: email,
      password,
    }),
  });
}

async function cleanup() {
  if (createdHoldIds.length) {
    await prisma.auditLog.deleteMany({
      where: {
        entity: "Hold",
        entityId: {
          in: createdHoldIds,
        },
      },
    });
  }

  if (createdHoldIds.length) {
    await prisma.hold.deleteMany({
      where: {
        id: {
          in: createdHoldIds,
        },
      },
    });
  }

  if (createdBookIds.length) {
    await prisma.book.deleteMany({
      where: {
        id: {
          in: createdBookIds,
        },
      },
    });
  }

  if (createdUserIds.length) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: createdUserIds,
        },
      },
    });
  }

  await prisma.$disconnect();

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function main() {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  const waitingBook = await prisma.book.create({
    data: {
      title: `Hold Waiting ${uniqueSuffix}`,
      author: "Codex Librarian",
      isbn: `hold-waiting-${uniqueSuffix}`,
      genre: "Technology",
      language: "English",
      shelfLocation: "HOLD-001",
      available: true,
      availableCopies: 2,
    },
  });
  createdBookIds.push(waitingBook.id);

  const noInventoryBook = await prisma.book.create({
    data: {
      title: `Hold No Inventory ${uniqueSuffix}`,
      author: "Codex Librarian",
      isbn: `hold-no-inventory-${uniqueSuffix}`,
      genre: "Science",
      language: "English",
      shelfLocation: "HOLD-002",
      available: false,
      availableCopies: 0,
    },
  });
  createdBookIds.push(noInventoryBook.id);

  const reservedBook = await prisma.book.create({
    data: {
      title: `Hold Reserved ${uniqueSuffix}`,
      author: "Codex Librarian",
      isbn: `hold-reserved-${uniqueSuffix}`,
      genre: "History",
      language: "English",
      shelfLocation: "HOLD-003",
      available: false,
      availableCopies: 0,
    },
  });
  createdBookIds.push(reservedBook.id);

  const cancelledBook = await prisma.book.create({
    data: {
      title: `Hold Cancelled ${uniqueSuffix}`,
      author: "Codex Librarian",
      isbn: `hold-cancelled-${uniqueSuffix}`,
      genre: "Management",
      language: "English",
      shelfLocation: "HOLD-004",
      available: true,
      availableCopies: 1,
    },
  });
  createdBookIds.push(cancelledBook.id);

  const borrowerEmail = `hold.release2.student.${uniqueSuffix}@example.com`;
  const registerBorrower = await request("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Hold Release2 Borrower",
      email: borrowerEmail,
      password: "student123",
      studentId: `HR2${uniqueSuffix}`,
    }),
  });
  assert.equal(registerBorrower.response.status, 200);
  const borrowerId = registerBorrower.body.data.userId;
  createdUserIds.push(borrowerId);

  const waitingHold = await prisma.hold.create({
    data: {
      userId: borrowerId,
      bookId: waitingBook.id,
      status: "WAITING",
    },
  });
  createdHoldIds.push(waitingHold.id);

  const noInventoryHold = await prisma.hold.create({
    data: {
      userId: borrowerId,
      bookId: noInventoryBook.id,
      status: "WAITING",
    },
  });
  createdHoldIds.push(noInventoryHold.id);

  const readyHold = await prisma.hold.create({
    data: {
      userId: borrowerId,
      bookId: reservedBook.id,
      status: "READY",
      readyAt: new Date(),
    },
  });
  createdHoldIds.push(readyHold.id);

  const cancelledHold = await prisma.hold.create({
    data: {
      userId: borrowerId,
      bookId: cancelledBook.id,
      status: "CANCELLED",
    },
  });
  createdHoldIds.push(cancelledHold.id);

  const librarianLogin = await loginByEmail("librarian@library.com", "lib123");
  assert.equal(librarianLogin.response.status, 200);
  librarianToken = librarianLogin.body.data.token;

  const holdList = await request("/api/librarian/holds", {
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(holdList.response.status, 200);
  assert.ok(holdList.body.data.list.some((hold) => hold.id === waitingHold.id));
  assert.ok(holdList.body.data.list.some((hold) => hold.id === readyHold.id));

  const waitingList = await request("/api/librarian/holds?status=WAITING", {
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(waitingList.response.status, 200);
  assert.ok(waitingList.body.data.list.every((hold) => hold.status === "WAITING"));

  const missingReady = await request("/api/librarian/holds/missing-id/ready", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(missingReady.response.status, 404);
  assert.equal(missingReady.body.message, "Reservation record not found");

  const invalidReady = await request(`/api/librarian/holds/${cancelledHold.id}/ready`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(invalidReady.response.status, 400);
  assert.equal(invalidReady.body.message, "Only WAITING reservations can be marked READY");

  const noInventoryReady = await request(`/api/librarian/holds/${noInventoryHold.id}/ready`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(noInventoryReady.response.status, 400);
  assert.equal(noInventoryReady.body.message, "No available copies for this reservation");

  const readyResult = await request(`/api/librarian/holds/${waitingHold.id}/ready`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(readyResult.response.status, 200);
  assert.equal(readyResult.body.message, "Reservation marked as ready");
  assert.equal(readyResult.body.data.status, "READY");
  assert.ok(readyResult.body.data.readyAt);
  assert.equal(readyResult.body.data.notification.channel, "IN_APP");
  assert.match(readyResult.body.data.notification.message, /已可借阅/);

  const updatedWaitingBook = await prisma.book.findUnique({
    where: { id: waitingBook.id },
  });
  assert.equal(updatedWaitingBook.availableCopies, 1);
  assert.equal(updatedWaitingBook.available, true);

  const readyAuditLogs = await prisma.auditLog.findMany({
    where: {
      entity: "Hold",
      entityId: waitingHold.id,
    },
  });
  assert.ok(readyAuditLogs.some((log) => log.action === "MARK_HOLD_READY"));
  assert.ok(readyAuditLogs.some((log) => log.action === "HOLD_READY_NOTIFICATION"));

  const missingCancel = await request("/api/librarian/holds/missing-id", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(missingCancel.response.status, 404);
  assert.equal(missingCancel.body.message, "Reservation record not found");

  const duplicateCancel = await request(`/api/librarian/holds/${cancelledHold.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(duplicateCancel.response.status, 400);
  assert.equal(duplicateCancel.body.message, "This reservation has already been cancelled");

  const cancelWaiting = await request(`/api/librarian/holds/${noInventoryHold.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(cancelWaiting.response.status, 200);
  assert.equal(cancelWaiting.body.data.status, "CANCELLED");
  assert.equal(cancelWaiting.body.data.inventoryReleased, false);

  const cancelReady = await request(`/api/librarian/holds/${readyHold.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });
  assert.equal(cancelReady.response.status, 200);
  assert.equal(cancelReady.body.data.status, "CANCELLED");
  assert.equal(cancelReady.body.data.inventoryReleased, true);

  const restoredReservedBook = await prisma.book.findUnique({
    where: { id: reservedBook.id },
  });
  assert.equal(restoredReservedBook.availableCopies, 1);
  assert.equal(restoredReservedBook.available, true);

  console.log("Librarian Hold Release2 smoke test passed.");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(cleanup);
