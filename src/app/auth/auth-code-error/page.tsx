import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-destructive">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center">
            There was an error confirming your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This could happen if the confirmation link has expired or has already been used.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              If you continue to have issues, please check your Supabase URL configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}