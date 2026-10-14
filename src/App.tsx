import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import { ProtectedRoute } from "#components/auth/ProtectedRoute"
import { AppLayout } from "#components/layout/AppLayout"
import { DashboardPage } from "./pages/DashboardPage"
import { AdminUsersPage } from "./pages/admin-users/AdminUsersPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { RegisterOwnerPage } from "./pages/auth/RegisterOwnerPage"
import { RegistrationStatusPage } from "./pages/owner/RegistrationStatusPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-owner" element={<RegisterOwnerPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<AdminUsersPage />} />
            <Route
              path="/owner/registration-status"
              element={<RegistrationStatusPage />}
            />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
