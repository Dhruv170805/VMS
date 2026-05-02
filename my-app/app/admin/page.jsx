import Dashboard from "@/components/admin/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute role="ADMIN">
      <Dashboard />
    </ProtectedRoute>
  );
}
