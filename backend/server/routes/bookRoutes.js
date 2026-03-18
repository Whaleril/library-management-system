const express = require("express");

const bookController = require("../controllers/bookController");

const router = express.Router();

router.get("/books/search", bookController.searchBooks);
router.get("/books/:id", bookController.getBookDetail);

module.exports = router;
