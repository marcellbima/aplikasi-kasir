const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Updating admin email to 'admin'...");
    await prisma.user.updateMany({
        where: { email: 'admin@elektrokasir.com' },
        data: { email: 'admin' },
    });

    console.log("Updating kasir email to 'kasir'...");
    await prisma.user.updateMany({
        where: { email: 'kasir@elektrokasir.com' },
        data: { email: 'kasir' },
    });

    console.log("Selesai!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
