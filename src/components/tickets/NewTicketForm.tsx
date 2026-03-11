'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Paperclip, X, FileText, Image } from 'lucide-react'
import { Category } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Please describe your issue in more detail'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category_id: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  return mimeType.startsWith('image/') ? (
    <Image className="h-4 w-4 text-blue-500" />
  ) : (
    <FileText className="h-4 w-4 text-slate-500" />
  )
}

export function NewTicketForm({ categories }: { categories: Pick<Category, 'id' | 'name'>[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const valid: File[] = []
    for (const f of selected) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: file type not allowed`)
        continue
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: exceeds 10 MB limit`)
        continue
      }
      valid.push(f)
    }
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
    e.target.value = ''
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, category_id: data.category_id || null }),
    })
    if (!res.ok) {
      toast.error('Failed to submit ticket. Please try again.')
      return
    }
    const ticket = await res.json()

    // Upload attachments
    if (files.length > 0) {
      let failed = 0
      await Promise.all(files.map(async (file) => {
        const fd = new FormData()
        fd.append('file', file)
        const r = await fetch(`/api/tickets/${ticket.id}/attachments?skipNotify=1`, { method: 'POST', body: fd })
        if (!r.ok) failed++
      }))
      if (failed > 0) toast.warning(`${failed} attachment(s) failed to upload`)
    }

    toast.success('Ticket submitted successfully!')
    router.push(`/tickets/${ticket.id}`)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input id="title" placeholder="Brief summary of your issue" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              placeholder="Describe your issue in detail. Include steps to reproduce if applicable."
              rows={6}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select onValueChange={v => setValue('category_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select defaultValue="medium" onValueChange={v => setValue('priority', v as FormData['priority'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
            {files.length > 0 && (
              <ul className="space-y-1.5">
                {files.map(f => (
                  <li key={f.name} className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                    <FileIcon mimeType={f.type} />
                    <span className="flex-1 truncate text-slate-700">{f.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{formatBytes(f.size)}</span>
                    <button type="button" onClick={() => removeFile(f.name)} className="text-slate-400 hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Paperclip className="h-4 w-4" />
              Add files
            </Button>
            <p className="text-xs text-slate-400">Images, PDF, Word, TXT — max 10 MB each</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
