const express = require("express");

const librarianBookController = require("../controllers/librarianBookController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

const librarianOrAdmin = [requireAuth, requireRole(["LIBRARIAN", "ADMIN"])];

router.post("/librarian/books", ...librarianOrAdmin, librarianBookController.createBook);
router.put("/librarian/books/:id", ...librarianOrAdmin, librarianBookController.updateBook);
router.get("/librarian/books", ...librarianOrAdmin, librarianBookController.listInventory);
router.patch("/librarian/books/:id/archive", ...librarianOrAdmin, librarianBookController.archiveBook);

module.exports = router;
