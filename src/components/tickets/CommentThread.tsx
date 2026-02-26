import { format } from 'date-fns'
import { Comment } from '@/types'
import { Lock } from 'lucide-react'

interface Props {
  comments: Comment[]
  currentUserId: string
  isStaff: boolean
}

export function CommentThread({ comments, currentUserId, isStaff }: Props) {
  if (comments.length === 0) {
    return <p className="text-sm text-slate-400 py-2">No replies yet.</p>
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isOwn = comment.authorId === currentUserId
        return (
          <div
            key={comment.id}
            className={`rounded-lg p-3 ${
              comment.isInternal
                ? 'bg-amber-50 border border-amber-200'
                : isOwn
                ? 'bg-blue-50 border border-blue-100'
                : 'bg-slate-50 border border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-800">
                  {comment.author?.fullName || comment.author?.email || 'Unknown'}
                </span>
                {comment.author?.role && comment.author.role !== 'user' && (
                  <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    {comment.author.role}
                  </span>
                )}
                {comment.isInternal && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    <Lock className="h-3 w-3" /> Internal
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
              </span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.body}</p>
          </div>
        )
      })}
    </div>
  )
}
