import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkSSIOrganizationMembership, determineUserRole } from '@/lib/github'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      try {
        // Get the user's GitHub access token
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.provider_token

        if (accessToken && data.user.user_metadata?.user_name) {
          // Check GitHub organization membership
          const { isMember, role } = await checkSSIOrganizationMembership(
            accessToken,
            data.user.user_metadata.user_name
          )

          // Determine user role based on GitHub org membership
          const userRole = isMember ? determineUserRole(role) : 'member'

          // Update user profile with GitHub org information
          await supabase
            .from('users')
            .update({
              ssi_org_member: isMember,
              ssi_org_role: role,
              role: userRole,
            })
            .eq('id', data.user.id)

          console.log(`User ${data.user.user_metadata.user_name} - SSI Member: ${isMember}, Role: ${userRole}`)
        }
      } catch (orgError) {
        console.error('Error checking GitHub organization:', orgError)
        // Continue with login even if org check fails
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}