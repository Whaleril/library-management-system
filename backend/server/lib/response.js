function sendSuccess(res, data = null, message = "操作成功", code = 200) {
  return res.status(code).json({
    code,
    message,
    data,
  });
}

function sendError(res, error) {
  return res.status(error.code || 500).json({
    code: error.code || 500,
    message: error.message || "服务器内部错误",
    data: null,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
