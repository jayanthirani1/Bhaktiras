export interface TimelineItem {
  id: string
  year: string
  title: string
  description: string
  imageUrl?: string | null
}

export interface Event {
  id: string
  time: string
  title: string
  description: string
  isLive: boolean
}

export interface GratitudeMessage {
  id: string
  name: string
  message: string
  createdAt?: { seconds: number; nanoseconds: number } | Date
}

export interface VolunteerRole {
  id: string
  role: string
  timeSlot: string
  isFilled: boolean
}

export interface TimeCapsuleMessage {
  id: string
  message: string
  submittedAt?: { seconds: number; nanoseconds: number } | Date
}
