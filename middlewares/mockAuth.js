// 테스트용 인증 미들웨어
export default function mockAuth(req, res, next) {
  req.user = {
    id: BigInt(3),
  };

  next();
}