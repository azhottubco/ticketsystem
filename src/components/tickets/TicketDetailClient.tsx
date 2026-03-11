'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Ticket, User, Comment, TicketHistory, TicketAttachment, Category, TicketStatus, TicketPriority } from '@/types'
import { TicketStatusBadge } from './TicketStatusBadge'
import { TicketPriorityBadge } from './TicketPriorityBadge'
import { CommentThread } from './CommentThread'
import { CommentForm } from './CommentForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trash2, Clock, Paperclip, FileText, Image, X, Download } from 'lucide-react'
import Link from 'next/link'

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

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  return mimeType.startsWith('image/') ? (
    <Image className="h-4 w-4 text-blue-500 shrink-0" />
  ) : (
    <FileText className="h-4 w-4 text-slate-500 shrink-0" />
  )
}

interface Props {
  initialTicket: Ticket
  currentUser: User
  agents: Pick<User, 'id' | 'fullName' | 'email'>[]
  categories: Pick<Category, 'id' | 'name'>[]
}

export function TicketDetailClient({ initialTicket, currentUser, agents, categories }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ticket, setTicket] = useState(initialTicket)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const isAdmin = currentUser.role === 'admin'
  const isStaff = currentUser.role !== 'user'

  useEffect(() => { fetchComments(); fetchAttachments() }, [ticket.id])

  async function fetchComments() {
    setLoadingComments(true)
    const res = await fetch(`/api/tickets/${ticket.id}/comments`)
    if (res.ok) setComments(await res.json())
    setLoadingComments(false)
  }

  async function fetchAttachments() {
    const res = await fetch(`/api/tickets/${ticket.id}/attachments`)
    if (res.ok) setAttachments(await res.json())
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('File type not allowed'); return }
    if (file.size > MAX_SIZE) { toast.error('File exceeds 10 MB limit'); return }

    setUploadingFile(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/tickets/${ticket.id}/attachments`, { method: 'POST', body: fd })
    if (res.ok) {
      const attachment = await res.json()
      setAttachments(prev => [...prev, attachment])
      toast.success('Attachment uploaded')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Upload failed')
    }
    setUploadingFile(false)
  }

  async function handleDeleteAttachment(attachmentId: string) {
    const res = await fetch(`/api/tickets/${ticket.id}/attachments/${attachmentId}`, { method: 'DELETE' })
    if (res.ok) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      toast.success('Attachment removed')
    } else {
      toast.error('Failed to remove attachment')
    }
  }

  async function updateTicket(updates: Partial<Ticket>) {
    setUpdating(true)
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      setTicket(await res.json())
      toast.success('Ticket updated')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to update ticket')
    }
    setUpdating(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/tickets/${ticket.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Ticket deleted')
      router.push('/tickets')
    } else {
      toast.error('Failed to delete ticket')
    }
    setDeleting(false)
    setDeleteOpen(false)
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/tickets" className="mt-1 text-slate-400 hover:text-slate-600 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 break-words">{ticket.title}</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">#{ticket.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="text-red-500 hover:text-red-600 shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Attachments {attachments.length > 0 && <span className="text-slate-400 font-normal text-sm">({attachments.length})</span>}</CardTitle>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {uploadingFile ? 'Uploading…' : 'Add file'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {attachments.length === 0 ? (
                <p className="text-sm text-slate-400">No attachments yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {attachments.map(a => (
                    <li key={a.id} className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                      <AttachmentIcon mimeType={a.mimeType} />
                      <span className="flex-1 truncate text-slate-700">{a.filename}</span>
                      <span className="text-xs text-slate-400 shrink-0">{formatBytes(a.size)}</span>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500" title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      {(isAdmin || a.uploadedById === currentUser.id) && (
                        <button type="button" onClick={() => handleDeleteAttachment(a.id)} className="text-slate-400 hover:text-red-500" title="Remove">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Discussion</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingComments ? (
                <LoadingSpinner className="h-20" />
              ) : (
                <CommentThread comments={comments} currentUserId={currentUser.id} isStaff={isStaff} />
              )}
              <Separator className="my-4" />
              <CommentForm
                ticketId={ticket.id}
                isStaff={isStaff}
                onCommentAdded={(c) => setComments(prev => [...prev, c])}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">STATUS</p>
                {isStaff ? (
                  <Select value={ticket.status} onValueChange={v => updateTicket({ status: v as TicketStatus })} disabled={updating}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <TicketStatusBadge status={ticket.status} />
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">PRIORITY</p>
                {isAdmin ? (
                  <Select value={ticket.priority} onValueChange={v => updateTicket({ priority: v as TicketPriority })} disabled={updating}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <TicketPriorityBadge priority={ticket.priority} />
                )}
              </div>

              {ticket.category && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">CATEGORY</p>
                  <p className="text-sm text-slate-700">{ticket.category.name}</p>
                </div>
              )}

              {isAdmin && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">ASSIGNED TO</p>
                  <Select
                    value={ticket.assignedToId || 'unassigned'}
                    onValueChange={v => updateTicket({ assignedToId: v === 'unassigned' ? null : v })}
                    disabled={updating}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.fullName || a.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!isAdmin && ticket.assignee && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">ASSIGNED TO</p>
                  <p className="text-sm text-slate-700">{ticket.assignee.fullName || ticket.assignee.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">SUBMITTED BY</p>
                <p className="text-slate-700">{ticket.creator?.fullName || ticket.creator?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">CREATED</p>
                <p className="text-slate-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">RESOLVED</p>
                  <p className="text-slate-700">{format(new Date(ticket.resolvedAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isStaff && ticket.history && ticket.history.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-slate-500">Activity</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {ticket.history.map((h: TicketHistory) => (
                    <div key={h.id} className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{h.changer?.fullName || '—'}</span>
                      {' changed '}
                      <span className="font-medium">{h.field}</span>
                      {h.oldValue && <> from <span className="text-slate-600">{h.oldValue}</span></>}
                      {' → '}
                      <span className="text-slate-700">{h.newValue || 'none'}</span>
                      <span className="block text-slate-400">{format(new Date(h.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete ticket"
        description="This will permanently delete the ticket and all its comments. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
