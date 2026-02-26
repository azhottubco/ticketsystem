'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Comment } from '@/types'

interface Props {
  ticketId: string
  isStaff: boolean
  onCommentAdded: (comment: Comment) => void
}

export function CommentForm({ ticketId, isStaff, onCommentAdded }: Props) {
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim(), isInternal }),
    })
    if (res.ok) {
      const comment = await res.json()
      onCommentAdded(comment)
      setBody('')
      setIsInternal(false)
      toast.success(isInternal ? 'Internal note added' : 'Reply posted')
    } else {
      toast.error('Failed to post reply')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={isInternal ? 'Write an internal note (not visible to users)…' : 'Write a reply…'}
        rows={3}
        className={isInternal ? 'border-amber-300 bg-amber-50' : ''}
      />
      <div className="flex items-center justify-between">
        {isStaff && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={e => setIsInternal(e.target.checked)}
              className="h-3.5 w-3.5 rounded"
            />
            <span className={isInternal ? 'text-amber-700 font-medium' : 'text-slate-600'}>
              Internal note
            </span>
          </label>
        )}
        <div className="ml-auto">
          <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
            {submitting ? 'Posting…' : isInternal ? 'Add note' : 'Reply'}
          </Button>
        </div>
      </div>
    </form>
  )
}
