import api from '../existing/api/axios'

export interface MessageResponse {
  id: number
  senderId: number
  senderEmail: string
  recipientId?: number
  recipientEmail?: string
  content: string
  messageType: 'TEXT' | 'REPORT'
  subject: string
  reportPeriod?: string
  totalBookings?: number
  totalRevenue?: number
  totalShows?: number
  sentAt: string
  read: boolean
}

export interface SendMessageRequest {
  recipientId?: number
  subject?: string
  content: string
}

export async function fetchInbox(): Promise<MessageResponse[]> {
  const { data } = await api.get<MessageResponse[]>('/messages')
  return data
}

export async function sendMessage(req: SendMessageRequest): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/messages', req)
  return data
}

export async function markAsRead(id: number): Promise<string> {
  const { data } = await api.put<string>(`/messages/${id}/read`)
  return data
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<number>('/messages/unread-count')
  return data
}

export async function broadcastReports(): Promise<string> {
  const { data } = await api.post<string>('/messages/broadcast-reports')
  return data
}
