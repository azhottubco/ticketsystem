import { Badge } from '@/components/ui/badge'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants'
import { TicketPriority } from '@/types'

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant="outline" className={PRIORITY_COLORS[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  )
}
