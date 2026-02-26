import { prisma } from '@/lib/prisma'
import { NewTicketForm } from '@/components/tickets/NewTicketForm'

export default async function NewTicketPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Submit a Ticket</h1>
        <p className="text-sm text-slate-500 mt-1">Describe your issue and our team will get back to you.</p>
      </div>
      <NewTicketForm categories={categories} />
    </div>
  )
}
