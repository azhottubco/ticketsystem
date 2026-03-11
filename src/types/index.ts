export type UserRole = 'admin' | 'agent' | 'user'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  id: string
  email: string
  fullName: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface TicketAttachment {
  id: string
  ticketId: string
  uploadedById: string
  filename: string
  url: string
  size: number
  mimeType: string
  createdAt: string
  uploadedBy?: Pick<User, 'id' | 'fullName' | 'email'> | null
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  categoryId: string | null
  createdById: string
  assignedToId: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  // Joined
  category?: Category | null
  creator?: User | null
  assignee?: User | null
  history?: TicketHistory[]
  attachments?: TicketAttachment[]
}

export interface Comment {
  id: string
  ticketId: string
  authorId: string
  body: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
  author?: User | null
}

export interface TicketHistory {
  id: string
  ticketId: string
  changedById: string
  field: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
  changer?: User | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
}
