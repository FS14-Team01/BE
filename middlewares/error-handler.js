export default function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.status ?? 500;
  const message =
    status === 500 ? '서버 내부 오류가 발생했습니다.' : error.message;

  if (status === 500) {
    console.error(error);
  }

  const response = { message };

  if (error.code) {
    response.code = error.code;
  }

  return res.status(status).json(response);
}
