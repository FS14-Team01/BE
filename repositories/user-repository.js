import prisma from "../config/prisma.js";

async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

async function findUserByNickname(nickname) {
  return prisma.user.findUnique({
    where: {
      nickname,
    },
  });
}

async function createUser({ email, nickname, passwordHash }) {
  return prisma.user.create({
    data: {
      email,
      nickname,
      passwordHash,
    },
  });
}

export default {
  findUserByEmail,
  findUserByNickname,
  createUser,
};
