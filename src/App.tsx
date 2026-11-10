import { BrowserRouter, Navigate, Route, Routes } from "react-router";

// Protect router component
import { ProtectedRoute } from "#components/auth/ProtectedRoute";
// Layout
import { AdminLayout } from "#components/layout/AdminLayout";
import { ClientLayout } from "#components/layout/ClientLayout";
// Authorize page
import { LoginPage } from "./pages/authorize/LoginPage";
import { RegisterPage } from "./pages/authorize/RegisterPage";
// Client pages
import { ResponsiveClientPage } from "./pages/client/ResponsiveClientPage";
import PoiDetailPage from "./pages/client/PoiDetailPage";
import MobilePlacesPage from "./pages/client/mobile/MobilePlacesPage";
import MobileFoodPage from "./pages/client/mobile/MobileFoodPage";
import MobilePoiDirectoryPage from "./pages/client/mobile/MobilePoiDirectoryPage";
import DesktopPlacesPage from "./pages/client/desktop/DesktopPlacesPage";
import DesktopFoodPage from "./pages/client/desktop/DesktopFoodPage";
// Admin page
import PoiOwnerRegistrationsPage from "./pages/admin/poi-owner-registration/PoiOwnerRegistrationsPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import RoleFormPage from "./pages/admin/roles/RoleFormPage";
import PoiSubmissionPage from "./pages/admin/poi-submission/PoiSubmissionPage";
import PoiSubmissionRegisterPage from "./pages/admin/poi-submission/PoiSubmissionRegisterPage";
import OwnerPoiSubmissionsPage from "./pages/admin/poi-submission/OwnerPoiSubmissionsPage";
import PoiSubmissionListPage from "./pages/admin/poi-submission/PoiSubmissionListPage";
import PoiSubmissionDetailPage from "./pages/admin/poi-submission/PoiSubmissionDetailPage";
import PoiTaskMonitorPage from "./pages/admin/poi-submission/PoiTaskMonitorPage";
import AdminUserCreatePage from "./pages/admin/user/AdminUserCreatePage";
import AdminUserEditPage from "./pages/admin/user/AdminUserEditPage";
import AdminUsersPage from "./pages/admin/user/AdminUsersPage";
import PoiListPage from "./pages/admin/poi/PoiListPage";
import PoiCreatePage from "./pages/admin/poi/PoiCreatePage";
import MenuListPage from "./pages/admin/menu/MenuListPage";
import MenuCreatePage from "./pages/admin/menu/MenuCreatePage";
import MenuItemsPage from "./pages/admin/menu/MenuItemsPage";
import MenuItemRequestPage from "./pages/admin/menu/MenuItemRequestPage";
import { MobileClientAccessGate } from "./components/layout/client/mobile/MobileClientAccessGate";
import { LanguageProvider } from "./providers/LanguageProvider";
import { PoiDataProvider } from "./providers/PoiDataProvider";
import MenuReviewPage from "./pages/admin/menu/MenuReviewPage";
import { UiBundleProvider } from "./providers/UiBundleProvider";
import OwnerPoiDetailPage from "./pages/admin/poi-submission/OwnerPoiDetailPage";
import SelfPoiOwnerRegistrationPage from "./pages/admin/poi-owner-registration/SelfPoiOwnerRegistrationPage";
import ManagementIndexPage from "./pages/admin/ManagementIndexPage";
import ChangePasswordPage from "./pages/admin/account/ChangePasswordPage";
import DashboardPage from "./pages/admin/dashboard/DashboardPage";

