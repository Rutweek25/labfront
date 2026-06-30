import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader } from "./components/Loader";

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard").then((m) => ({ default: m.DoctorDashboard })));
const ExistingPatientPage = lazy(() => import("./pages/ExistingPatientPage").then((m) => ({ default: m.ExistingPatientPage })));
const NewPatientPage = lazy(() => import("./pages/NewPatientPage").then((m) => ({ default: m.NewPatientPage })));
const CreatePatientPage = lazy(() => import("./pages/CreatePatientPage").then((m) => ({ default: m.CreatePatientPage })));
const LabDashboard = lazy(() => import("./pages/LabDashboard").then((m) => ({ default: m.LabDashboard })));
const PaymentPage = lazy(() => import("./pages/PaymentPage").then((m) => ({ default: m.PaymentPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const AdminLayoutPage = lazy(() => import("./pages/admin/AdminLayoutPage").then((m) => ({ default: m.AdminLayoutPage })));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage })));
const AdminTestsPage = lazy(() => import("./pages/admin/AdminTestsPage").then((m) => ({ default: m.AdminTestsPage })));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage").then((m) => ({ default: m.AdminPaymentsPage })));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage").then((m) => ({ default: m.AdminReportsPage })));
const AdminAuditLogsPage = lazy(() => import("./pages/admin/AdminAuditLogsPage").then((m) => ({ default: m.AdminAuditLogsPage })));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage })));

function App() {

  return (
    <Suspense fallback={<div className="mx-auto mt-8 max-w-6xl"><Loader label="Loading page..." /></div>}>
      <Routes>
        <Route path="/home" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
              <ProtectedRoute allowedRoles={["DOCTOR", "TECHNICIAN", "ADMIN"]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/login" replace />} />
          <Route
            path="doctor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-patient"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <CreatePatientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-request/existing"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <ExistingPatientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-request/new"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <NewPatientPage />
              </ProtectedRoute>
            }
          />
          <Route path="doctor" element={<Navigate to="/doctor-dashboard" replace />} />
          <Route path="patients/new" element={<Navigate to="/create-patient" replace />} />
          <Route
            path="lab-dashboard"
            element={
              <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
                <LabDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="tests"
            element={
              <ProtectedRoute allowedRoles={["TECHNICIAN", "ADMIN"]}>
                <AdminTestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="payments"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR", "TECHNICIAN", "ADMIN"]}>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR", "TECHNICIAN", "ADMIN"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayoutPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="tests" element={<AdminTestsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
