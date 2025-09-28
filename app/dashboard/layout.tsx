import { AuthProvider } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}