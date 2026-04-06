// backend/routes/ratingRoutes.js
const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');


const studentOnly = [requireAuth, requireRole(['STUDENT'])];

router.post('/books/:bookId/rating', ...studentOnly, ratingController.createOrUpdateRating);
router.get('/books/:bookId/ratings', ratingController.getBookRatings);
router.get('/books/:bookId/rating/stats', ratingController.getBookRatingStats);
router.get('/users/me/ratings', ...studentOnly, ratingController.getMyRatings);

module.exports = router;