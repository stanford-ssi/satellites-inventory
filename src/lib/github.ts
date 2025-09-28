interface GitHubMembership {
  role: 'owner' | 'admin' | 'member'
  state: 'active' | 'pending'
}

interface GitHubUser {
  login: string
  id: number
  name: string
  email: string
}

export async function checkSSIOrganizationMembership(
  accessToken: string,
  username: string
): Promise<{ isMember: boolean; role: string | null }> {
  try {
    // Check if user is a member of stanford-ssi organization
    const membershipResponse = await fetch(
      `https://api.github.com/orgs/stanford-ssi/memberships/${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (membershipResponse.status === 404) {
      // User is not a member of the organization
      return { isMember: false, role: null }
    }

    if (!membershipResponse.ok) {
      console.error('GitHub API error:', membershipResponse.status)
      return { isMember: false, role: null }
    }

    const membership: GitHubMembership = await membershipResponse.json()

    if (membership.state === 'active') {
      return { isMember: true, role: membership.role }
    }

    return { isMember: false, role: null }
  } catch (error) {
    console.error('Error checking GitHub organization membership:', error)
    return { isMember: false, role: null }
  }
}

export async function getUserGitHubInfo(accessToken: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      console.error('GitHub API error:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching GitHub user info:', error)
    return null
  }
}

export function determineUserRole(orgRole: string | null): 'admin' | 'member' {
  // SSI organization owners and admins get admin access in the inventory system
  if (orgRole === 'owner' || orgRole === 'admin') {
    return 'admin'
  }

  // Regular members get member access
  return 'member'
}