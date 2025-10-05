import { AuthProvider } from '@/lib/auth/auth-context';
import { SidebarProvider } from '@/lib/contexts/sidebar-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </SidebarProvider>
    </AuthProvider>
  );
}