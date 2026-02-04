/**
 * Admin En Pensent Page
 * CEO-only access: a.arthur.shelton@gmail.com
 * 55-Adapter Universal Engine Control Center
 */

import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminEnPensentDashboard } from '@/components/admin/AdminEnPensentDashboard';

export default function AdminEnPensentPage() {
  return (
    <AdminRoute featureName="En Pensent Engine">
      <AdminEnPensentDashboard />
    </AdminRoute>
  );
}
