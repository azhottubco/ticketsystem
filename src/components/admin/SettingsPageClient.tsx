'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Trash2, Plus } from 'lucide-react'

export function SettingsPageClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      toast.success('Category added')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to add category')
    }
    setAdding(false)
  }

  async function handleDelete() {
    if (!deleteCategory) return
    setDeleting(true)
    const res = await fetch(`/api/categories/${deleteCategory.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== deleteCategory.id))
      toast.success('Category deleted')
    } else {
      toast.error('Failed to delete category')
    }
    setDeleting(false)
    setDeleteCategory(null)
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage ticket categories and system configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-700">{category.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600"
                  onClick={() => setDeleteCategory(category)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteCategory}
        onOpenChange={open => !open && setDeleteCategory(null)}
        title="Delete category"
        description={`Remove "${deleteCategory?.name}"? Existing tickets using this category will have their category cleared.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
