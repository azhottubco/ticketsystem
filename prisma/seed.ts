import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed default categories
  const categories = [
    'Hardware',
    'Software',
    'Network',
    'Access / Permissions',
    'Email',
    'Other',
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  // Create a default admin account (change this password before going live)
  const password = await bcrypt.hash('Admin@123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password,
      fullName: 'Admin',
      role: 'admin',
    },
  })

  console.log('Seed complete. Default admin: admin@example.com / Admin@123')
  console.log('IMPORTANT: Change the admin password after first login!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