const ClientProviders = () => {
  return (
    <LanguageProvider>
      <UiBundleProvider>
        <PoiDataProvider>
          <MobileClientAccessGate />
        </PoiDataProvider>
      </UiBundleProvider>
    </LanguageProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routers */}
        <Route path="/quan-ly/dang-nhap" element={<LoginPage />} />
        <Route path="/quan-ly/dang-ky" element={<RegisterPage />} />

        {/* Client page and features */}
        <Route element={<ClientProviders />}>
          <Route element={<ClientLayout />}>
            <Route
              path="/"
              element={
                <ResponsiveClientPage
                  mobile={MobilePlacesPage}
                  desktop={DesktopPlacesPage}
                />
              }
            />
            <Route
              path="/mon-an"
              element={
                <ResponsiveClientPage
                  mobile={MobileFoodPage}
                  desktop={DesktopFoodPage}
                />
              }
            />
            <Route path="/dia-diem" element={<MobilePoiDirectoryPage />} />
            <Route path="/dia-diem/:id" element={<PoiDetailPage />} />
          </Route>
        </Route>

        {/* Admin page and features */}
        <Route element={<ProtectedRoute />}>
          <Route path="/quan-ly" element={<AdminLayout />}>
            <Route index element={<ManagementIndexPage />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="tai-khoan/doi-mat-khau" element={<ChangePasswordPage />} />

            <Route
              path="dang-ky-chu-quan"
              element={<SelfPoiOwnerRegistrationPage />}
            />

            {/* POI features */}
            <Route path="dia-diem-poi">
              <Route path="danh-sach-poi" element={<PoiListPage />} />
              <Route
                path="danh-sach-poi/:id"
                element={<OwnerPoiDetailPage mode="admin" />}
              />
              <Route path="them-poi" element={<PoiCreatePage />} />
              <Route path=":poiId/mon-an" element={<MenuListPage />} />
              <Route path=":poiId/mon-an/them" element={<MenuCreatePage />} />
              <Route path=":poiId/mon-an/yeu-cau" element={<MenuReviewPage />} />
            </Route>

            {/* Culinary features */}
            <Route path="danh-sach-thuc-don" element={<Navigate to="/quan-ly/dia-diem-poi/danh-sach-poi" replace />} />
            <Route path="them-thuc-don" element={<Navigate to="/quan-ly/dia-diem-poi/danh-sach-poi" replace />} />

            {/* Poi owner registration features */}
            <Route path="don-dang-ky-chu-quan">
              <Route
                path="danh-sach-don-dang-ky"
                element={<PoiOwnerRegistrationsPage />}
              />
            </Route>

            {/* Role features */}
            <Route path="quyen-han">
              <Route path="danh-sach-vai-tro" element={<RolesPage />} />
              <Route
                path="danh-sach-vai-tro/:id"
                element={<RoleFormPage mode="edit" />}
              />
              <Route
                path="them-vai-tro"
                element={<RoleFormPage mode="create" />}
              />
            </Route>

            {/* Review poi submission features */}
            <Route path="don-dang-ky-poi">
              <Route
                path="danh-sach-don-poi"
                element={<PoiSubmissionListPage />}
              />
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

            {/* poi owner features */}
            <Route path="chuc-nang-chu-quan">
              <Route path="poi-cua-toi" element={<PoiSubmissionPage />} />
              <Route path="poi-cua-toi/:id" element={<OwnerPoiDetailPage />} />
              <Route
                path="gui-yeu-cau-them-poi"
                element={<PoiSubmissionRegisterPage />}
              />
              <Route
                path="don-dang-ky-poi"
                element={<OwnerPoiSubmissionsPage />}
              />
              <Route path="thuc-don-cua-toi" element={<MenuItemsPage />} />
              <Route path="thuc-don-cua-toi/:id/chinh-sua" element={<MenuItemRequestPage />} />
              <Route
                path="gui-yeu-cau-thuc-don"
                element={<MenuItemRequestPage />}
              />
            </Route>

            {/* admin user features */}
            <Route path="nguoi-dung">
              <Route path="danh-sach-nguoi-dung" element={<AdminUsersPage />} />
              <Route path="them-nguoi-dung" element={<AdminUserCreatePage />} />
              <Route path=":id/chinh-sua" element={<AdminUserEditPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
