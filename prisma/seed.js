import "dotenv/config";

import { readFile } from "node:fs/promises";

import bcrypt from "bcrypt";

import prisma from "../config/prisma.js";

const DATA_URL = new URL(
  "./data/photo-card-marketplace-mock-data.json",
  import.meta.url,
);
const BCRYPT_SALT_ROUNDS = 10;

const toBigInt = (value) => BigInt(value);
const toDate = (value) => new Date(value);
const toNullableBigInt = (value) =>
  value === null ? null : BigInt(value);
const toNullableDate = (value) => (value === null ? null : new Date(value));

async function loadSeedData() {
  const json = await readFile(DATA_URL, "utf8");
  return JSON.parse(json);
}

async function resetSequences(tx) {
  const tableNames = [
    "User",
    "PhotoCard",
    "Ownership",
    "SaleListing",
    "Purchase",
    "Exchange",
    "Notification",
    "RandomPointDraw",
    "PointTransaction",
  ];

  for (const tableName of tableNames) {
    await tx.$queryRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM "${tableName}"`,
    );
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("운영 환경에서는 mock seed를 실행할 수 없습니다.");
  }

  const data = await loadSeedData();
  const defaultPassword = data._meta?.mockLogin?.defaultPassword;

  if (!defaultPassword) {
    throw new Error("mock 데이터에서 기본 로그인 비밀번호를 찾을 수 없습니다.");
  }

  const passwordHash = await bcrypt.hash(
    defaultPassword,
    BCRYPT_SALT_ROUNDS,
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.notification.deleteMany();
      await tx.pointTransaction.deleteMany();
      await tx.randomPointDraw.deleteMany();
      await tx.exchange.deleteMany();
      await tx.purchase.deleteMany();
      await tx.saleListing.deleteMany();
      await tx.ownership.deleteMany();
      await tx.photoCard.deleteMany();
      await tx.user.deleteMany();

      await tx.user.createMany({
        data: data.users.map((user) => ({
          ...user,
          id: toBigInt(user.id),
          passwordHash: user.provider === "EMAIL" ? passwordHash : null,
          createdAt: toDate(user.createdAt),
        })),
      });

      await tx.photoCard.createMany({
        data: data.photoCards.map((photoCard) => ({
          ...photoCard,
          id: toBigInt(photoCard.id),
          creatorId: toBigInt(photoCard.creatorId),
          createdAt: toDate(photoCard.createdAt),
        })),
      });

      await tx.ownership.createMany({
        data: data.ownerships.map((ownership) => ({
          ...ownership,
          id: toBigInt(ownership.id),
          ownerId: toBigInt(ownership.ownerId),
          photoCardId: toBigInt(ownership.photoCardId),
          createdAt: toDate(ownership.createdAt),
          updatedAt: toDate(ownership.updatedAt),
        })),
      });

      await tx.saleListing.createMany({
        data: data.saleListings.map((saleListing) => ({
          ...saleListing,
          id: toBigInt(saleListing.id),
          sellerId: toBigInt(saleListing.sellerId),
          photoCardId: toBigInt(saleListing.photoCardId),
          createdAt: toDate(saleListing.createdAt),
          updatedAt: toDate(saleListing.updatedAt),
        })),
      });

      await tx.purchase.createMany({
        data: data.purchases.map((purchase) => ({
          ...purchase,
          id: toBigInt(purchase.id),
          saleListingId: toBigInt(purchase.saleListingId),
          buyerId: toBigInt(purchase.buyerId),
          createdAt: toDate(purchase.createdAt),
        })),
      });

      await tx.exchange.createMany({
        data: data.exchanges.map((exchange) => ({
          ...exchange,
          id: toBigInt(exchange.id),
          saleListingId: toBigInt(exchange.saleListingId),
          requesterId: toBigInt(exchange.requesterId),
          offeredCardId: toBigInt(exchange.offeredCardId),
          createdAt: toDate(exchange.createdAt),
          resolvedAt: toNullableDate(exchange.resolvedAt),
        })),
      });

      await tx.notification.createMany({
        data: data.notifications.map((notification) => ({
          ...notification,
          id: toBigInt(notification.id),
          userId: toBigInt(notification.userId),
          relatedSaleListingId: toNullableBigInt(
            notification.relatedSaleListingId,
          ),
          relatedExchangeId: toNullableBigInt(
            notification.relatedExchangeId,
          ),
          relatedPurchaseId: toNullableBigInt(
            notification.relatedPurchaseId,
          ),
          createdAt: toDate(notification.createdAt),
        })),
      });

      await tx.randomPointDraw.createMany({
        data: data.randomPointDraws.map((draw) => ({
          ...draw,
          id: toBigInt(draw.id),
          userId: toBigInt(draw.userId),
          drawDate: toDate(draw.drawDate),
          createdAt: toDate(draw.createdAt),
        })),
      });

      await tx.pointTransaction.createMany({
        data: data.pointTransactions.map((transaction) => ({
          ...transaction,
          id: toBigInt(transaction.id),
          userId: toBigInt(transaction.userId),
          createdAt: toDate(transaction.createdAt),
        })),
      });

      await resetSequences(tx);
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  console.log("Mock 데이터 seed가 완료되었습니다.");
  console.log(
    `User ${data.users.length}, PhotoCard ${data.photoCards.length}, Ownership ${data.ownerships.length}, SaleListing ${data.saleListings.length}`,
  );
  console.log(
    `Purchase ${data.purchases.length}, Exchange ${data.exchanges.length}, Notification ${data.notifications.length}, RandomPointDraw ${data.randomPointDraws.length}, PointTransaction ${data.pointTransactions.length}`,
  );
}

main()
  .catch((error) => {
    console.error("Mock 데이터 seed에 실패했습니다.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
