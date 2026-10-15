import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import {
  ManagementPortalRoute,
  OwnerManagementRoute,
  OwnerRegistrationRoute,
} from "#components/auth/OwnerRoute"
import { ProtectedRoute } from "#components/auth/ProtectedRoute"
import { AppLayout } from "#components/layout/AppLayout"
import { UserLayout } from "#components/layout/UserLayout"
import { DashboardPage } from "./pages/DashboardPage"
import { AdminUsersPage } from "./pages/admin-users/AdminUsersPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { RegisterPage } from "./pages/auth/RegisterPage"
import { OwnerRegistrationPage } from "./pages/owner/OwnerRegistrationPage"
import { OwnerPoisPage } from "./pages/owner/OwnerPoisPage"
import { NewPoiSubmissionPage } from "./pages/owner/NewPoiSubmissionPage"
import { OwnerPoiDetailPage } from "./pages/owner/OwnerPoiDetailPage"
import PoiRegistrationsPage from "./pages/poi-registrations/PoiRegistrationsPage"
import { PoiRegistrationDetailPage } from "./pages/poi-registrations/PoiRegistrationDetailPage"
import { FeaturePlaceholderPage } from "./pages/user/FeaturePlaceholderPage"
import { ProfilePage } from "./pages/user/ProfilePage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-owner" element={<Navigate to="/register" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/trang-chu" element={<FeaturePlaceholderPage />} />
            <Route path="/mon-an" element={<FeaturePlaceholderPage />} />
            <Route path="/gan-toi" element={<FeaturePlaceholderPage />} />
            <Route path="/quet-qr" element={<FeaturePlaceholderPage />} />
            <Route path="/ho-so" element={<ProfilePage />} />

            <Route element={<OwnerRegistrationRoute />}>
              <Route path="/dang-ky-chu-quan" element={<OwnerRegistrationPage />} />
            </Route>
          </Route>

          <Route element={<ManagementPortalRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/quan-ly/danh-sach-nguoi-dung" element={<AdminUsersPage />} />

              <Route path="/quan-ly/duyet-don-poi" element={<PoiRegistrationsPage />} />
              <Route path="/quan-ly/duyet-don-poi/:submissionId" element={<PoiRegistrationDetailPage />} />

              <Route element={<OwnerManagementRoute permission="owner:manage_own_poi" />}>
                <Route path="/quan-ly/poi-cua-toi" element={<OwnerPoisPage />} />
                <Route path="/quan-ly/them-poi/:poiId" element={<OwnerPoiDetailPage />} />
              </Route>
              <Route element={<OwnerManagementRoute permission="owner:submit_poi" />}>
                <Route path="/quan-ly/gui-yeu-cau-poi" element={<NewPoiSubmissionPage />} />
              </Route>

            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/trang-chu" replace />} />
        <Route path="*" element={<Navigate to="/trang-chu" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
