const { AppError } = require("../lib/errors");

/**
 * @param {('STUDENT'|'LIBRARIAN'|'ADMIN')[]} allowedRoles
 * @returns {import('express').RequestHandler}
 */
function requireRole(allowedRoles) {
  return async function roleGuard(req, res, next) {
    try {
      if (!req.currentUser) {
        throw new AppError(401, "未登录或 token 无效");
      }
      if (!allowedRoles.includes(req.currentUser.role)) {
        throw new AppError(403, "Forbidden");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

const requireAdmin = requireRole(["ADMIN"]);

module.exports = {
  requireRole,
  requireAdmin,
};
