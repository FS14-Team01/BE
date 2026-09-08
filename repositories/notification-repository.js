import prisma from '../config/prisma.js';

async function getNotifications(userId, isRead, limit, cursor) {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead,
    },
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: {
        id: cursor,
      },
    }),
    orderBy: {
      id: 'desc',
    },
    select: {
      id: true,
      type: true,
      relatedExchangeId: true,
      relatedExchange: {
        select: {
          requester: {
            select: {
              nickname: true,
            },
          },
          saleListing: {
            select: {
              seller: {
                select: {
                  nickname: true,
                },
              },
            },
          },
          offeredCard: {
            select: {
              name: true,
              grade: true,
            },
          },
        },
      },
      relatedSaleListingId: true,
      relatedSaleListing: {
        select: {
          photoCard: {
            select: {
              name: true,
              grade: true,
            },
          },
        },
      },
      relatedPurchaseId: true,
      relatedPurchase: {
        select: {
          buyer: {
            select: {
              nickname: true,
            },
          },
          saleListing: {
            select: {
              photoCard: {
                select: {
                  name: true,
                  grade: true,
                },
              },
            },
          },
          quantity: true,
        },
      },
      isRead: true,
      createdAt: true,
    },
  });
}

async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export default {
  getNotifications,
  markAllAsRead,
}
