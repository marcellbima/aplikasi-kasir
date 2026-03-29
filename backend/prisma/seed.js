// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'smartphone' },
      update: {},
      create: { name: 'Smartphone', slug: 'smartphone' },
    }),
    prisma.category.upsert({
      where: { slug: 'laptop' },
      update: {},
      create: { name: 'Laptop', slug: 'laptop' },
    }),
    prisma.category.upsert({
      where: { slug: 'aksesoris' },
      update: {},
      create: { name: 'Aksesoris', slug: 'aksesoris' },
    }),
    prisma.category.upsert({
      where: { slug: 'audio' },
      update: {},
      create: { name: 'Audio', slug: 'audio' },
    }),
    prisma.category.upsert({
      where: { slug: 'kabel-charger' },
      update: {},
      create: { name: 'Kabel & Charger', slug: 'kabel-charger' },
    }),
  ]);

  console.log('✅ Categories created');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create kasir user
  const kasirPassword = await bcrypt.hash('kasir123', 12);
  await prisma.user.upsert({
    where: { email: 'kasir' },
    update: {},
    create: {
      name: 'Kasir Utama',
      email: 'kasir',
      password: kasirPassword,
      role: 'KASIR',
    },
  });

  console.log('✅ Users created');

  // Create products
  const products = [
    {
      name: 'Samsung Galaxy A55',
      sku: 'SAM-A55-5G',
      barcode: '8806095071234',
      categoryId: categories[0].id,
      price: 5499000,
      costPrice: 4800000,
      stock: 15,
      minStock: 3,
      rackLocation: 'A1',
    },
    {
      name: 'iPhone 15 128GB',
      sku: 'APL-IP15-128',
      barcode: '0194253382041',
      categoryId: categories[0].id,
      price: 14999000,
      costPrice: 13500000,
      stock: 8,
      minStock: 2,
      rackLocation: 'A2',
    },
    {
      name: 'Xiaomi Redmi Note 13',
      sku: 'XMI-RN13-6128',
      barcode: '6941812726303',
      categoryId: categories[0].id,
      price: 2499000,
      costPrice: 2100000,
      stock: 25,
      minStock: 5,
      rackLocation: 'A3',
    },
    {
      name: 'ASUS VivoBook 14',
      sku: 'ASU-VB14-R5',
      barcode: '4718017671234',
      categoryId: categories[1].id,
      price: 8999000,
      costPrice: 7800000,
      stock: 6,
      minStock: 2,
      rackLocation: 'B1',
    },
    {
      name: 'Lenovo IdeaPad Slim 3',
      sku: 'LEN-IP3-I5',
      barcode: '0196800000001',
      categoryId: categories[1].id,
      price: 7499000,
      costPrice: 6500000,
      stock: 4,
      minStock: 2,
      rackLocation: 'B2',
    },
    {
      name: 'Airpods Pro 2',
      sku: 'APL-APP2-WL',
      barcode: '0194253405786',
      categoryId: categories[3].id,
      price: 3799000,
      costPrice: 3200000,
      stock: 12,
      minStock: 3,
      rackLocation: 'C1',
    },
    {
      name: 'JBL Tune 520BT',
      sku: 'JBL-T520-BT',
      barcode: '6925281976001',
      categoryId: categories[3].id,
      price: 699000,
      costPrice: 550000,
      stock: 20,
      minStock: 5,
      rackLocation: 'C2',
    },
    {
      name: 'Charger GaN 65W',
      sku: 'GAN-65W-USB',
      barcode: '6970819210001',
      categoryId: categories[4].id,
      price: 299000,
      costPrice: 190000,
      stock: 30,
      minStock: 10,
      rackLocation: 'D1',
    },
    {
      name: 'Kabel USB-C 1m Braided',
      sku: 'CBL-USBC-1M',
      barcode: '6970819210002',
      categoryId: categories[4].id,
      price: 89000,
      costPrice: 45000,
      stock: 2,
      minStock: 10,
      rackLocation: 'D2',
    },
    {
      name: 'Case iPhone 15 Premium',
      sku: 'CSE-IP15-PRM',
      barcode: '6970819210003',
      categoryId: categories[2].id,
      price: 149000,
      costPrice: 75000,
      stock: 18,
      minStock: 5,
      rackLocation: 'E1',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('✅ Products created');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Admin  → admin@elektrokasir.com / admin123');
  console.log('   Kasir  → kasir@elektrokasir.com / kasir123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
