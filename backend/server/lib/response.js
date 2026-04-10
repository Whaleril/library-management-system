function sendSuccess(res, data = null, message = "Operation successful", code = 200) {
  return res.status(code).json({
    code,
    message,
    data,
  });
}

function sendError(res, error) {
  return res.status(error.code || 500).json({
    code: error.code || 500,
    message: error.message || "Internal server error",
    data: null,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
