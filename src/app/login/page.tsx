'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Github } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGitHubSignIn = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:org read:user user:email',
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In to Inventory
          </CardTitle>
          <CardDescription className="text-center">
            Sign in with your GitHub account to access the Stanford SSI inventory system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <Github className="mr-2 h-5 w-5" />
            {isLoading ? 'Signing in...' : 'Continue with GitHub'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Access levels are determined by your Stanford SSI GitHub organization membership:
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Owners/Admins:</strong> Full inventory management access</div>
              <div><strong>Members:</strong> View-only access</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}