import { prisma } from '@/lib/prisma'
import { Category } from '@/types'
import { SettingsPageClient } from '@/components/admin/SettingsPageClient'

export default async function SettingsPage() {
  const raw = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  const categories: Category[] = JSON.parse(JSON.stringify(raw))
  return <SettingsPageClient initialCategories={categories} />
}
