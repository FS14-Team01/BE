# 백엔드 배포 가이드

## 구성

- 플랫폼: Render Web Service
- 데이터베이스: PostgreSQL
- 이미지 저장소: Cloudinary
- 테스트 브랜치: `deploy-test`
- 운영 브랜치: `main` 예정

## Render 설정

| 항목 | 값 |
| --- | --- |
| Runtime | `Node` |
| Root directory | 비워둠 |
| Build command | `npm ci --include=dev && npx prisma generate && npx prisma migrate deploy` |
| Start command | `npm start` |
| Health Check Path | `/health` |

현재 Public Git Repository 방식은 자동 배포를 지원하지 않으므로 push 후 **Manual Deploy → Deploy latest commit**을 실행한다.

## 환경 변수

Render의 **Environment**에 등록한다.

| 변수 | 설명 |
| --- | --- |
| `NODE_ENV` | 배포 환경에서는 `production` |
| `DATABASE_URL` | PostgreSQL 연결 주소 |
| `JWT_SECRET` | 액세스 토큰 서명 키 |
| `JWT_REFRESH_SECRET` | 리프레시 토큰 서명 키 |
| `ACCESS_TOKEN_EXPIRES_IN` | 액세스 토큰 만료 시간 |
| `REFRESH_TOKEN_EXPIRES_IN` | 리프레시 토큰 만료 시간 |
| `FRONTEND_URL` | Netlify Origin. 끝에 `/`를 붙이지 않는다. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |

실제 DB URL과 Secret은 `.env.example`이나 Git에 올리지 않는다. `PORT`는 Render가 자동으로 제공한다.

## 배포 절차

1. 배포할 커밋을 `deploy-test`에 push한다.
2. Render에서 최신 커밋을 수동 배포한다.
3. Deploy Logs에서 migration과 서버 실행을 확인한다.
4. `GET /health`가 `200`과 `{ "status": "ok" }`를 반환하는지 확인한다.

## 데이터베이스

- 배포 시 `prisma migrate deploy`로 기존 migration을 적용한다.
- `prisma migrate dev`는 배포 환경에서 사용하지 않는다.
- seed는 기존 데이터를 삭제하므로 Build/Start Command에 상시 포함하지 않는다.

## 확인 항목

- Health Check
- 회원가입과 로그인
- PostgreSQL 데이터 저장
- 포토카드 생성
- Cloudinary 이미지 업로드

## 트러블슈팅

- CORS 오류가 나면 `FRONTEND_URL`과 실제 Netlify Origin이 정확히 같은지 확인한다.
- 배포 실패 시 Render Deploy Logs의 첫 번째 오류부터 확인한다.

## 정식 배포 예정

- `main` 브랜치 운영 배포
- 장기 사용 가능한 PostgreSQL로 전환
- GitHub Actions CI 및 자동 배포
- 모니터링
