import { AuthProvider } from '@/lib/auth/auth-context';
import { SidebarProvider } from '@/lib/contexts/sidebar-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

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