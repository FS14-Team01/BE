const ERROR_DEFINITIONS = {
  // 공통
  INVALID_REQUEST: {
    statusCode: 400,
    code: "INVALID_REQUEST",
    message: "요청 데이터가 올바르지 않습니다.",
  },
  UNAUTHORIZED: {
    statusCode: 401,
    code: "UNAUTHORIZED",
    message: "로그인이 필요합니다.",
  },
  FORBIDDEN: {
    statusCode: 403,
    code: "FORBIDDEN",
    message: "해당 요청에 대한 권한이 없습니다.",
  },
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "서버 내부 오류가 발생했습니다.",
  },

  // 인증 / 유저
  EMAIL_ALREADY_EXISTS: {
    statusCode: 409,
    code: "EMAIL_ALREADY_EXISTS",
    message: "이미 사용 중인 이메일입니다.",
  },
  NICKNAME_ALREADY_EXISTS: {
    statusCode: 409,
    code: "NICKNAME_ALREADY_EXISTS",
    message: "이미 사용 중인 닉네임입니다.",
  },
  INVALID_CREDENTIALS: {
    statusCode: 401,
    code: "INVALID_CREDENTIALS",
    message: "이메일 또는 비밀번호가 올바르지 않습니다.",
  },
  INVALID_REFRESH_TOKEN: {
    statusCode: 401,
    code: "INVALID_REFRESH_TOKEN",
    message: "유효하지 않은 리프레시 토큰입니다.",
  },
  REFRESH_TOKEN_EXPIRED: {
    statusCode: 401,
    code: "REFRESH_TOKEN_EXPIRED",
    message: "리프레시 토큰이 만료되었습니다.",
  },

  // 포토카드
  PHOTO_CARD_ISSUE_LIMIT_EXCEEDED: {
    statusCode: 400,
    code: "PHOTO_CARD_ISSUE_LIMIT_EXCEEDED",
    message: "포토카드는 최대 10장까지 발행할 수 있습니다.",
  },
  INVALID_PHOTO_CARD_SUPPLY: {
    statusCode: 400,
    code: "INVALID_PHOTO_CARD_SUPPLY",
    message: "포토카드 발행 수량이 올바르지 않습니다.",
  },
  PHOTO_CARD_CREATION_LIMIT_EXCEEDED: {
    statusCode: 409,
    code: "PHOTO_CARD_CREATION_LIMIT_EXCEEDED",
    message: "이번 주 포토카드 생성 가능 횟수를 모두 사용했습니다.",
  },
  PHOTO_CARD_NOT_FOUND: {
    statusCode: 404,
    code: "PHOTO_CARD_NOT_FOUND",
    message: "포토카드를 찾을 수 없습니다.",
  },

  // 판매
  INVALID_SALE_QUANTITY: {
    statusCode: 400,
    code: "INVALID_SALE_QUANTITY",
    message: "판매 수량이 올바르지 않습니다.",
  },
  SALE_PRICE_LIMIT_EXCEEDED: {
    statusCode: 400,
    code: "SALE_PRICE_LIMIT_EXCEEDED",
    message: "판매 금액은 최대 1,000P까지 설정할 수 있습니다.",
  },
  INVALID_SALE_PRICE: {
    statusCode: 400,
    code: "INVALID_SALE_PRICE",
    message: "판매 금액이 올바르지 않습니다.",
  },
  SALE_QUANTITY_EXCEEDED: {
    statusCode: 409,
    code: "SALE_QUANTITY_EXCEEDED",
    message: "판매 가능한 포토카드 수량을 초과했습니다.",
  },
  SALE_NOT_FOUND: {
    statusCode: 404,
    code: "SALE_NOT_FOUND",
    message: "판매 정보를 찾을 수 없습니다.",
  },
  SALE_FORBIDDEN: {
    statusCode: 403,
    code: "SALE_FORBIDDEN",
    message: "해당 판매 정보를 수정할 권한이 없습니다.",
  },
  SALE_SOLD_OUT: {
    statusCode: 409,
    code: "SALE_SOLD_OUT",
    message: "품절된 판매입니다.",
  },
  SALE_CANCELLED: {
    statusCode: 409,
    code: "SALE_CANCELLED",
    message: "취소된 판매입니다.",
  },
  SALE_NOT_EDITABLE: {
    statusCode: 409,
    code: "SALE_NOT_EDITABLE",
    message: "현재 상태에서는 판매 정보를 수정할 수 없습니다.",
  },
  INSUFFICIENT_SALE_QUANTITY: {
    statusCode: 409,
    code: "INSUFFICIENT_SALE_QUANTITY",
    message: "남아 있는 판매 수량이 부족합니다.",
  },

  // 교환
  EXCHANGE_CARD_QUANTITY_INSUFFICIENT: {
    statusCode: 409,
    code: "EXCHANGE_CARD_QUANTITY_INSUFFICIENT",
    message: "교환에 사용할 포토카드 수량이 부족합니다.",
  },
  EXCHANGE_CARD_QUANTITY_EXCEEDED: {
    statusCode: 409,
    code: "EXCHANGE_CARD_QUANTITY_EXCEEDED",
    message: "교환 제안 가능한 포토카드 수량을 초과했습니다.",
  },
  EXCHANGE_OFFER_NOT_FOUND: {
    statusCode: 404,
    code: "EXCHANGE_OFFER_NOT_FOUND",
    message: "교환 제안을 찾을 수 없습니다.",
  },
  EXCHANGE_OFFER_ALREADY_PROCESSED: {
    statusCode: 409,
    code: "EXCHANGE_OFFER_ALREADY_PROCESSED",
    message: "이미 처리된 교환 제안입니다.",
  },

  // 구매
  INVALID_PURCHASE_QUANTITY: {
    statusCode: 400,
    code: "INVALID_PURCHASE_QUANTITY",
    message: "구매 수량이 올바르지 않습니다.",
  },
  CANNOT_PURCHASE_OWN_SALE: {
    statusCode: 403,
    code: "CANNOT_PURCHASE_OWN_SALE",
    message: "본인이 판매한 포토카드는 구매할 수 없습니다.",
  },
  INSUFFICIENT_POINTS: {
    statusCode: 409,
    code: "INSUFFICIENT_POINTS",
    message: "보유 포인트가 부족합니다.",
  },

  // 랜덤 포인트
  RANDOM_BOX_ALREADY_USED: {
    statusCode: 409,
    code: "RANDOM_BOX_ALREADY_USED",
    message: "현재 시간대의 랜덤 포인트 기회를 이미 사용했습니다.",
  },
};

export { ERROR_DEFINITIONS };
