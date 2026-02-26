import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'
import { TicketStatus } from '@/types'

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
