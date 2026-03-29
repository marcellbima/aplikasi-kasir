// src/controllers/product.controller.js
const { PrismaClient } = require('@prisma/client');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response.utils');

const prisma = new PrismaClient();

const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', categoryId, lowStock } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (lowStock === 'true') where.stock = { lte: prisma.product.fields.minStock };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    return paginatedResponse(res, products, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
};

const getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: { category: { select: { name: true } } },
    });
    if (!product || !product.isActive) {
      return errorResponse(res, 'Produk tidak ditemukan.', 404);
    }
    return successResponse(res, product);
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, stockLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) return errorResponse(res, 'Produk tidak ditemukan.', 404);
    return successResponse(res, product);
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, sku, barcode, categoryId, price, costPrice, stock, minStock, rackLocation, description } = req.body;

    const product = await prisma.product.create({
      data: { name, sku, barcode, categoryId, price, costPrice, stock: parseInt(stock) || 0, minStock: parseInt(minStock) || 5, rackLocation, description },
      include: { category: { select: { name: true } } },
    });

    if (stock > 0) {
      await prisma.stockLog.create({
        data: { productId: product.id, change: parseInt(stock), reason: 'Stok awal', stockBefore: 0, stockAfter: parseInt(stock) },
      });
    }

    return successResponse(res, product, 'Produk berhasil ditambahkan.', 201);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { name, sku, barcode, categoryId, price, costPrice, minStock, rackLocation, description, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, sku, barcode, categoryId, price, costPrice, minStock: parseInt(minStock), rackLocation, description, isActive },
      include: { category: { select: { name: true } } },
    });

    return successResponse(res, product, 'Produk berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { change, reason } = req.body;
    const productId = req.params.id;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return errorResponse(res, 'Produk tidak ditemukan.', 404);

    const newStock = product.stock + parseInt(change);
    if (newStock < 0) return errorResponse(res, 'Stok tidak cukup.', 400);

    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({ where: { id: productId }, data: { stock: newStock } }),
      prisma.stockLog.create({
        data: { productId, change: parseInt(change), reason, stockBefore: product.stock, stockAfter: newStock },
      }),
    ]);

    return successResponse(res, updatedProduct, 'Stok berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    return successResponse(res, null, 'Produk berhasil dihapus.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductByBarcode, getProduct, createProduct, updateProduct, adjustStock, deleteProduct };
