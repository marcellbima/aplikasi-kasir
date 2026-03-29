// src/controllers/transaction.controller.js
const { PrismaClient } = require('@prisma/client');
const { generateInvoiceNumber } = require('../utils/invoice.utils');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response.utils');

const prisma = new PrismaClient();

const createTransaction = async (req, res, next) => {
  try {
    const { items, paymentMethod, amountPaid, discountAmount = 0, notes } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return errorResponse(res, 'Keranjang belanja kosong.', 400);
    }

    // Validate and fetch products
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });

    if (products.length !== productIds.length) {
      return errorResponse(res, 'Beberapa produk tidak ditemukan.', 400);
    }

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    // Check stock & build items
    const transactionItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap[item.productId];
      if (product.stock < item.quantity) {
        return errorResponse(res, `Stok ${product.name} tidak mencukupi. Tersedia: ${product.stock}`, 400);
      }

      const discountPct = item.discountPct || 0;
      const unitPrice = parseFloat(product.price);
      const itemSubtotal = unitPrice * item.quantity * (1 - discountPct / 100);
      subtotal += itemSubtotal;

      transactionItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        discountPct,
        subtotal: itemSubtotal,
      });
    }

    const total = subtotal - parseFloat(discountAmount);
    const changeAmount = parseFloat(amountPaid) - total;

    if (changeAmount < 0) {
      return errorResponse(res, 'Pembayaran kurang dari total transaksi.', 400);
    }

    const invoiceNumber = generateInvoiceNumber();

    // Execute transaction
    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          userId,
          subtotal,
          discountAmount: parseFloat(discountAmount),
          taxAmount: 0,
          total,
          paymentMethod,
          amountPaid: parseFloat(amountPaid),
          changeAmount,
          status: 'COMPLETED',
          notes,
          items: { create: transactionItems },
        },
        include: { items: true, user: { select: { name: true } } },
      });

      // Update stock for each item
      for (const item of items) {
        const product = productMap[item.productId];
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: `Transaksi ${invoiceNumber}`,
            stockBefore: product.stock,
            stockAfter: product.stock - item.quantity,
          },
        });
      }

      return newTransaction;
    });

    return successResponse(res, transaction, 'Transaksi berhasil.', 201);
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: 'COMPLETED' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (req.user.role === 'KASIR') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    return paginatedResponse(res, transactions, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: { select: { name: true, sku: true, rackLocation: true } } } },
        user: { select: { name: true } },
      },
    });
    if (!transaction) return errorResponse(res, 'Transaksi tidak ditemukan.', 404);
    return successResponse(res, transaction);
  } catch (err) {
    next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, notes } = req.body;

    if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Akses ditolak. Fitur khusus admin.', 403);
    }

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) return errorResponse(res, 'Transaksi tidak ditemukan.', 404);

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status, paymentMethod, notes },
    });

    return successResponse(res, updated, 'Transaksi berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Akses ditolak. Fitur khusus admin.', 403);
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!transaction) return errorResponse(res, 'Transaksi tidak ditemukan.', 404);

    await prisma.$transaction(async (tx) => {
      for (const item of transaction.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              change: item.quantity,
              reason: `Cancel Transaksi ${transaction.invoiceNumber}`,
              stockBefore: product.stock,
              stockAfter: product.stock + item.quantity,
            }
          });
        }
      }
      await tx.transaction.delete({ where: { id } });
    });

    return successResponse(res, null, 'Transaksi berhasil dihapus dan stok dikembalikan.');
  } catch (err) {
    next(err);
  }
};

module.exports = { createTransaction, getTransactions, getTransaction, updateTransaction, deleteTransaction };
