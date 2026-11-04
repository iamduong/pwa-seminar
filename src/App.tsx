import { BrowserRouter, Navigate, Route, Routes } from "react-router";

// Protect router component
import { ProtectedRoute } from "#components/auth/ProtectedRoute";
// Layout
import { AdminLayout } from "#components/layout/AdminLayout";
import { ClientLayout } from "#components/layout/ClientLayout";
// Authorize page
import { LoginPage } from "./pages/authorize/LoginPage";
import { RegisterPage } from "./pages/authorize/RegisterPage";
// Client page
import HomePage from "./pages/HomePage";
import { ProfilePage } from "./pages/client/ProfilePage";
import { RegisterOwnerPage } from "./pages/client/RegisterOwnerPage";
// Admin page
import PoiOwnerRegistrationsPage from "./pages/admin/poi-owner-registration/PoiOwnerRegistrationsPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import RoleFormPage from "./pages/admin/roles/RoleFormPage";
import PoiSubmissionPage from "./pages/admin/poi-submission/PoiSubmissionPage";
import PoiSubmissionRegisterPage from "./pages/admin/poi-submission/PoiSubmissionRegisterPage";
import PoiSubmissionListPage from "./pages/admin/poi-submission/PoiSubmissionListPage";
import PoiSubmissionDetailPage from "./pages/admin/poi-submission/PoiSubmissionDetailPage";
import PoiTaskMonitorPage from "./pages/admin/poi-submission/PoiTaskMonitorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routers */}
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ClientLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/mon-an" element={<HomePage />} />
            <Route path="/gan-toi" element={<HomePage />} />
            <Route path="/quet-qr" element={<HomePage />} />
            <Route path="/ho-so" element={<ProfilePage />} />
            <Route path="/chu-quan" element={<RegisterOwnerPage />} />
          </Route>

          <Route path="/quan-ly" element={<AdminLayout />}>
            <Route path="don-chu-qua" element={<PoiOwnerRegistrationsPage />} />
            <Route path="danh-sach-vai-tro" element={<RolesPage />} />
            <Route path="them-vai-tro" element={<RoleFormPage mode="create" />} />
            <Route
              path="vai-tro/:roleId/chinh-sua"
              element={<RoleFormPage mode="edit" />}
            />
            {/* Review poi submission */}
            <Route path="don-dang-ky-poi">
              <Route path="danh-sach-don-poi" element={<PoiSubmissionListPage />} />
              <Route path="xem-tien-trinh" element={<PoiTaskMonitorPage />} />
              <Route path="duyet-don-poi">
                <Route
                  index
                  element={
                    <Navigate
                      to="/quan-ly/don-dang-ky-poi/danh-sach-don-poi?status=pending"
                      replace
                    />
                  }
                />
                <Route path=":id" element={<PoiSubmissionDetailPage />} />
              </Route>
            </Route>

            {/* poi owner registration features */}
            <Route path="don-dang-ky-chu-quan">
              <Route path="danh-sach-don-dang-ky" element={<PoiOwnerRegistrationsPage />} />
            </Route>

            {/* poi owner features */}
            <Route path="chu-quan">
              <Route path="poi-cua-toi" element={<PoiSubmissionPage />}/>
              <Route path="gui-yeu-cau-them-poi" element={<PoiSubmissionRegisterPage />}/>
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
