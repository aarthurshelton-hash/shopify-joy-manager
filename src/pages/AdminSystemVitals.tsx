import { AdminRoute } from "@/components/auth/AdminRoute";
import { SystemVitalsDashboard } from "@/components/admin/SystemVitalsDashboard";

const AdminSystemVitals = () => {
  return (
    <AdminRoute featureName="System Vitals">
      <SystemVitalsDashboard />
    </AdminRoute>
  );
};

export default AdminSystemVitals;
