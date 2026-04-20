// backend/controllers/ratingController.js
const ratingService = require('../services/ratingService');
const { AppError } = require('../lib/errors');
const { sendSuccess } = require('../lib/response');  // Changed to sendSuccess.

class RatingController {
  /**
   * POST /api/books/:bookId/rating
   * Rate a book.
   */
  async createOrUpdateRating(req, res, next) {
    try {
      const { bookId } = req.params;
      const { stars } = req.body;
      const userId = req.currentUser.id;

      if (!stars || stars < 1 || stars > 5) {
        throw new AppError(400, 'Rating must be between 1 and 5');
      }

      const book = await ratingService.checkBookExists(bookId);
      if (!book) {
        throw new AppError(404, 'Book not found');
      }

      const hasBorrowed = await ratingService.hasUserBorrowedBook(userId, bookId);
      if (!hasBorrowed) {
        throw new AppError(400, 'Only readers who have borrowed this book can rate it');
      }

      const { rating, isUpdate } = await ratingService.upsertRating(userId, bookId, stars);

      // Changed to sendSuccess. Note the parameter order: sendSuccess(res, data, message).
      sendSuccess(res, {
        id: rating.id,
        bookId: rating.bookId,
        stars: rating.stars,
        createdAt: rating.createdAt
      }, isUpdate ? 'Rating updated' : 'Rating submitted successfully');

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/books/:bookId/ratings
   * Get all ratings for a specific book.
   */
  async getBookRatings(req, res, next) {
    try {
      const { bookId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 10;
      const book = await ratingService.checkBookExists(bookId);
      if (!book) {
        throw new AppError(404, 'Book not found');
      }
      const ratings = await ratingService.getBookRatings(bookId, page, size);
      const stats = await ratingService.getBookRatingStats(bookId);
      sendSuccess(res, {
        ...stats,
        ...ratings
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me/ratings
   * Get the current user's rating records.
   */
  async getMyRatings(req, res, next) {
    try {
      const userId = req.currentUser.id;
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 10;

      const ratings = await ratingService.getUserRatings(userId, page, size);
      sendSuccess(res, ratings);

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/books/:bookId/rating/stats
   * Get rating statistics for a specific book only.
   */
  async getBookRatingStats(req, res, next) {
    try {
      const { bookId } = req.params;

      const book = await ratingService.checkBookExists(bookId);
      if (!book) {
        throw new AppError(404, 'Book not found');
      }

      const stats = await ratingService.getBookRatingStats(bookId);
      sendSuccess(res, stats);

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RatingController();
