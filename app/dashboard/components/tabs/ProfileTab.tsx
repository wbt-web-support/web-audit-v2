'use client'

import { ProfileSubTabs } from './profile-subtabs'

interface ProfileTabProps {
  userProfile: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    full_name?: string
    avatar_url?: string
    role: 'user' | 'admin'
    email_confirmed: boolean
    created_at: string
    updated_at?: string
  }
}

export default function ProfileTab({ userProfile }: ProfileTabProps) {
  return <ProfileSubTabs userProfile={userProfile} />
}
