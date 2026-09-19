# 최애의 포토 Backend

최애의 포토는 나만의 포토카드를 만들고, 다른 사용자와 거래하거나 교환할 수 있는 서비스입니다.

이 저장소는 Express와 Prisma로 구현한 백엔드입니다. 회원 인증과 이미지 업로드, 포토카드 판매·구매·교환을 처리하고, 사용자의 보유 카드와 포인트, 알림 데이터를 관리합니다.

## 저장소 구성

| 저장소 | 역할 | 배포 |
| --- | --- | --- |
| [FE](https://github.com/FS14-Team01/FE) | Next.js 프론트엔드 | Netlify |
| [BE](https://github.com/FS14-Team01/BE) | Express API 및 Prisma | Render |

## 링크

| 구분 | URL |
| --- | --- |
| 프론트엔드 | https://fs14-mfp.netlify.app |
| 백엔드 API | https://fs14-mfp.onrender.com |

> 무료 서버를 사용하므로 첫 요청의 응답이 늦을 수 있습니다.

## 주요 기능

- JWT 기반 회원가입 및 로그인
- 포토카드 생성과 Cloudinary 이미지 업로드
- 포토카드 판매, 구매 및 교환
- 보유 포토카드와 판매 내역 관리
- 랜덤 포인트 및 알림 관리

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt |
| Image Storage | Cloudinary |
| Deployment | Render |

## 시작하기

### 요구사항

- Node.js 20 이상
- npm
- PostgreSQL
- Cloudinary 계정

### 설치 및 실행

```bash
npm ci
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

기본 서버 주소는 http://localhost:3001입니다.

## 환경변수

프로젝트 루트의 [.env.example](./.env.example)을 복사해 `.env`를 생성하고 필요한 값을 입력합니다. 실제 비밀값은 Git에 올리지 않습니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run lint:fix` | ESLint 자동 수정 |
| `npx prisma generate` | Prisma Client 생성 |
| `npx prisma migrate dev` | 로컬 migration 생성 및 적용 |

## 시드 데이터

새로운 로컬 데이터베이스에 Mock 데이터를 입력할 때 사용합니다.

```bash
NODE_ENV=development node prisma/seed.js
```

시드 스크립트는 기존 데이터를 삭제하므로 실행 전에 데이터베이스를 확인합니다.

## API 경로

| 경로 | 설명 |
| --- | --- |
| `/auth` | 인증 |
| `/users` | 사용자 및 보유 카드 |
| `/photo-cards` | 포토카드 생성 |
| `/sales` | 판매 및 구매 |
| `/exchange-offers` | 교환 |
| `/points` | 포인트 |
| `/notifications` | 알림 |
| `/health` | Health Check |

## 프로젝트 구조

```text
├── config/         # Prisma와 외부 서비스 설정
├── controllers/    # 요청 및 응답 처리
├── errors/         # 공통 오류 정의
├── middlewares/    # 인증, 오류 및 이미지 처리
├── prisma/         # 스키마, migration 및 시드
├── repositories/   # 데이터 접근
├── routes/         # API 라우팅
├── services/       # 비즈니스 로직
├── utils/          # 공통 유틸리티
└── validator/      # 요청 검증
```

## 배포

배포 설정과 재배포 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.
