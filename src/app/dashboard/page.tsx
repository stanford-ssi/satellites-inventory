import { createClient } from '@/lib/supabase/server'
import InventoryTable from '@/components/inventory/inventory-table'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user profile to check role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Get inventory data
  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
      </div>

      <InventoryTable
        inventory={inventory || []}
        userRole={profile?.role || 'member'}
      />
    </div>
  )
}