const express = require("express");

const librarianController = require("../controllers/librarianController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

// All librarian routes require authentication and LIBRARIAN role
router.use(requireAuth, requireRole(["LIBRARIAN", "ADMIN"]));

// L1.3 - View all books with status
router.get("/books", librarianController.viewBooks);

// L1.1 - Add a new book
router.post("/books", librarianController.addBook);

// L1.2 - Edit an existing book
router.put("/books/:id", librarianController.editBook);

// L1.4 - Delete/Archive a book
router.delete("/books/:id", librarianController.deleteBook);

module.exports = router;
