const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Membuat/Memperbarui akun...");

    // Akun Admin 1 (evan)
    const evanPassword = await bcrypt.hash('evan123', 12);
    await prisma.user.upsert({
        where: { email: 'evan' },
        update: { password: evanPassword, role: 'ADMIN', name: 'Evan' },
        create: { email: 'evan', name: 'Evan', password: evanPassword, role: 'ADMIN' },
    });

    // Akun Admin 2 (mtech)
    const mtechPassword = await bcrypt.hash('mtech123', 12);
    await prisma.user.upsert({
        where: { email: 'mtech' },
        update: { password: mtechPassword, role: 'ADMIN', name: 'MTech' },
        create: { email: 'mtech', name: 'MTech', password: mtechPassword, role: 'ADMIN' },
    });

    // Akun Kasir (kasir)
    const kasirPassword = await bcrypt.hash('kasir123', 12);
    await prisma.user.upsert({
        where: { email: 'kasir' },
        update: { password: kasirPassword, role: 'KASIR', name: 'Kasir Utama' },
        create: { email: 'kasir', name: 'Kasir Utama', password: kasirPassword, role: 'KASIR' },
    });

    // Hapus akun admin yang lama supaya rapi
    try {
        await prisma.user.delete({ where: { email: 'admin' } });
        console.log("Akun bawaan 'admin' yang lama telah dihapus.");
    } catch (e) {
        // Abaikan jika akun admin sudah terhapus/tidak ada
    }

    console.log("Selesai! Akun evan, mtech, dan kasir sudah bisa digunakan.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
