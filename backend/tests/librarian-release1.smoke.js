const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

const app = require("../server/app");
const prisma = require("../server/db/prisma");

let server;
let baseUrl;
let librarianToken;
let studentToken;
let createdBookId;
let createdLoanId;
let librarianId;
let studentId;

const uniqueSuffix = Date.now();
const librarianEmail = `librarian.release1.${uniqueSuffix}@example.com`;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function cleanup() {
  if (createdLoanId) {
    await prisma.loan.deleteMany({ where: { id: createdLoanId } });
  }

  if (createdBookId) {
    await prisma.book.deleteMany({ where: { id: createdBookId } });
  }

  if (studentId || librarianId) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [studentId, librarianId].filter(Boolean),
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

  const passwordHash = await bcrypt.hash("lib123", 10);
  const librarian = await prisma.user.create({
    data: {
      name: "Release1 Librarian",
      email: librarianEmail,
      passwordHash,
      role: "LIBRARIAN",
    },
  });
  librarianId = librarian.id;

  const student = await prisma.user.create({
    data: {
      name: "Release1 Student",
      email: `student.release1.${uniqueSuffix}@example.com`,
      passwordHash: await bcrypt.hash("student123", 10),
      role: "STUDENT",
      studentId: `S-LIB-${uniqueSuffix}`,
    },
  });
  studentId = student.id;

  const loginResult = await request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: librarianEmail,
      password: "lib123",
    }),
  });

  assert.equal(loginResult.response.status, 200);
  librarianToken = loginResult.body.data.token;
  assert.ok(librarianToken);

  const studentLoginResult = await request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: `student.release1.${uniqueSuffix}@example.com`,
      password: "student123",
    }),
  });

  assert.equal(studentLoginResult.response.status, 200);
  studentToken = studentLoginResult.body.data.token;
  assert.ok(studentToken);

  const createResult = await request("/api/librarian/books", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Librarian Release1 Book",
      author: "Library Team",
      isbn: `isbn-${uniqueSuffix}`,
      genre: "Technology",
      language: "English",
      shelfLocation: "R1-A1",
      totalCopies: 5,
      availableCopies: 5,
      description: "book for librarian release1",
    }),
  });

  assert.equal(createResult.response.status, 200);
  createdBookId = createResult.body.data.id;
  assert.equal(createResult.body.data.totalCopies, 5);
  assert.equal(createResult.body.data.availableCopies, 5);

  const duplicateIsbn = await request("/api/librarian/books", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Duplicate ISBN Book",
      author: "Library Team",
      isbn: `isbn-${uniqueSuffix}`,
      genre: "Technology",
      language: "English",
      shelfLocation: "R1-A2",
      totalCopies: 1,
      availableCopies: 1,
    }),
  });

  assert.equal(duplicateIsbn.response.status, 400);
  assert.equal(duplicateIsbn.body.message, "ISBN 已存在");

  const forbiddenResult = await request("/api/librarian/books?page=1&size=10", {
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  });
  assert.equal(forbiddenResult.response.status, 403);

  const listResult = await request("/api/librarian/books?page=1&size=10&genre=Technology&availability=AVAILABLE", {
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });

  assert.equal(listResult.response.status, 200);
  const listBook = listResult.body.data.list.find((item) => item.id === createdBookId);
  assert.ok(listBook);
  assert.equal(listBook.totalCopies, 5);
  assert.equal(listBook.availableCopies, 5);

  const updateResult = await request(`/api/librarian/books/${createdBookId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Librarian Release1 Book Updated",
      totalCopies: 8,
      availableCopies: 4,
    }),
  });

  assert.equal(updateResult.response.status, 200);
  assert.equal(updateResult.body.data.totalCopies, 8);
  assert.equal(updateResult.body.data.availableCopies, 4);

  const invalidBookIdResult = await request("/api/librarian/books/not-exist-book-id", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "will fail",
    }),
  });

  assert.equal(invalidBookIdResult.response.status, 404);
  assert.equal(invalidBookIdResult.body.message, "图书不存在");

  const loan = await prisma.loan.create({
    data: {
      userId: studentId,
      bookId: createdBookId,
      checkoutDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "Borrowing",
    },
  });
  createdLoanId = loan.id;

  const archiveBlocked = await request(`/api/librarian/books/${createdBookId}/archive`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });

  assert.equal(archiveBlocked.response.status, 400);
  assert.equal(archiveBlocked.body.message, "存在未归还借阅，无法归档");

  await prisma.loan.update({
    where: { id: createdLoanId },
    data: {
      status: "Returned",
      returnDate: new Date(),
    },
  });

  const archiveOk = await request(`/api/librarian/books/${createdBookId}/archive`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${librarianToken}`,
    },
  });

  assert.equal(archiveOk.response.status, 200);
  assert.equal(archiveOk.body.data.isArchived, true);

  const readerBooks = await request("/api/books?page=1&size=50");
  assert.equal(readerBooks.response.status, 200);
  assert.equal(readerBooks.body.data.list.some((book) => book.id === createdBookId), false);

  console.log("Librarian Release1 smoke test passed.");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(cleanup);
