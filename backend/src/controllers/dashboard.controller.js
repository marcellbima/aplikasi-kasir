// src/controllers/dashboard.controller.js
const { PrismaClient } = require('@prisma/client');
const { successResponse } = require('../utils/response.utils');

const prisma = new PrismaClient();

const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todaySales,
      todayTransactionCount,
      totalProducts,
      lowStockProducts,
      recentTransactions,
      topProducts,
    ] = await Promise.all([
      // Today revenue
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: today, lte: todayEnd } },
        _sum: { total: true },
        _count: true,
      }),
      // Transaction count
      prisma.transaction.count({
        where: { status: 'COMPLETED', createdAt: { gte: today, lte: todayEnd } },
      }),
      // Total products
      prisma.product.count({ where: { isActive: true } }),
      // Low stock (stock <= minStock)
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 10 } },
        select: { id: true, name: true, stock: true, minStock: true, rackLocation: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      // Recent transactions
      prisma.transaction.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { name: true } }, items: { select: { quantity: true } } },
      }),
      // Top selling products this month
      prisma.transactionItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          transaction: {
            status: 'COMPLETED',
            createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
          },
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Weekly revenue (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const result = await prisma.transaction.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: day, lte: dayEnd } },
        _sum: { total: true },
        _count: true,
      });

      weeklyData.push({
        date: day.toISOString().split('T')[0],
        revenue: parseFloat(result._sum.total || 0),
        count: result._count,
      });
    }

    return successResponse(res, {
      today: {
        revenue: parseFloat(todaySales._sum.total || 0),
        transactions: todayTransactionCount,
      },
      totalProducts,
      lowStockCount: lowStockProducts.filter((p) => p.stock <= p.minStock).length,
      lowStockProducts,
      recentTransactions,
      topProducts,
      weeklyRevenue: weeklyData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
