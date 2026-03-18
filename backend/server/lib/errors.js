class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function isAppError(error) {
  return error instanceof AppError;
}

module.exports = {
  AppError,
  isAppError,
};
