'use client'

import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface DashboardHeaderProps {
  user: User
  profile: UserProfile | null
}

export default function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Stanford SSI Inventory</h1>
          {profile && (
            <div className="flex items-center space-x-2">
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                {profile.role}
              </Badge>
              {profile.ssi_org_member && (
                <Badge variant="outline" className="text-xs">
                  SSI {profile.ssi_org_role}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium">
              {profile?.name || user.email}
            </div>
            {profile?.github_username && (
              <div className="text-xs text-muted-foreground">
                @{profile.github_username}
              </div>
            )}
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}