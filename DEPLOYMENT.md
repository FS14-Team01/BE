# 백엔드 배포 가이드

## 배포 환경

- 서버: Render Web Service
- 데이터베이스: Render PostgreSQL
- 이미지 저장소: Cloudinary
- 배포 브랜치: `main`

## Web Service 설정

| 항목 | 값 |
| --- | --- |
| Language | `Node` |
| Branch | `main` |
| Region | PostgreSQL과 동일한 지역 |
| Root Directory | 비워두기 |
| Build Command | `npm ci --include=dev && npx prisma generate && npx prisma migrate deploy` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

## 환경변수

| 변수 | 설명 |
| --- | --- |
| `DATABASE_URL` | Render PostgreSQL Internal Database URL |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Access Token 서명 키 |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 키 |
| `ACCESS_TOKEN_EXPIRES_IN` | Access Token 유효기간 |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh Token 유효기간 |
| `FRONTEND_URL` | 요청을 허용할 Netlify 주소 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |

`FRONTEND_URL` 마지막에는 `/`를 붙이지 않는다. `PORT`는 Render가 자동으로 제공하므로 등록하지 않는다.

## 최초 배포

1. Render PostgreSQL을 생성한다.
2. GitHub 백엔드 저장소로 Web Service를 생성한다.
3. Web Service 설정과 환경변수를 입력한다.
4. `Deploy web service`를 실행한다.
5. 배포 로그와 `/health` 응답을 확인한다.

백엔드 배포 후 발급된 Render 주소를 Netlify에 등록하고 프론트엔드를 다시 배포한다.

## 재배포

Public Git Repository 방식은 자동 배포를 지원하지 않는다.

1. `develop` 브랜치를 `main`에 병합한다.
2. `Manual Deploy → Deploy latest commit`을 실행한다.
3. 배포 로그와 `/health` 응답을 확인한다.

## 시드 데이터

시드는 새로운 빈 데이터베이스에 최초 한 번만 실행한다. 일회성 시드가 필요한 경우 Build Command를 아래와 같이 임시 변경한다.

```bash
npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && NODE_ENV=development node prisma/seed.js
```

시드 완료 후 Build Command를 즉시 원래대로 되돌린다. 시드 스크립트는 기존 데이터를 삭제하므로 운영 데이터가 있는 환경에서는 실행하지 않는다.

## 배포 확인

`https://<service>.onrender.com/health`에서 아래 응답을 확인한다.

```json
{
  "status": "ok"
}
```

이후 회원가입, 로그인, 포토카드 생성, 이미지 업로드 등 핵심 기능을 확인한다.

## 주의사항

- 환경변수와 비밀키를 Git에 올리지 않는다.
- 운영 환경에서는 `prisma migrate dev`를 사용하지 않는다.
- 시드 명령을 기본 Build Command에 포함하지 않는다.
- 무료 Web Service의 첫 요청은 응답이 늦을 수 있다.
- 무료 PostgreSQL의 만료일을 확인한다.
