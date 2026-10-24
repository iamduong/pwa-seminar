import { BrowserRouter, Navigate, Route, Routes } from "react-router";

// Protect router component
import { ProtectedRoute } from "#components/auth/ProtectedRoute";
// Layout 
import { AdminLayout } from "#components/layout/AdminLayout";
import { UserLayout } from "#components/layout/UserLayout";
// Admin page
import { AdminUsersPage } from "./pages/admin-users/AdminUsersPage";
import { LoginPage } from "./pages/authorize/LoginPage";
import { RegisterPage } from "./pages/authorize/RegisterPage";
import { OwnerPoisPage } from "./pages/owner/OwnerPoisPage";
import { NewPoiSubmissionPage } from "./pages/owner/NewPoiSubmissionPage";
import { OwnerPoiDetailPage } from "./pages/owner/OwnerPoiDetailPage";
import PoiRegistrationsPage from "./pages/poi-registrations/PoiRegistrationsPage";
import { PoiRegistrationDetailPage } from "./pages/poi-registrations/PoiRegistrationDetailPage";
// Client page
import HomePage from "./pages/HomePage";
import { ProfilePage } from "./pages/client/ProfilePage";
import { RegisterOwnerPage } from "./pages/client/RegisterOwnerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routers */}
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/mon-an" element={<HomePage />} />
            <Route path="/gan-toi" element={<HomePage />} />
            <Route path="/quet-qr" element={<HomePage />} />
            <Route path="/ho-so" element={<ProfilePage />} />

            <Route
              path="/dang-ky-chu-quan"
              element={<RegisterOwnerPage />}
            />
          </Route>

          <Route path="/quan-ly" element={<AdminLayout />}>
            <Route path="danh-sach-nguoi-dung" element={<AdminUsersPage />} />

            <Route path="danh-sach-poi" element={<PoiRegistrationsPage />} />
            <Route path="danh-sach-poi/:submissionId" element={<PoiRegistrationDetailPage />}/>
            <Route path="danh-sach-poi/them-poi" element={<PoiRegistrationDetailPage />}/>

            <Route path="poi-cua-toi" element={<OwnerPoisPage />} />
            <Route
              path="them-poi/:poiId"
              element={<OwnerPoiDetailPage />}
            />
            <Route
                path="gui-yeu-cau-poi"
                element={<NewPoiSubmissionPage />}
              />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
